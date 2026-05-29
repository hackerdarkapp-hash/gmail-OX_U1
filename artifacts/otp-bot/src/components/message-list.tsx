import { format } from "date-fns";
import { Mail, Clock, ShieldAlert } from "lucide-react";
import type { EmailMessage } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: EmailMessage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function MessageList({ messages, selectedId, onSelect, isLoading }: MessageListProps) {
  if (isLoading && messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 font-mono text-xs uppercase tracking-wider text-muted-foreground flex justify-between">
          <span>Inbox (0)</span>
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Polling</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-4">
          <div className="w-12 h-12 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
            <Clock className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="font-mono text-sm uppercase">Waiting for messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 font-mono text-xs uppercase tracking-wider text-muted-foreground flex justify-between">
          <span>Inbox (0)</span>
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Polling</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-4">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="font-mono text-sm uppercase">Inbox Empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border bg-muted/20 font-mono text-xs uppercase tracking-wider text-muted-foreground flex justify-between sticky top-0 z-10">
        <span>Inbox ({messages.length})</span>
        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Polling</span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y divide-border">
          {messages.map((message) => (
            <button
              key={message.id}
              onClick={() => onSelect(message.id)}
              className={`p-4 text-left transition-colors hover:bg-muted/50 focus:outline-none flex flex-col gap-2 ${
                selectedId === message.id 
                  ? "bg-muted border-l-2 border-l-primary" 
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="font-medium text-sm truncate text-foreground flex-1">
                  {message.from}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono whitespace-nowrap shrink-0">
                  {format(new Date(message.receivedAt), 'HH:mm:ss')}
                </div>
              </div>
              
              <div className="font-medium text-sm text-foreground/80 truncate w-full flex items-center gap-2">
                {message.hasOtp && <ShieldAlert className="w-3 h-3 text-primary shrink-0" />}
                <span className="truncate">{message.subject}</span>
              </div>
              
              <div className="text-xs text-muted-foreground line-clamp-2 w-full">
                {message.intro}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
