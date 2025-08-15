import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Share, ExternalLink } from "lucide-react";
import foundersNFT from "/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png";
import ambassadorsNFT from "/lovable-uploads/19b93c70-6ed6-437f-945e-4046ed35eabd.png";
import hodlersNFT from "/lovable-uploads/79b12514-ca3a-49a4-82d7-16f030e3165b.png";
import earlySupporterBadge from "/lovable-uploads/69c67ce3-67c9-49e6-8975-7c85026ca6ea.png";

const communityFavorites = [
  {
    id: "early-supporter",
    name: "First 100 Early Supporter",
    image: earlySupporterBadge,
    description: "Legacy badge for early adopters.",
    category: "AI Art",
    editionRemaining: "100",
    price: "Free",
    metadataUrl: "https://solscan.io/account/example1",
    status: "100 Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "founder", 
    name: "Founder",
    image: foundersNFT,
    description: "For strategic leaders.",
    category: "Profile Picture (PFP)",
    editionRemaining: "100",
    price: "Invitation Only",
    metadataUrl: "https://solscan.io/account/example2",
    status: "Special Edition",
    statusType: "special" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "ambassador",
    name: "Ambassador", 
    image: ambassadorsNFT,
    description: "For community builders.",
    category: "Illustration",
    editionRemaining: "1,000",
    price: "Earned",
    metadataUrl: "https://solscan.io/account/example3",
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
    category: "3D Art",
    editionRemaining: "Unlimited",
    price: "Hold $ANIME",
    metadataUrl: "https://solscan.io/account/example4",
    status: "Always Available",
    statusType: "unlimited" as const,
    isLimited: false,
    maxSupply: "Unlimited"
  }
];

const additionalArtworks = [
  {
    id: "cyber-samurai",
    name: "Cyber Samurai",
    image: "/lovable-uploads/15118b9e-f73d-49b8-9ea3-a8672e651d76.png",
    description: "Futuristic samurai warrior.",
    category: "3D Art",
    editionRemaining: "50",
    price: "0.5 $ANIME",
    metadataUrl: "https://solscan.io/account/example5",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "50"
  },
  {
    id: "neon-girl",
    name: "Neon Girl",
    image: "/lovable-uploads/172bbb91-3be7-4657-9a93-dcc7acb73474.png",
    description: "Cyberpunk anime character.",
    category: "Profile Picture (PFP)",
    editionRemaining: "75",
    price: "0.3 $ANIME",
    metadataUrl: "https://solscan.io/account/example6",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "75"
  },
  {
    id: "mecha-pilot",
    name: "Mecha Pilot",
    image: "/lovable-uploads/179894ec-bb13-4a92-94d4-451cdeb9163b.png",
    description: "Elite mecha pilot design.",
    category: "Illustration",
    editionRemaining: "25",
    price: "1.0 $ANIME",
    metadataUrl: "https://solscan.io/account/example7",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    maxSupply: "25"
  },
  {
    id: "dragon-spirit",
    name: "Dragon Spirit",
    image: "/lovable-uploads/1bebfca8-6d92-4791-bc30-303e161808a0.png",
    description: "Mystical dragon companion.",
    category: "Animation",
    editionRemaining: "100",
    price: "0.8 $ANIME",
    metadataUrl: "https://solscan.io/account/example8",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "100"
  },
  {
    id: "pixel-hero",
    name: "Pixel Hero",
    image: "/lovable-uploads/276547fc-2c14-4f52-bb43-12179e90c7c5.png",
    description: "Retro pixel art character.",
    category: "Pixel Art",
    editionRemaining: "200",
    price: "0.2 $ANIME",
    metadataUrl: "https://solscan.io/account/example9",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "200"
  },
  {
    id: "ai-waifu",
    name: "AI Waifu",
    image: "/lovable-uploads/2b1cb628-631d-4556-a5b8-0af2fddb836b.png",
    description: "AI-generated anime character.",
    category: "AI Art",
    editionRemaining: "150",
    price: "0.4 $ANIME",
    metadataUrl: "https://solscan.io/account/example10",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "150"
  },
  {
    id: "space-girl",
    name: "Space Girl",
    image: "/lovable-uploads/2d0b0a65-8c68-4d43-ace0-45ea6f8bea2b.png",
    description: "Cosmic anime explorer.",
    category: "Illustration",
    editionRemaining: "60",
    price: "0.7 $ANIME",
    metadataUrl: "https://solscan.io/account/example11",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "60"
  },
  {
    id: "meme-cat",
    name: "Meme Cat",
    image: "/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png",
    description: "Popular anime meme cat.",
    category: "Meme",
    editionRemaining: "500",
    price: "0.1 $ANIME",
    metadataUrl: "https://solscan.io/account/example12",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "500"
  },
  {
    id: "warrior-princess",
    name: "Warrior Princess",
    image: "/lovable-uploads/4635f823-47d8-4ddb-a3f7-12870888c162.png",
    description: "Fierce anime warrior maiden.",
    category: "Profile Picture (PFP)",
    editionRemaining: "80",
    price: "0.6 $ANIME",
    metadataUrl: "https://solscan.io/account/example13",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    maxSupply: "80"
  },
  {
    id: "digital-ninja",
    name: "Digital Ninja",
    image: "/lovable-uploads/4f7e8ad1-deee-43db-a4c9-0db403808de7.png",
    description: "Stealth cyber ninja.",
    category: "3D Art",
    editionRemaining: "40",
    price: "0.9 $ANIME",
    metadataUrl: "https://solscan.io/account/example14",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    maxSupply: "40"
  }
];

export function NFTGallery() {
  const [selectedNFT, setSelectedNFT] = useState<typeof communityFavorites[0] | null>(null);
  const [showMoreArtworks, setShowMoreArtworks] = useState(false);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleShareX = () => {
    const text = `Check out this amazing NFT: ${selectedNFT?.name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
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

      {/* Community Favorites Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-6 text-center">🌟 Community Favorites</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {communityFavorites.map((nft, index) => {
            const rankIcons = ['🥇', '🥈', '🥉', '🏅']; // Platinum, Gold, Silver, Bronze
            return (
              <Card 
                key={nft.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
                onClick={() => setSelectedNFT(nft)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden aspect-square">
                    <img 
                      src={nft.image}
                      alt={`${nft.name} NFT`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Ranking Icon */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-black/70 rounded-full w-8 h-8 flex items-center justify-center">
                        <span className="text-lg">{rankIcons[index]}</span>
                      </div>
                    </div>
                    {nft.isLimited && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                          Limited
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <h3 className="font-bold text-white text-sm">{nft.name}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* See More Artworks Section */}
      <div className="text-center mb-8">
        <Button 
          onClick={() => setShowMoreArtworks(!showMoreArtworks)}
          variant="outline"
          size="lg"
          className="border-primary bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {showMoreArtworks ? 'Hide' : 'See More'} Art Works ({additionalArtworks.length})
        </Button>
      </div>

      {/* Additional Artworks Grid */}
      {showMoreArtworks && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {additionalArtworks.map((nft) => (
            <Card 
              key={nft.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
              onClick={() => setSelectedNFT(nft)}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-square">
                  <img 
                    src={nft.image}
                    alt={`${nft.name} NFT`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {nft.isLimited && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Limited
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <h3 className="font-bold text-white text-xs">{nft.name}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* NFT Details Modal */}
      <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedNFT?.name}</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(selectedNFT?.metadataUrl, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Metadata
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Share className="w-3 h-3 mr-1" />
                  Share
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedNFT && (
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg">
                <img 
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-sm">Name:</span>
                  <p className="text-sm text-muted-foreground">{selectedNFT.name}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-sm">Description:</span>
                  <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-sm">Category:</span>
                  <p className="text-sm text-muted-foreground">{selectedNFT.category}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-sm">Edition Remaining:</span>
                  <p className="text-sm text-muted-foreground">{selectedNFT.editionRemaining}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-sm">Price:</span>
                  <p className="text-sm text-muted-foreground">{selectedNFT.price}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShareX}
                  className="flex-1"
                >
                  Share via X
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Community Submission Call to Action */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">
            🎨 Want Your NFT Featured Here?
          </h3>
          <p className="text-muted-foreground mb-6">
            Submit your anime art and join our gallery. Top creations get highlighted and recognized! Build your reputation now while we prepare the marketplace.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open('mailto:nft@anime.com?subject=NFT Gallery Submission', '_blank')}
              className="border-primary bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
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