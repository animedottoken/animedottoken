import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import foundersNFT from "/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png";
import ambassadorsNFT from "/lovable-uploads/19b93c70-6ed6-437f-945e-4046ed35eabd.png";
import hodlersNFT from "/lovable-uploads/79b12514-ca3a-49a4-82d7-16f030e3165b.png";
import earlySupporterBadge from "/lovable-uploads/69c67ce3-67c9-49e6-8975-7c85026ca6ea.png";

const nftGalleryItems = [
  {
    id: "early-supporter",
    name: "First 100 Early Supporter",
    image: earlySupporterBadge,
    description: "Awarded to the first 100 active members on X (Twitter) and Discord.",
    status: "100 Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "founder", 
    name: "Founder",
    image: foundersNFT,
    description: "For strategic leaders—max 100.",
    status: "Special Edition",
    statusType: "special" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "ambassador",
    name: "Ambassador", 
    image: ambassadorsNFT,
    description: "For creators/community builders—max 1,000.",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    maxSupply: "1,000"
  },
  {
    id: "hodler",
    name: "Hodler",
    image: hodlersNFT,
    description: "For long-term holders.",
    status: "Always Available",
    statusType: "unlimited" as const,
    isLimited: false,
    maxSupply: "Unlimited"
  }
];

export function NFTGallery() {
  const getStatusBadgeVariant = (statusType: string) => {
    switch (statusType) {
      case "available":
        return "default";
      case "special":
        return "secondary";
      case "limited":
        return "outline";
      case "unlimited":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case "available":
        return "text-green-400";
      case "special":
        return "text-yellow-400";
      case "limited":
        return "text-orange-400";
      case "unlimited":
        return "text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  const handleLearnMore = () => {
    document.getElementById('nft-supporter-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          🎨 Anime Art Gallery
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Showcase your anime-inspired NFTs and compete to create the most beautiful, unique art. Join the $ANIME community and get ready for our NFT marketplace!
        </p>
      </div>

      {/* Community Favorite / NFT of the Month */}
      <div className="text-center mb-12">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-2 text-primary">
            🌟 Community Favorite
          </h3>
          <p className="text-muted-foreground text-sm">
            This month's featured artwork will be highlighted here. Submit your anime art to be considered for the spotlight!
          </p>
        </div>
      </div>

      {/* NFT Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {nftGalleryItems.map((nft) => (
          <Card key={nft.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden">
            <CardContent className="p-0">
              {/* NFT Image */}
              <div className="relative overflow-hidden">
                <img 
                  src={nft.image}
                  alt={`${nft.name} NFT`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Limited Badge Overlay */}
                {nft.isLimited && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      Limited
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {/* Name and Status */}
                <div className="mb-3">
                  <h3 className="font-bold text-lg mb-1">{nft.name}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(nft.statusType)} className="text-xs">
                      {nft.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Max: {nft.maxSupply}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                  {nft.description}
                </p>
                
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getStatusColor(nft.statusType)}`}>
                    {nft.status}
                  </span>
                  {nft.id === "early-supporter" && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Ready to Claim
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Submission Call to Action */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">
            🎨 Want Your NFT Featured Here?
          </h3>
          <p className="text-muted-foreground mb-6">
            Submit your anime art and join our gallery. Top creations get highlighted and recognized! Build your reputation now while we prepare the marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleLearnMore}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold"
            >
              Learn How to Earn NFTs
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open('mailto:nft@anime.com?subject=NFT Gallery Submission', '_blank')}
              className="border-primary/20 hover:bg-primary/5"
            >
              Submit Your Art
            </Button>
          </div>
        </div>
      </div>

      {/* Marketplace Teaser */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-muted/30 to-muted/10 border border-muted/30 rounded-lg p-4 max-w-2xl mx-auto">
          <h4 className="font-semibold mb-2 text-muted-foreground">
            🔮 Coming Soon: NFT Marketplace
          </h4>
          <p className="text-sm text-muted-foreground">
            NFT trading and marketplace coming soon—build your reputation now!
          </p>
        </div>
      </div>
    </section>
  );
}