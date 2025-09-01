import { Helmet } from "react-helmet-async";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, Code, FileText, AlertTriangle, Copy, ArrowLeft, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SecurityReportsDetails } from "@/components/SecurityReportsDetails";
import { TrustSecuritySection } from "@/components/TrustSecuritySection";
import { ANIME_MINT_ADDRESS, CREATOR_WALLET_ADDRESS, TREASURY_WALLET_ADDRESS } from "@/constants/token";
import { 
  METAPLEX_AUCTION_HOUSE_PROGRAM_ID, 
  METAPLEX_TOKEN_METADATA_PROGRAM_ID,
  COMMIT_HASH 
} from "@/constants/programs";

export default function Trust() {
  const navigate = useNavigate();

  const handleReportRisk = () => {
    window.open('https://discord.gg/HmSJdT5MRX', '_blank');
  };

  const handleBackToSecurity = () => {
    navigate('/#security');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Trust & Security | ANIME.TOKEN</title>
        <meta name="description" content="Complete transparency and security information for ANIME.TOKEN marketplace. View our security measures, program IDs, and audit status." />
        <meta name="keywords" content="ANIME token security, audit, transparency, smart contract, Solana security" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToSecurity}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Security Section
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Trust & Security Center</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete transparency for our marketplace security, smart contracts, and operational measures. 
            Built on battle-tested Metaplex protocols.
          </p>
        </div>

        {/* Program IDs & Technical Transparency */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Program IDs & Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Metaplex Auction House</h4>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {METAPLEX_AUCTION_HOUSE_PROGRAM_ID}
                </code>
                <Badge variant="secondary" className="text-xs">Battle-tested Protocol</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Token Metadata Program</h4>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {METAPLEX_TOKEN_METADATA_PROGRAM_ID}
                </code>
                <Badge variant="secondary" className="text-xs">Solana Standard</Badge>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Current Build</h4>
                  <code className="text-xs text-muted-foreground">
                    {COMMIT_HASH}
                  </code>
                </div>
                <div className="flex gap-2">
                  {import.meta.env.VITE_GITHUB_REPO_URL && (
                    <Button asChild variant="outline" size="sm">
                      <a 
                        href={import.meta.env.VITE_GITHUB_REPO_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Code className="h-4 w-4" />
                        View Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <a 
                      href={`https://solscan.io/account/${TREASURY_WALLET_ADDRESS}#portfolio`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      View Ecosystem Fund
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Architecture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Non-Custodial</h4>
                <p className="text-sm text-muted-foreground">
                  Your assets remain in your wallet. We never hold custody of your funds or NFTs.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Code className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Metaplex Standard</h4>
                <p className="text-sm text-muted-foreground">
                  Built on industry-standard Metaplex protocols used by major platforms.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Open Source</h4>
                <p className="text-sm text-muted-foreground">
                  All code is publicly auditable and follows security best practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Security Section */}
        <TrustSecuritySection 
          tokenAddress={ANIME_MINT_ADDRESS}
          creatorWalletUrl={`https://solscan.io/account/${CREATOR_WALLET_ADDRESS}#portfolio`}
          showTreasuryDetails={true}
        />

        {/* Security Reports */}
        <SecurityReportsDetails tokenAddress={ANIME_MINT_ADDRESS} />

        {/* Risk Disclosure */}
        <Card className="mt-8 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Important Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-700 space-y-3">
            <p>
              <strong>DeFi Risk:</strong> All DeFi interactions carry inherent risks including smart contract vulnerabilities, 
              market volatility, and potential loss of funds. Never invest more than you can afford to lose.
            </p>
            <p>
              <strong>Security Updates:</strong> We continuously monitor for new threats and update our security measures. 
              Join our Discord for real-time security announcements.
            </p>
            <p>
              <strong>Community Responsibility:</strong> Help keep our ecosystem safe by reporting suspicious activity 
              or potential vulnerabilities to our team immediately.
            </p>
          </CardContent>
        </Card>

        {/* Contact for Security Issues */}
        <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Found a Security Issue?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We take security seriously. Report vulnerabilities responsibly through our Discord.
          </p>
          <Button onClick={handleReportRisk} className="gap-2">
            <Shield className="h-4 w-4" />
            Report Security Issue
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={handleBackToSecurity}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Security Section
          </Button>
        </div>
      </div>
    </div>
  );
}