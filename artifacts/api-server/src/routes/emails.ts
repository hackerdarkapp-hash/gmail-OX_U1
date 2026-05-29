import { Router } from "express";

const router = Router();

const TEMPMAIL_BASE = "https://api.internal.temp-mail.io/api/v3";

const FETCH_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ─── OTP extraction ───────────────────────────────────────────────────────────

function extractOtp(text: string): string | null {
  const patterns = [
    /\b(\d{6})\b/,
    /\b(\d{4})\b/,
    /\b(\d{8})\b/,
    /code[:\s]+([A-Z0-9]{4,8})/i,
    /OTP[:\s]+([A-Z0-9]{4,8})/i,
    /verification[:\s]+([A-Z0-9]{4,8})/i,
    /token[:\s]+([A-Z0-9]{4,8})/i,
    /pin[:\s]+([0-9]{4,6})/i,
    /كود[:\s]+([0-9]{4,8})/,
    /رمز[:\s]+([0-9]{4,8})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Types from temp-mail.io ──────────────────────────────────────────────────

interface TempMailMessage {
  id: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  created_at: string;
}

// ─── GET /api/domains ─────────────────────────────────────────────────────────

router.get("/domains", async (req, res) => {
  try {
    const resp = await fetch(`${TEMPMAIL_BASE}/domains`, {
      headers: FETCH_HEADERS,
    });

    if (!resp.ok) {
      req.log.error({ status: resp.status }, "temp-mail.io domains fetch failed");
      res.status(500).json({ error: "Failed to fetch domains" });
      return;
    }

    type DomainEntry = { name: string | { name: string; type?: string } };
    const data = (await resp.json()) as DomainEntry[] | { domains?: DomainEntry[] };

    const raw: DomainEntry[] = Array.isArray(data)
      ? data
      : (data as { domains?: DomainEntry[] }).domains ?? [];

    const domains = raw
      .map((entry) => {
        const nameField = entry.name;
        if (typeof nameField === "string") return nameField;
        if (nameField && typeof nameField === "object") return nameField.name;
        return null;
      })
      .filter((n): n is string => typeof n === "string" && n.length > 0)
      .map((name) => ({ name }));

    res.json(domains);
  } catch (err) {
    req.log.error({ err }, "Error fetching domains");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/emails ─────────────────────────────────────────────────────────

router.post("/emails", async (req, res) => {
  try {
    const requestedDomain: string | undefined =
      typeof req.body?.domain === "string" && req.body.domain.trim()
        ? req.body.domain.trim()
        : undefined;

    const body: Record<string, unknown> = {};
    if (requestedDomain) {
      body.domain = requestedDomain;
    }

    const resp = await fetch(`${TEMPMAIL_BASE}/email/new`, {
      method: "POST",
      headers: FETCH_HEADERS,
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      req.log.error({ status: resp.status }, "temp-mail.io create failed");
      res.status(500).json({ error: "Failed to create temporary email" });
      return;
    }

    const data = (await resp.json()) as { email: string; token: string };
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    res.status(201).json({
      id: data.email,
      address: data.email,
      token: data.token,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error generating email");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/emails/:id/messages ────────────────────────────────────────────

router.get("/emails/:id/messages", async (req, res) => {
  const emailAddress = decodeURIComponent(req.params.id);
  const token = req.headers["x-email-token"] as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Missing x-email-token header" });
    return;
  }

  try {
    const resp = await fetch(
      `${TEMPMAIL_BASE}/email/${encodeURIComponent(emailAddress)}/messages`,
      { headers: { ...FETCH_HEADERS, Authorization: `Bearer ${token}` } },
    );

    if (!resp.ok) {
      req.log.error({ status: resp.status, emailAddress }, "Failed to fetch messages");
      res.status(resp.status === 401 ? 401 : 500).json({ error: "Failed to fetch messages" });
      return;
    }

    const raw = (await resp.json()) as TempMailMessage[];
    const messages = raw.map((msg) => {
      const text = msg.body_text ?? (msg.body_html ? stripHtml(msg.body_html) : "");
      const hasOtp = !!extractOtp(text + " " + msg.subject);
      return {
        id: msg.id,
        from: msg.from ?? "Unknown",
        subject: msg.subject ?? "(no subject)",
        intro: text.substring(0, 200),
        receivedAt: msg.created_at,
        hasOtp,
      };
    });

    res.json(messages);
  } catch (err) {
    req.log.error({ err, emailAddress }, "Error fetching messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/emails/:id/messages/:messageId ─────────────────────────────────

router.get("/emails/:id/messages/:messageId", async (req, res) => {
  const emailAddress = decodeURIComponent(req.params.id);
  const { messageId } = req.params;
  const token = req.headers["x-email-token"] as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Missing x-email-token header" });
    return;
  }

  try {
    const resp = await fetch(
      `${TEMPMAIL_BASE}/email/${encodeURIComponent(emailAddress)}/messages`,
      { headers: { ...FETCH_HEADERS, Authorization: `Bearer ${token}` } },
    );

    if (!resp.ok) {
      res.status(resp.status === 401 ? 401 : 500).json({ error: "Failed to fetch messages" });
      return;
    }

    const all = (await resp.json()) as TempMailMessage[];
    const msg = all.find((m) => m.id === messageId);

    if (!msg) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const body = msg.body_text ?? (msg.body_html ? stripHtml(msg.body_html) : "");
    const otp = extractOtp(body + " " + msg.subject);

    res.json({
      id: msg.id,
      from: msg.from ?? "Unknown",
      subject: msg.subject ?? "(no subject)",
      body: msg.body_html ?? body,
      receivedAt: msg.created_at,
      otp: otp ?? null,
    });
  } catch (err) {
    req.log.error({ err, emailAddress, messageId }, "Error fetching message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/emails/:id/otp ─────────────────────────────────────────────────

router.get("/emails/:id/otp", async (req, res) => {
  const emailAddress = decodeURIComponent(req.params.id);
  const token = req.headers["x-email-token"] as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Missing x-email-token header" });
    return;
  }

  try {
    const resp = await fetch(
      `${TEMPMAIL_BASE}/email/${encodeURIComponent(emailAddress)}/messages`,
      { headers: { ...FETCH_HEADERS, Authorization: `Bearer ${token}` } },
    );

    if (!resp.ok) {
      res.status(500).json({ error: "Failed to fetch messages" });
      return;
    }

    const all = (await resp.json()) as TempMailMessage[];
    if (!all.length) {
      res.json({ otp: null, source: null, foundIn: null });
      return;
    }

    for (const msg of all.slice(0, 3)) {
      const text = msg.body_text ?? (msg.body_html ? stripHtml(msg.body_html) : "");
      const otp = extractOtp(text + " " + msg.subject);
      if (otp) {
        res.json({
          otp,
          source: msg.from ?? null,
          foundIn: msg.subject ?? null,
        });
        return;
      }
    }

    res.json({ otp: null, source: null, foundIn: null });
  } catch (err) {
    req.log.error({ err, emailAddress }, "Error extracting OTP");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
