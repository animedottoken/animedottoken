import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, ShoppingBag, Coins, ArrowRight, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function NFTPreviewSection() {
  return (
    <section id="nft-preview-section" className="mx-auto mt-16 max-w-6xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">🎨</span>
          The Home for Anime NFTs on Solana
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Join the ANIME ecosystem by minting unique NFTs and trading in our marketplace. 
          Lightning-fast transactions with minimal fees on Solana blockchain.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Mint NFTs Card */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Coins className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mint Your NFTs</CardTitle>
            <CardDescription className="text-base">
              Create and mint your original anime-inspired art directly on Solana. Our tool makes it easy to add custom traits, set your own creator royalties, and launch your collection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-sm">FREE Minting (Gas only)</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm">On-Chain Creator Royalties</span>
              </div>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Custom Rarity Traits</span>
              </div>
            </div>
            
            <div className="pt-2">
              <Badge variant="secondary" className="mb-4">
                🔥 Live Now
              </Badge>
              <Link to="/mint" className="block">
                <Button className="w-full group-hover:scale-105 transition-transform">
                  Start Minting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Card */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">NFT Marketplace</CardTitle>
            <CardDescription className="text-base">
              Discover, buy, and sell unique anime NFTs from the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-sm">Instant Transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Curated Collections</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Community Trading</span>
              </div>
            </div>

            <div className="pt-2">
              <Badge variant="outline" className="mb-4">
                🛍️ Explore Now
              </Badge>
              <Link to="/marketplace" className="block">
                <Button variant="outline" className="w-full group-hover:scale-105 transition-transform">
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">FREE</div>
          <div className="text-sm text-muted-foreground">Mint Cost</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">⚡</div>
          <div className="text-sm text-muted-foreground">Instant</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">🔥</div>
          <div className="text-sm text-muted-foreground">Live</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">🎨</div>
          <div className="text-sm text-muted-foreground">Unique</div>
        </div>
      </div>
    </section>
  );
}