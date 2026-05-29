import { useState, useRef, useEffect } from "react";
import { Copy, TerminalSquare, RotateCcw, ChevronDown, Globe, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useListDomains } from "@workspace/api-client-react";
import type { EmailAccount } from "@workspace/api-client-react";

interface EmailDisplayProps {
  account: EmailAccount | null;
  onGenerate: (domain?: string) => void;
  isGenerating: boolean;
  generateError?: string | null;
}

const MICROSOFT_DOMAINS = [
  "outlook.com",
  "outlook.sa",
  "outlook.de",
  "outlook.fr",
  "outlook.co.uk",
  "outlook.jp",
  "outlook.com.br",
  "live.com",
  "live.co.uk",
  "msn.com",
  "passport.com",
];

const TRULY_BLOCKED = ["gmail.com", "yahoo.com", "icloud.com", "hotmail.com"];

export function EmailDisplay({ account, onGenerate, isGenerating, generateError }: EmailDisplayProps) {
  const { toast } = useToast();
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [showDomains, setShowDomains] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: domains = [], isLoading: isLoadingDomains } = useListDomains();

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.address);
    toast({ title: "تم النسخ", description: "تم نسخ البريد الإلكتروني." });
  };

  const handleGenerate = () => {
    onGenerate(selectedDomain || undefined);
  };

  const handleCustomDomainConfirm = () => {
    const raw = customInput.trim().toLowerCase().replace(/^@/, "");
    if (!raw) return;

    if (TRULY_BLOCKED.includes(raw)) {
      setCustomError(`@${raw} محجوب — نطاق شخصي غير مدعوم`);
      return;
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw)) {
      setCustomError("نطاق غير صالح — مثال: example.com");
      return;
    }

    setCustomError("");
    setSelectedDomain(raw);
    setCustomInput("");
    setShowDomains(false);
  };

  const handleSelectPreset = (name: string) => {
    setSelectedDomain(name);
    setCustomError("");
    setCustomInput("");
    setShowDomains(false);
  };

  const handleClearDomain = () => {
    setSelectedDomain("");
    setCustomError("");
    setCustomInput("");
    setShowDomains(false);
  };

  useEffect(() => {
    if (showDomains) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showDomains]);

  const isMicrosoftDomain = MICROSOFT_DOMAINS.includes(selectedDomain);
  const isCustomDomain =
    selectedDomain &&
    !domains.find((d) => d.name === selectedDomain) &&
    !MICROSOFT_DOMAINS.includes(selectedDomain);

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 flex flex-col gap-3 relative overflow-hidden group">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground uppercase text-xs tracking-wider font-mono">
          <TerminalSquare className="w-4 h-4 text-primary shrink-0" />
          <span>الجلسة النشطة</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Domain picker */}
          <div className="relative">
            <button
              onClick={() => setShowDomains((v) => !v)}
              disabled={isGenerating}
              className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded px-2.5 py-1.5 transition-colors disabled:opacity-50"
            >
              <Globe className="w-3 h-3 text-primary shrink-0" />
              <span
                className={`max-w-[140px] truncate ${
                  isMicrosoftDomain
                    ? "text-blue-400"
                    : isCustomDomain
                    ? "text-yellow-400"
                    : selectedDomain
                    ? "text-primary"
                    : ""
                }`}
              >
                {selectedDomain ? `@${selectedDomain}` : "نطاق تلقائي"}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showDomains ? "rotate-180" : ""}`}
              />
            </button>

            {showDomains && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-md shadow-xl w-64 max-h-[420px] overflow-y-auto">
                {/* Custom domain input */}
                <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                    نطاق مخصص
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                        @
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={customInput}
                        onChange={(e) => {
                          setCustomInput(e.target.value);
                          setCustomError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCustomDomainConfirm();
                        }}
                        placeholder="example.com"
                        className="w-full bg-background border border-border rounded pl-5 pr-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      onClick={handleCustomDomainConfirm}
                      className="px-2 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded text-primary transition-colors"
                      title="تطبيق"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {customError && (
                    <div className="flex items-start gap-1.5 mt-1.5 px-1">
                      <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                      <span className="text-[10px] font-mono text-destructive leading-tight">
                        {customError}
                      </span>
                    </div>
                  )}
                </div>

                {/* Auto option */}
                <div className="border-b border-border pb-1 pt-1">
                  <button
                    onClick={handleClearDomain}
                    className={`w-full text-left px-3 py-2 font-mono text-xs hover:bg-muted transition-colors flex items-center gap-2 ${
                      selectedDomain === "" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    Auto (عشوائي)
                  </button>
                </div>

                {/* Microsoft domains */}
                <div className="border-b border-border pb-1">
                  <div className="text-[10px] font-mono text-blue-400/80 uppercase tracking-widest px-3 pt-2 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    Microsoft Domains
                  </div>
                  {MICROSOFT_DOMAINS.map((d) => (
                    <button
                      key={d}
                      onClick={() => handleSelectPreset(d)}
                      className={`w-full text-left px-3 py-1.5 font-mono text-xs hover:bg-muted transition-colors flex items-center gap-2 ${
                        selectedDomain === d ? "text-blue-400" : "text-muted-foreground"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      @{d}
                    </button>
                  ))}
                </div>

                {/* Temp-mail domains */}
                <div>
                  <div className="text-[10px] font-mono text-primary/70 uppercase tracking-widest px-3 pt-2 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    نطاقات مؤقتة
                  </div>
                  {isLoadingDomains ? (
                    <div className="px-3 py-2 text-xs font-mono text-muted-foreground animate-pulse">
                      جاري التحميل...
                    </div>
                  ) : (
                    domains.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => handleSelectPreset(d.name)}
                        className={`w-full text-left px-3 py-1.5 font-mono text-xs hover:bg-muted transition-colors flex items-center gap-2 ${
                          selectedDomain === d.name ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        @{d.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="font-mono text-xs uppercase shrink-0"
          >
            <RotateCcw
              className={`w-3 h-3 mr-1.5 ${isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating ? "جاري الإنشاء..." : "توليد جديد"}
          </Button>
        </div>
      </div>

      {/* Selected domain hint */}
      {selectedDomain && (
        <div
          className={`text-[10px] font-mono uppercase tracking-widest -mt-1 flex items-center gap-1 ${
            isMicrosoftDomain
              ? "text-blue-400/70"
              : isCustomDomain
              ? "text-yellow-400/70"
              : "text-primary/60"
          }`}
        >
          {(isMicrosoftDomain || isCustomDomain) && (
            <AlertCircle className="w-2.5 h-2.5" />
          )}
          {isMicrosoftDomain
            ? `↳ نطاق Microsoft — قد يُقبل في المنصات الكبرى`
            : isCustomDomain
            ? "↳ نطاق مخصص — قد لا يكون مدعوماً"
            : `↳ سيُستخدم نطاق @${selectedDomain}`}
        </div>
      )}

      {/* Generate error */}
      {generateError && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded px-3 py-2 -mt-1">
          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="font-mono text-xs text-destructive">{generateError}</span>
        </div>
      )}

      {/* Email + copy button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 min-w-0 relative">
          <div className="absolute inset-0 bg-primary/10 rounded-md -z-10 group-hover:bg-primary/20 transition-colors" />
          <div className="font-mono text-sm sm:text-xl md:text-2xl text-primary font-bold py-3 px-3 border border-primary/20 rounded-md shadow-[0_0_15px_rgba(0,255,136,0.08)] break-all leading-snug">
            {account ? account.address : "NO_ACTIVE_EMAIL"}
          </div>
        </div>

        <Button
          size="default"
          onClick={handleCopy}
          disabled={!account}
          className="w-full sm:w-auto font-mono uppercase tracking-wider shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
      </div>

      {/* Status row */}
      {account && (
        <div className="text-xs font-mono text-muted-foreground flex justify-between">
          <span>الحالة: متصل</span>
          <span>ينتهي: {new Date(account.expiresAt).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDomains && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDomains(false)} />
      )}
    </div>
  );
}
