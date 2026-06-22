import http from "node:http";
import { URL } from "node:url";

const PORT = process.env.PORT || 10000;
const TEMPMAIL = "https://api.internal.temp-mail.io/api/v3";
const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

function extractOtp(text) {
  const patterns = [
    /\b(\d{6})\b/, /\b(\d{4})\b/, /\b(\d{8})\b/,
    /code[:\s]+([A-Z0-9]{4,8})/i, /OTP[:\s]+([A-Z0-9]{4,8})/i,
    /verification[:\s]+([A-Z0-9]{4,8})/i, /token[:\s]+([A-Z0-9]{4,8})/i,
    /pin[:\s]+([0-9]{4,6})/i, /كود[:\s]+([0-9]{4,8})/, /رمز[:\s]+([0-9]{4,8})/,
  ];
  for (const p of patterns) { const m = text.match(p); if (m) return m[1]; }
  return null;
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
  res.end(body);
}

async function readBody(req) {
  return new Promise(resolve => {
    const chunks = [];
    req.on("data", d => chunks.push(d));
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { send(res, 204, {}); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // GET /api/healthz
    if (method === "GET" && path === "/api/healthz") {
      send(res, 200, { status: "ok" }); return;
    }

    // GET /api/domains
    if (method === "GET" && path === "/api/domains") {
      const r = await fetch(`${TEMPMAIL}/domains`, { headers: JSON_HEADERS });
      if (!r.ok) { send(res, 500, { error: "Failed to fetch domains" }); return; }
      const data = await r.json();
      const raw = Array.isArray(data) ? data : (data.domains ?? []);
      const domains = raw.map(e => ({ name: typeof e.name === "string" ? e.name : e.name?.name }))
        .filter(e => e.name && typeof e.name === "string");
      send(res, 200, domains); return;
    }

    // POST /api/emails
    if (method === "POST" && path === "/api/emails") {
      const body = await readBody(req);
      const payload = body.domain ? { domain: body.domain } : {};
      const r = await fetch(`${TEMPMAIL}/email/new`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) });
      if (!r.ok) { send(res, 500, { error: "Failed to create temporary email" }); return; }
      const data = await r.json();
      const now = new Date();
      send(res, 201, { id: data.email, address: data.email, token: data.token, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString() });
      return;
    }

    // GET /api/emails/:id/messages/:messageId
    const msgMatch = path.match(/^\/api\/emails\/([^/]+)\/messages\/([^/]+)$/);
    if (method === "GET" && msgMatch) {
      const emailAddress = decodeURIComponent(msgMatch[1]);
      const messageId = decodeURIComponent(msgMatch[2]);
      const token = req.headers["x-email-token"];
      if (!token) { send(res, 401, { error: "Missing x-email-token header" }); return; }
      const r = await fetch(`${TEMPMAIL}/email/${encodeURIComponent(emailAddress)}/messages`, { headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` } });
      if (!r.ok) { send(res, r.status === 401 ? 401 : 500, { error: "Failed to fetch messages" }); return; }
      const all = await r.json();
      const msg = all.find(m => m.id === messageId);
      if (!msg) { send(res, 404, { error: "Message not found" }); return; }
      const bodyText = msg.body_text ?? (msg.body_html ? stripHtml(msg.body_html) : "");
      send(res, 200, { id: msg.id, from: msg.from ?? "Unknown", subject: msg.subject ?? "(no subject)", body: msg.body_html ?? bodyText, receivedAt: msg.created_at, otp: extractOtp(bodyText + " " + msg.subject) });
      return;
    }

    // GET /api/emails/:id/messages
    const msgsMatch = path.match(/^\/api\/emails\/([^/]+)\/messages$/);
    if (method === "GET" && msgsMatch) {
      const emailAddress = decodeURIComponent(msgsMatch[1]);
      const token = req.headers["x-email-token"];
      if (!token) { send(res, 401, { error: "Missing x-email-token header" }); return; }
      const r = await fetch(`${TEMPMAIL}/email/${encodeURIComponent(emailAddress)}/messages`, { headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` } });
      if (!r.ok) { send(res, r.status === 401 ? 401 : 500, { error: "Failed to fetch messages" }); return; }
      const raw = await r.json();
      const messages = raw.map(msg => {
        const text = msg.body_text ?? (msg.body_html ? stripHtml(msg.body_html) : "");
        return { id: msg.id, from: msg.from ?? "Unknown", subject: msg.subject ?? "(no subject)", intro: text.substring(0, 200), receivedAt: msg.created_at, hasOtp: !!extractOtp(text + " " + msg.subject) };
      });
      send(res, 200, messages); return;
    }

    // GET /api/emails/:id/otp
    const otpMatch = path.match(/^\/api\/emails\/([^/]+)\/otp$/);
    if (method === "GET" && otpMatch) {
      const emailAddress = decodeURIComponent(otpMatch[1]);
      const token = req.headers["x-email-token"];
      if (!token) { send(res, 401, { error: "Missing x-email-token header" }); return; }
      const r = await fetch(`${TEMPMAIL}/email/${encodeURIComponent(emailAddress)}/messages`, { headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` } });
      if (!r.ok) { send(res, 500, { error: "Failed to fetch messages" }); return; }
      const all = await r.json();
      for (const msg of all.slice(0, 3)) {
        const text = msg.body_text ?? (msg.body_html ? stripHtml(msg.body_html) : "");
        const otp = extractOtp(text + " " + msg.subject);
        if (otp) { send(res, 200, { otp, source: msg.from ?? null, foundIn: msg.subject ?? null }); return; }
      }
      send(res, 200, { otp: null, source: null, foundIn: null }); return;
    }

    send(res, 404, { error: "Not found" });
  } catch (err) {
    send(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`OTP Bot API running on port ${PORT}`);
});
