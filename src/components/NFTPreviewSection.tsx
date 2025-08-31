import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, ShoppingBag, Coins, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function NFTPreviewSection() {

  return (
    <section id="create-nfts" className="nft-preview-section mx-auto mt-16 max-w-6xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center justify-center gap-3">
          <Palette className="w-10 h-10 text-violet-400" />
          A Community-Owned NFT Ecosystem
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Mint and trade on a platform built for creators and collectors who value transparency and true ownership.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Mint NFTs Card */}
        <Card 
          className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/60"
        >
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Coins className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Turn Your Art into an NFT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-2">
            <Badge variant="secondary" className="mb-4">
              🔥 Live Now
            </Badge>
            <Button 
              className="w-full group-hover:scale-105 transition-transform"
              asChild
            >
              <Link to="/mint">
                Start Creating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
        </Card>

        {/* Marketplace Card */}
        <Card 
          className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/60"
        >
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">The Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-2">
            <Badge variant="outline" className="mb-4">
              🛍️ Explore Now
            </Badge>
            <Button 
              variant="outline" 
              className="w-full group-hover:scale-105 transition-transform"
              asChild
            >
              <Link to="/marketplace">
                Explore Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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