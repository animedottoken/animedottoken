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
    description: "Awarded exclusively to the first 100 active supporters who join and engage in our X (Twitter) and Discord communities. Marks your legacy as a pioneer of the $ANIME community.",
    status: "100 Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "founder", 
    name: "Founder",
    image: foundersNFT,
    description: "For strategic leaders who secure partnerships, lead projects, grow the treasury, or deliver tools for the community. Maximum 100 members.",
    status: "Special Edition",
    statusType: "special" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "ambassador",
    name: "Ambassador", 
    image: ambassadorsNFT,
    description: "For content creators, moderators, or event organizers who actively grow the community. Maximum 1,000 members.",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    maxSupply: "1,000"
  },
  {
    id: "hodler",
    name: "Hodler",
    image: hodlersNFT,
    description: "For long-term $ANIME holders. Earn gold, diamond, or legend badges for holding over 3, 12 months, or never selling. Unlimited supply.",
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
          🎨 NFT Gallery
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover our exclusive NFT collection for community supporters. Each NFT represents a unique role and contribution to the $ANIME ecosystem.
        </p>
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

      {/* Call to Action */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">
            🚀 Ready to Earn Your NFT?
          </h3>
          <p className="text-muted-foreground mb-6">
            Each NFT is earned through meaningful contributions to our community. Learn how to qualify and claim your supporter role.
          </p>
          <Button 
            size="lg" 
            onClick={handleLearnMore}
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold"
          >
            Learn How to Earn NFTs
          </Button>
        </div>
      </div>

      {/* Marketplace Teaser */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-muted/30 to-muted/10 border border-muted/30 rounded-lg p-4 max-w-2xl mx-auto">
          <h4 className="font-semibold mb-2 text-muted-foreground">
            🔮 Coming Soon: NFT Marketplace
          </h4>
          <p className="text-sm text-muted-foreground">
            Future trading and marketplace features will allow you to buy, sell, and trade NFTs using $ANIME tokens.
          </p>
        </div>
      </div>
    </section>
  );
}