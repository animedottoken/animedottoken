import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Palette, ShoppingBag, Coins, ArrowRight, Zap, Users, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export function NFTPreviewSection() {
  const navigate = useNavigate();
  const [box1Open, setBox1Open] = useState(false);
  const [box2Open, setBox2Open] = useState(false);

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
        <Link 
          to="/mint" 
          className="block"
        >
          <Card 
            className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            role="button"
            tabIndex={0}
          >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Coins className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Turn Your Art into an NFT</CardTitle>
            <Collapsible open={box1Open} onOpenChange={setBox1Open}>
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="px-0 mt-2">
                  {box1Open ? "Hide details" : "Show details"} 
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${box1Open ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardDescription className="text-base mt-2">
                  Our guided tool helps you turn your creation into a unique, verifiable digital collectible on the Solana blockchain. Features include free creation (pay only network fees), automatic royalty settings, and custom traits.
                </CardDescription>
              </CollapsibleContent>
            </Collapsible>
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
        </Link>

        {/* Marketplace Card */}
        <Link 
          to="/marketplace" 
          className="block"
        >
          <Card 
            className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            role="button"
            tabIndex={0}
          >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">The Marketplace</CardTitle>
            <Collapsible open={box2Open} onOpenChange={setBox2Open}>
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="px-0 mt-2">
                  {box2Open ? "Hide details" : "Show details"} 
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${box2Open ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardDescription className="text-base mt-2">
                  Discover and collect unique digital assets from talented creators in our ecosystem. Every piece is verified on-chain for authenticity, with instant, secure transactions.
                </CardDescription>
              </CollapsibleContent>
            </Collapsible>
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
        </Link>
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