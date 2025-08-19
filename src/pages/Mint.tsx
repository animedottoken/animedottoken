import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Users, Clock } from "lucide-react";

export default function Mint() {
  const { connected } = useSolanaWallet();

  return (
    <>
      <Helmet>
        <title>Mint NFTs | Anime Token - Create Your Digital Collection</title>
        <meta name="description" content="Mint exclusive anime NFTs on Solana blockchain. Create unique digital collectibles with low fees and instant transactions." />
        <meta name="keywords" content="NFT minting, Solana NFT, anime NFT, blockchain, digital collectibles" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Mint Anime NFTs
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Create exclusive digital collectibles on the Solana blockchain with lightning-fast transactions and minimal fees.
            </p>
            <div className="flex justify-center">
              <SolanaWalletButton />
            </div>
          </div>

          {connected ? (
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Minting Interface */}
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Zap className="h-6 w-6 text-primary" />
                    Live Mint
                  </CardTitle>
                  <CardDescription>
                    Mint from our exclusive anime collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">🎌</div>
                      <p className="text-sm text-muted-foreground">Mystery Anime NFT</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Price</span>
                      <span className="font-medium">0.1 SOL</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Supply</span>
                      <span className="font-medium">10,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Minted</span>
                      <span className="font-medium">2,347 / 10,000</span>
                    </div>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '23.47%' }}></div>
                  </div>

                  <Button className="w-full" size="lg" disabled>
                    <Coins className="mr-2 h-4 w-4" />
                    Mint Coming Soon
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Minting will be available once collection is deployed
                  </p>
                </CardContent>
              </Card>

              {/* Collection Info */}
              <Card className="border border-border/50 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Collection Details</CardTitle>
                  <CardDescription>
                    Everything you need to know about this drop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-background/50">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">10K</div>
                      <div className="text-sm text-muted-foreground">Total Supply</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-background/50">
                      <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">Soon</div>
                      <div className="text-sm text-muted-foreground">Go Live</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Hand-drawn Art</Badge>
                      <Badge variant="secondary">100+ Traits</Badge>
                      <Badge variant="secondary">Utility Token</Badge>
                      <Badge variant="secondary">Community Governance</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Roadmap</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>✅ Art Creation Complete</li>
                      <li>🔄 Smart Contract Deployment</li>
                      <li>⏳ Whitelist Opening</li>
                      <li>⏳ Public Mint Launch</li>
                      <li>⏳ Marketplace Integration</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Connect your Solana wallet to start minting exclusive anime NFTs and join our community.
                </p>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Mint your NFTs in seconds with Solana's high-performance blockchain
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Coins className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Low Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Pay fractions of cents in transaction fees, not dollars
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Join a vibrant community of anime fans and NFT collectors
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}