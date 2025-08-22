import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, ShoppingBag, Coins, ArrowRight, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NFTPreviewSection() {
  const navigate = useNavigate();

  return (
    <section id="create-nfts" className="nft-preview-section mx-auto mt-16 max-w-6xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">🎨</span>
          The Easiest Way to Create & Collect Anime Art NFTs
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Finally, a safe and simple platform for anime fans to turn their art into digital collectibles. No crypto experience needed—we guide you through every step.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Mint NFTs Card */}
        <Card 
          className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          role="button"
          tabIndex={0}
          onClick={() => {
            navigate('/mint');
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/mint');
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }
          }}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Coins className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Turn Your Art into an NFT</CardTitle>
            <CardDescription className="text-base">
              Have an original character or fan art you're proud of? Our guided tool helps you turn your creation into a unique, verifiable digital collectible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-sm">Free to Create (you only pay network fees)</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Earn Royalties on Future Sales</span>
              </div>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Add Custom Traits & Rarity</span>
              </div>
            </div>
            
            <div className="pt-2">
              <Badge variant="secondary" className="mb-4">
                🔥 Live Now
              </Badge>
              <Button 
                className="w-full group-hover:scale-105 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/mint');
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                }}
              >
                Start Creating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Card */}
        <Card 
          className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/marketplace')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/marketplace');
            }
          }}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">The Anime Art Marketplace</CardTitle>
            <CardDescription className="text-base">
              Discover and collect unique digital art from talented creators in the ANIME community. Every piece is verified on blockchain for authenticity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-sm">Instant & Secure Transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Curated & Verified Artists</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm">A Community of Fans & Collectors</span>
              </div>
            </div>

            <div className="pt-2">
              <Badge variant="outline" className="mb-4">
                🛍️ Explore Now
              </Badge>
              <Button 
                variant="outline" 
                className="w-full group-hover:scale-105 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/marketplace');
                }}
              >
                Explore the Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
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