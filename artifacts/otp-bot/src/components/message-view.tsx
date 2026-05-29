import { useFetchMessage } from "@workspace/api-client-react";
import { Copy, ShieldCheck, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MessageViewProps {
  accountId: string | null;
  messageId: string | null;
  token: string | null;
}

export function MessageView({ accountId, messageId, token }: MessageViewProps) {
  const { toast } = useToast();

  const { data: message, isLoading } = useFetchMessage(
    accountId || "",
    messageId || "",
    {
      query: {
        enabled: !!accountId && !!messageId && !!token,
        queryKey: ["message", accountId, messageId],
      },
      request: { headers: { "x-email-token": token || "" } },
    }
  );

  const handleCopyOtp = () => {
    if (!message?.otp) return;
    navigator.clipboard.writeText(message.otp);
    toast({ title: "OTP Copied", description: "Code copied to clipboard." });
  };

  if (!messageId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 h-full bg-card">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
          <Mail className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Select a message to view
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-card">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-card">
        <div className="font-mono text-xs text-muted-foreground uppercase">Failed to load message</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-card">
      {/* Message header */}
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate text-sm sm:text-base">{message.subject}</h2>
            <div className="text-xs text-muted-foreground font-mono mt-1 flex gap-4 flex-wrap">
              <span>From: <span className="text-foreground/70 break-all">{message.from}</span></span>
              <span>{format(new Date(message.receivedAt), 'MMM d, yyyy HH:mm:ss')}</span>
            </div>
          </div>

          {message.otp && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-md px-3 py-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-mono font-bold text-primary text-lg tracking-widest">{message.otp}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-primary hover:bg-primary/20"
                onClick={handleCopyOtp}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Message body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {message.body && message.body.includes("<") ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-foreground [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline"
            dangerouslySetInnerHTML={{ __html: message.body }}
          />
        ) : (
          <pre className="font-mono text-xs text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
            {message.body}
          </pre>
        )}
      </div>
    </div>
  );
}
