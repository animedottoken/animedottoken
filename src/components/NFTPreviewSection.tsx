import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Palette, ShoppingBag, Coins, ArrowRight, Zap, Users, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useViewMode } from "@/contexts/ViewModeContext";

export function NFTPreviewSection() {
  const { viewMode } = useViewMode();
  const [box1Open, setBox1Open] = useState(false);
  const [box2Open, setBox2Open] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isOverview = viewMode === 'overview';

  // Set default open state based on view mode
  useEffect(() => {
    setBox1Open(viewMode === 'full');
    setBox2Open(viewMode === 'full');
    setDetailsOpen(viewMode !== 'overview');
  }, [viewMode]);

  return (
    <section id="create-nfts" className="nft-preview-section mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
      <div className={`mb-12 ${isOverview ? 'text-left' : 'text-center'}`}>
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isOverview ? 'flex items-center' : 'flex items-center justify-center'} gap-3`}>
          <Palette className="w-10 h-10 text-violet-400" />
          A Community-Owned NFT Ecosystem
        </h2>
        <p className={`text-lg text-muted-foreground ${isOverview ? '' : 'max-w-3xl mx-auto'}`}>
          Mint and trade on a platform built for creators and collectors who value transparency and true ownership.
        </p>
        
        {isOverview && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-4 group font-medium">
              <span>{detailsOpen ? "Hide details" : "Show details"}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-8">
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
                      <Collapsible open={box1Open} onOpenChange={setBox1Open}>
                        <CollapsibleTrigger asChild>
                          <button className="mt-2 text-sm text-primary hover:text-primary/80 inline-flex items-center transition-colors font-medium">
                            {box1Open ? "Hide details" : "Show details"}
                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${box1Open ? "rotate-180" : ""}`} />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardDescription className="text-base mt-2">
                            Our guided tool helps you turn your creation into a unique, verifiable digital collectible on the Solana blockchain. Features include free creation (pay only network fees), automatic royalty settings, and custom traits.
                          </CardDescription>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="pt-2">
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
                      <CardTitle className="text-2xl">NFT Marketplace</CardTitle>
                      <Collapsible open={box2Open} onOpenChange={setBox2Open}>
                        <CollapsibleTrigger asChild>
                          <button className="mt-2 text-sm text-primary hover:text-primary/80 inline-flex items-center transition-colors font-medium">
                            {box2Open ? "Hide details" : "Show details"}
                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${box2Open ? "rotate-180" : ""}`} />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardDescription className="text-base mt-2">
                            Discover and collect unique digital assets from talented creators in our ecosystem. Every piece is verified on-chain for authenticity, with instant, secure transactions.
                          </CardDescription>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="pt-2">
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {!isOverview && (
        <>
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
                <Collapsible open={box1Open} onOpenChange={setBox1Open}>
                  <CollapsibleTrigger asChild>
                    <button className="mt-2 text-sm text-primary hover:text-primary/80 inline-flex items-center transition-colors font-medium">
                      {box1Open ? "Hide details" : "Show details"}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${box1Open ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardDescription className="text-base mt-2">
                      Our guided tool helps you turn your creation into a unique, verifiable digital collectible on the Solana blockchain. Features include free creation (pay only network fees), automatic royalty settings, and custom traits.
                    </CardDescription>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-2">
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
                <CardTitle className="text-2xl">NFT Marketplace</CardTitle>
                <Collapsible open={box2Open} onOpenChange={setBox2Open}>
                  <CollapsibleTrigger asChild>
                    <button className="mt-2 text-sm text-primary hover:text-primary/80 inline-flex items-center transition-colors font-medium">
                      {box2Open ? "Hide details" : "Show details"}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${box2Open ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardDescription className="text-base mt-2">
                      Discover and collect unique digital assets from talented creators in our ecosystem. Every piece is verified on-chain for authenticity, with instant, secure transactions.
                    </CardDescription>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-2">
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
        </>
      )}
    </section>
  );
}