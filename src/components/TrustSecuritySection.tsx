import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SecurityReportsDetails } from "@/components/SecurityReportsDetails";
import { ExternalLink, ChevronDown, Copy, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useTokenHolders } from "@/hooks/useTokenHolders";
import { toast } from "sonner";
import { useViewMode } from "@/contexts/ViewModeContext";

interface TrustSecuritySectionProps {
  tokenAddress: string;
  creatorWalletUrl: string;
}

export function TrustSecuritySection({ tokenAddress, creatorWalletUrl }: TrustSecuritySectionProps) {
  const { viewMode } = useViewMode();
  const isOverview = viewMode === 'overview';

  return (
    <section className="mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
      <div className={`mb-12 ${isOverview ? 'text-left' : 'text-center'}`}>
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isOverview ? 'flex items-center' : 'flex items-center justify-center'} gap-3`}>
          <Shield className="w-10 h-10 text-violet-400" />
          Built on a Foundation of Trust & Transparency
        </h2>
        <p className={`text-lg text-muted-foreground ${isOverview ? '' : 'max-w-3xl mx-auto'}`}>
          $ANIME leverages the publicly audited, battle-tested Metaplex protocol used by thousands of Solana projects. 100% LP burned, creator holds zero tokens. Everything is verifiable on-chain through radical transparency.
        </p>
      </div>
    </section>
  );
}