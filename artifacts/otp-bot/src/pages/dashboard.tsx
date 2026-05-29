import { useState, useEffect } from "react";
import { Terminal, Inbox, Mail } from "lucide-react";
import { useGenerateEmail, useListMessages, useExtractOtp } from "@workspace/api-client-react";
import type { EmailAccount } from "@workspace/api-client-react";

import { EmailDisplay } from "@/components/email-display";
import { OtpDisplay } from "@/components/otp-display";
import { MessageList } from "@/components/message-list";
import { MessageView } from "@/components/message-view";

type MobileTab = "inbox" | "message";

export function Dashboard() {
  const [account, setAccount] = useState<EmailAccount | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("inbox");

  const generateEmail = useGenerateEmail();

  const handleGenerate = (domain?: string) => {
    generateEmail.mutate(
      domain ? { domain } : undefined,
      {
        onSuccess: (data) => {
          setAccount(data);
          setSelectedMessageId(null);
          setMobileTab("inbox");
        },
      }
    );
  };

  const { data: messages = [], isLoading: isLoadingMessages } = useListMessages(
    account?.id || "",
    {
      query: {
        enabled: !!account?.id && !!account?.token,
        refetchInterval: 5000,
        queryKey: ["messages", account?.id],
      },
      request: { headers: { "x-email-token": account?.token || "" } },
    }
  );

  const { data: otpResult, isLoading: isLoadingOtp } = useExtractOtp(
    account?.id || "",
    {
      query: {
        enabled: !!account?.id && !!account?.token,
        refetchInterval: 5000,
        queryKey: ["otp", account?.id],
      },
      request: { headers: { "x-email-token": account?.token || "" } },
    }
  );

  useEffect(() => {
    if (messages.length > 0 && !selectedMessageId) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    setMobileTab("message");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/20 rounded flex items-center justify-center border border-primary/50">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-mono font-bold text-lg tracking-tight text-primary">OTP_BOT</h1>
        </div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse block" />
          System Online
        </div>
      </header>

      <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 gap-4 w-full max-w-[1400px] mx-auto">

        {/* Top row: email + OTP */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EmailDisplay
              account={account}
              onGenerate={(domain) => handleGenerate(domain)}
              isGenerating={generateEmail.isPending}
              generateError={
                generateEmail.isError
                  ? "فشل إنشاء الإيميل — النطاق المختار غير مدعوم، جرّب نطاقاً آخر"
                  : null
              }
            />
          </div>
          <div className="lg:col-span-1">
            <OtpDisplay
              otpResult={otpResult}
              isLoading={isLoadingOtp && !!account}
            />
          </div>
        </div>

        {/* Mobile: tab switcher */}
        <div className="flex md:hidden border border-border rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setMobileTab("inbox")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              mobileTab === "inbox"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Inbox {messages.length > 0 ? `(${messages.length})` : ""}
          </button>
          <button
            onClick={() => setMobileTab("message")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              mobileTab === "message"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Message
          </button>
        </div>

        {/* Mobile: single panel */}
        <div className="flex md:hidden flex-col border border-border rounded-lg overflow-hidden" style={{ minHeight: "55vh" }}>
          {mobileTab === "inbox" ? (
            <MessageList
              messages={messages}
              selectedId={selectedMessageId}
              onSelect={handleSelectMessage}
              isLoading={isLoadingMessages && !!account}
            />
          ) : (
            <div className="relative flex-1 flex flex-col h-full">
              {!account && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-sm z-10">
                  <div className="font-mono text-xs uppercase text-muted-foreground border border-border bg-background px-5 py-3 rounded-md text-center">
                    Generate an email to begin
                  </div>
                </div>
              )}
              <MessageView
                accountId={account?.id || null}
                messageId={selectedMessageId}
                token={account?.token || null}
              />
            </div>
          )}
        </div>

        {/* Desktop: side by side */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 flex-1" style={{ minHeight: "420px" }}>
          <div className="md:col-span-4 rounded-lg overflow-hidden border border-border flex flex-col">
            <MessageList
              messages={messages}
              selectedId={selectedMessageId}
              onSelect={handleSelectMessage}
              isLoading={isLoadingMessages && !!account}
            />
          </div>
          <div className="md:col-span-8 rounded-lg overflow-hidden border border-border flex flex-col relative">
            {!account && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-sm z-10">
                <div className="font-mono text-sm uppercase text-muted-foreground border border-border bg-background px-6 py-4 rounded-md">
                  Generate an email to begin monitoring
                </div>
              </div>
            )}
            <MessageView
              accountId={account?.id || null}
              messageId={selectedMessageId}
              token={account?.token || null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
