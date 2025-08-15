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

const nftGalleryItems = [
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

export function NFTGallery() {
  const [selectedNFT, setSelectedNFT] = useState<typeof nftGalleryItems[0] | null>(null);
  
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

      {/* Visual-First NFT Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {nftGalleryItems.map((nft) => (
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
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 className="font-bold text-white text-sm">{nft.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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