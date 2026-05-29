import { Copy, ScanSearch, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { OtpResult } from "@workspace/api-client-react";

interface OtpDisplayProps {
  otpResult: OtpResult | null | undefined;
  isLoading: boolean;
}

export function OtpDisplay({ otpResult, isLoading }: OtpDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (!otpResult?.otp) return;
    navigator.clipboard.writeText(otpResult.otp);
    toast({ title: "OTP Copied", description: "Code copied to clipboard." });
  };

  if (!otpResult?.otp && !isLoading) {
    return (
      <div className="bg-card/50 border border-border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[130px] lg:h-full">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ScanSearch className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-mono text-xs uppercase text-muted-foreground mb-1">OTP Scanner</h3>
          <p className="text-muted-foreground text-xs">Monitoring for verification codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden min-h-[130px] lg:h-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
        {isLoading && <div className="h-full bg-primary animate-pulse w-1/2" />}
      </div>

      <div className="flex flex-col items-center gap-2 z-10 w-full">
        <div className="flex items-center gap-2 text-primary uppercase text-xs tracking-widest font-mono font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Code Extracted</span>
        </div>

        <div
          className="relative group w-full max-w-xs cursor-pointer"
          onClick={handleCopy}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 blur opacity-70 group-hover:opacity-100 transition duration-500 rounded-lg" />
          <div className="relative bg-black border border-primary/50 rounded-lg px-4 py-4 font-mono text-4xl sm:text-5xl font-bold tracking-widest text-primary shadow-2xl flex items-center justify-center">
            {isLoading && !otpResult?.otp ? (
              <span className="opacity-50 text-2xl">...</span>
            ) : (
              otpResult?.otp
            )}
          </div>
        </div>

        {otpResult?.source && (
          <div className="text-xs font-mono text-muted-foreground uppercase">
            From: <span className="text-primary/70 break-all">{otpResult.source}</span>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        onClick={handleCopy}
        disabled={!otpResult?.otp}
        className="font-mono uppercase text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary z-10"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copy Code
      </Button>
    </div>
  );
}
