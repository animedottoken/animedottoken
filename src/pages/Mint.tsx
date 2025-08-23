import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { Zap, Coins, Users, Layers, FileImage } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useNavigate } from "react-router-dom";
export default function Mint() {
  const { connected } = useSolanaWallet();
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Mint NFTs | Anime Token - Create Your Digital Collection</title>
        <meta name="description" content="Mint exclusive anime NFTs on Solana blockchain. Create unique digital collectibles with low fees and instant transactions." />
        <meta name="keywords" content="NFT minting, Solana NFT, anime NFT, blockchain, digital collectibles" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header for disconnected users */}
          {!connected && (
            <div className="text-center mb-8 pt-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                Mint NFTs & Collections
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Welcome, Creator! This is your studio for launching original anime art on Solana. Start by creating a collection to organize your work, or mint a single NFT right away.
              </p>
            </div>
          )}

          {/* Intro: wallet connect gate */}
          {!connected && (
            <Card className="max-w-3xl mx-auto mb-12">
              <CardContent className="py-10 text-center">
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6">Connect your Solana wallet to start creating NFT collections and minting NFTs.</p>
                <SolanaWalletButton />
              </CardContent>
            </Card>
          )}

          {/* Choose Your Path */}
          {connected && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  Choose Your Path
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Select how you want to create your anime NFTs on Solana
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Create Collection & Mint NFT */}
                <Card 
                  className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/mint/collection')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/mint/collection');
                    }
                  }}
                >
                  <CardContent className="p-8 text-center h-full flex flex-col">
                    <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                      <Layers className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Mint Collection + NFT</h3>
                    <div className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit mx-auto">
                      RECOMMENDED
                    </div>
                    <p className="text-muted-foreground mb-6 flex-1">
                      Launch a full collection with multiple NFTs, royalties, and professional branding. Perfect for serious creators and projects.
                    </p>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/mint/collection');
                      }}
                    >
                      Start Collection Mint
                    </Button>
                  </CardContent>
                </Card>

                {/* Mint NFT Now */}
                <Card 
                  className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/mint/nft')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/mint/nft');
                    }
                  }}
                >
                  <CardContent className="p-8 text-center h-full flex flex-col">
                    <div className="bg-accent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                      <FileImage className="h-10 w-10 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Mint Standalone NFT</h3>
                    <div className="text-muted-foreground text-xs font-medium px-3 py-1 mb-4">
                      Without Collection
                    </div>
                    <p className="text-muted-foreground mb-6 flex-1">
                      Quick and simple NFT creation. Upload your art and mint immediately without setting up a collection.
                    </p>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/mint/nft');
                      }}
                    >
                      Mint Standalone NFT
                    </Button>
                  </CardContent>
                </Card>
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
                  Mint your NFTs in seconds on Solana's high-performance blockchain.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Coins className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Low Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Pay fractions of a cent in transaction fees.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Launch your collection and connect with a vibrant community of anime fans and NFT collectors.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}