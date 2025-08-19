import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { MintingInterface } from "@/components/MintingInterface";
import { Zap, Coins, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
            <div className="flex justify-center mb-12">
              <MintingInterface collectionId="sample-collection" />
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