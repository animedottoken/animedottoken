import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Share, ExternalLink, Heart, Plus } from "lucide-react";
import { NFTSubmissionForm } from "@/components/NFTSubmissionForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import foundersNFT from "/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png";
import ambassadorsNFT from "/lovable-uploads/19b93c70-6ed6-437f-945e-4046ed35eabd.png";
import hodlersNFT from "/lovable-uploads/79b12514-ca3a-49a4-82d7-16f030e3165b.png";
import earlySupporterBadge from "/lovable-uploads/69c67ce3-67c9-49e6-8975-7c85026ca6ea.png";

const communityFavorites = [
  {
    id: "early-supporter",
    name: "First 100 Early Supporter",
    creator: "AnimeTeam",
    image: earlySupporterBadge,
    description: "Legacy badge for early adopters.",
    category: "AI Art",
    editionRemaining: "100",
    price: "Free",
    metadataUrl: "https://solscan.io/account/example1",
    status: "100 Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "100",
    likes: 2847
  },
  {
    id: "founder", 
    name: "Founder",
    creator: "CryptoSamurai",
    image: foundersNFT,
    description: "For strategic leaders.",
    category: "Digital Art",
    editionRemaining: "100",
    price: "Invitation Only",
    metadataUrl: "https://solscan.io/account/example2",
    status: "Special Edition",
    statusType: "special" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "100",
    likes: 1923
  },
  {
    id: "ambassador",
    name: "Ambassador", 
    creator: "DigitalArtist",
    image: ambassadorsNFT,
    description: "For community builders.",
    category: "Others",
    editionRemaining: "1,000",
    price: "Earned",
    metadataUrl: "https://solscan.io/account/example3",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "1,000",
    likes: 1456
  },
  {
    id: "hodler",
    name: "Hodler",
    creator: "GoldMiner",
    image: hodlersNFT,
    description: "For long-term holders.",
    category: "Meme",
    editionRemaining: "Unlimited",
    price: "Hold $ANIME",
    metadataUrl: "https://solscan.io/account/example4",
    status: "Always Available",
    statusType: "unlimited" as const,
    isLimited: false,
    isExclusive: false,
    maxSupply: "Unlimited",
    likes: 998
  }
];

const additionalArtworks = [
  {
    id: "cyber-samurai",
    name: "Cyber Samurai",
    creator: "tommo8",
    image: "/lovable-uploads/15118b9e-f73d-49b8-9ea3-a8672e651d76.png",
    description: "Futuristic samurai warrior.",
    category: "Digital Art",
    editionRemaining: "50",
    price: "0.5 $ANIME",
    metadataUrl: "https://solscan.io/account/example5",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "50",
    likes: 10200
  },
  {
    id: "neon-girl",
    name: "Neon Girl",
    creator: "NeonDreamer",
    image: "/lovable-uploads/172bbb91-3be7-4657-9a93-dcc7acb73474.png",
    description: "Cyberpunk anime character.",
    category: "AI Art",
    editionRemaining: "75",
    price: "0.3 $ANIME",
    metadataUrl: "https://solscan.io/account/example6",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "75",
    likes: 856
  },
  {
    id: "mecha-pilot",
    name: "Mecha Pilot",
    creator: "RobotMaster",
    image: "/lovable-uploads/179894ec-bb13-4a92-94d4-451cdeb9163b.png",
    description: "Elite mecha pilot design.",
    category: "Others",
    editionRemaining: "25",
    price: "1.0 $ANIME",
    metadataUrl: "https://solscan.io/account/example7",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "25",
    likes: 643
  },
  {
    id: "dragon-spirit",
    name: "Dragon Spirit",
    creator: "MysticDragon",
    image: "/lovable-uploads/1bebfca8-6d92-4791-bc30-303e161808a0.png",
    description: "Mystical dragon companion.",
    category: "Digital Art",
    editionRemaining: "100",
    price: "0.8 $ANIME",
    metadataUrl: "https://solscan.io/account/example8",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "100",
    likes: 1205
  },
  {
    id: "pixel-hero",
    name: "Pixel Hero",
    creator: "PixelWizard",
    image: "/lovable-uploads/276547fc-2c14-4f52-bb43-12179e90c7c5.png",
    description: "Retro pixel art character.",
    category: "Pixel Art",
    editionRemaining: "200",
    price: "0.2 $ANIME",
    metadataUrl: "https://solscan.io/account/example9",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "200",
    likes: 432
  },
  {
    id: "ai-waifu",
    name: "AI Waifu",
    creator: "AIArtist",
    image: "/lovable-uploads/2b1cb628-631d-4556-a5b8-0af2fddb836b.png",
    description: "AI-generated anime character.",
    category: "AI Art",
    editionRemaining: "150",
    price: "0.4 $ANIME",
    metadataUrl: "https://solscan.io/account/example10",
    status: "Available",
    statusType: "available" as const,
    isLimited: false,
    isExclusive: true,
    maxSupply: "150",
    likes: 789
  },
  {
    id: "space-girl",
    name: "Space Girl",
    creator: "CosmicArt",
    image: "/lovable-uploads/2d0b0a65-8c68-4d43-ace0-45ea6f8bea2b.png",
    description: "Cosmic anime explorer.",
    category: "Digital Art",
    editionRemaining: "60",
    price: "0.7 $ANIME",
    metadataUrl: "https://solscan.io/account/example11",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "60",
    likes: 567
  },
  {
    id: "meme-cat",
    name: "Meme Cat",
    creator: "MemeLord",
    image: "/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png",
    description: "Popular anime meme cat.",
    category: "Meme",
    editionRemaining: "500",
    price: "0.1 $ANIME",
    metadataUrl: "https://solscan.io/account/example12",
    status: "Available",
    statusType: "available" as const,
    isLimited: false,
    isExclusive: false,
    maxSupply: "500",
    likes: 2156
  },
  {
    id: "warrior-princess",
    name: "Warrior Princess",
    creator: "WarriorArt",
    image: "/lovable-uploads/4635f823-47d8-4ddb-a3f7-12870888c162.png",
    description: "Fierce anime warrior maiden.",
    category: "Others",
    editionRemaining: "80",
    price: "0.6 $ANIME",
    metadataUrl: "https://solscan.io/account/example13",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "80",
    likes: 345
  },
  {
    id: "digital-ninja",
    name: "Digital Ninja",
    creator: "ShadowNinja",
    image: "/lovable-uploads/4f7e8ad1-deee-43db-a4c9-0db403808de7.png",
    description: "Stealth cyber ninja.",
    category: "Pixel Art",
    editionRemaining: "40",
    price: "0.9 $ANIME",
    metadataUrl: "https://solscan.io/account/example14",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "40",
    likes: 892
  }
];

export function NFTGallery() {
  const [selectedNFT, setSelectedNFT] = useState<typeof communityFavorites[0] | null>(null);
  const [showMoreArtworks, setShowMoreArtworks] = useState(false);
  const [likedNFTs, setLikedNFTs] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [approvedSubmissions, setApprovedSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const { toast } = useToast();

  // Fetch approved submissions from database
  useEffect(() => {
    fetchApprovedSubmissions();
  }, []);

  const fetchApprovedSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('community_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }); // Sort by date uploaded (newest first)

      if (error) {
        console.error('Error fetching approved submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load community submissions",
          variant: "destructive"
        });
      } else {
        // Transform submissions to match NFT format
        const transformedSubmissions = data.map(submission => ({
          id: submission.id,
          name: submission.name || (submission.caption.length > 50 ? submission.caption.substring(0, 50) + '...' : submission.caption),
          creator: submission.author,
          image: submission.image_url,
          description: submission.caption,
          category: submission.type === 'art' ? 'Digital Art' : 'Others',
          editionRemaining: submission.edition_type || "Unique",
          price: "Community Upload",
          metadataUrl: submission.nft_address ? `https://solscan.io/token/${submission.nft_address}` : "#",
          status: "Approved",
          statusType: "available" as const,
          isLimited: submission.edition_type === 'limited',
          isExclusive: false,
          maxSupply: submission.edition_type === 'limited' ? "Limited Edition" : "1 of 1",
          likes: Math.floor(Math.random() * 50), // Random likes for community uploads
          uploadedAt: submission.created_at,
          tags: submission.tags || [],
          authorBio: submission.author_bio,
          contact: submission.contact
        }));
        setApprovedSubmissions(transformedSubmissions);
      }
    } catch (error) {
      console.error('Error in fetchApprovedSubmissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Main content categories
  const mainCategories = ["All", "Digital Art", "AI Art", "Meme", "Pixel Art", "Others"];
  // Special attributes that can be combined with main categories
  const attributeCategories = ["Limited", "My Favorites"];
  
  const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(new Set());

  // Community Favorites always show all items (no filtering)
  // Combine additional artworks with approved community submissions, sorted by date
  const allAdditionalArtworks = [
    // First add approved submissions (newest first) 
    ...approvedSubmissions,
    // Then add static artworks
    ...additionalArtworks
  ];
  
  // Only filter additional artworks (including community submissions)
  const filteredAdditionalArtworks = allAdditionalArtworks.filter(nft => {
    const matchesCategory = activeCategory === "All" || nft.category === activeCategory;
    
    // Check if artwork matches ALL selected attributes (AND logic)
    if (selectedAttributes.size === 0) {
      return matchesCategory; // No attributes selected, just match category
    }
    
    let matchesAllAttributes = true;
    
    if (selectedAttributes.has("Limited") && !nft.isLimited) {
      matchesAllAttributes = false;
    }
    if (selectedAttributes.has("My Favorites") && !likedNFTs.has(nft.id)) {
      matchesAllAttributes = false;
    }
    
    return matchesCategory && matchesAllAttributes;
  });
  
  const handleLike = (nftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedNFTs = new Set(likedNFTs);
    if (likedNFTs.has(nftId)) {
      newLikedNFTs.delete(nftId);
    } else {
      newLikedNFTs.add(nftId);
    }
    setLikedNFTs(newLikedNFTs);
  };

  const formatLikes = (likes: number) => {
    if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}K`;
    }
    return likes.toString();
  };
  
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
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">🎨</span>
            Anime Art Gallery
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Showcase your anime-inspired NFTs and compete to create the most beautiful, unique art. Join the $ANIME community and get ready for our NFT marketplace!
          </p>
        </div>
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
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {nft.isLimited && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                          Limited
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm">{nft.creator}</h3>
                        <button
                          onClick={(e) => handleLike(nft.id, e)}
                          className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 hover:bg-black/70 transition-colors"
                        >
                          <Heart 
                            className={`w-3 h-3 ${likedNFTs.has(nft.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                          />
                          <span className="text-white text-xs">{formatLikes(nft.likes + (likedNFTs.has(nft.id) ? 1 : 0))}</span>
                        </button>
                      </div>
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
          {showMoreArtworks ? 'See Less' : 'See More'} Art Works ({filteredAdditionalArtworks.length})
        </Button>
      </div>

      {/* Additional Artworks Grid */}
      {showMoreArtworks && (
        <div className="relative">
          {/* Admin Button - Top Right, Semi-visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = "/admin";
            }}
            className="absolute -top-12 right-0 z-10 opacity-30 hover:opacity-80 text-xs px-2 py-1 text-muted-foreground hover:text-primary transition-all duration-300 bg-background/50 hover:bg-primary/10 border border-border/30"
            title="Admin Panel Access"
          >
            •••
          </Button>
          
          {/* Category Filter Tags */}
          <div className="mb-6">
            {/* Main Content Categories */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {mainCategories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    transition-all duration-200 
                    ${activeCategory === category 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/50'
                    }
                  `}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            {/* Attribute Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {attributeCategories.map((attribute) => (
                <Button
                  key={attribute}
                  variant={selectedAttributes.has(attribute) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newAttributes = new Set(selectedAttributes);
                    if (selectedAttributes.has(attribute)) {
                      newAttributes.delete(attribute);
                    } else {
                      newAttributes.add(attribute);
                    }
                    setSelectedAttributes(newAttributes);
                  }}
                    className={`
                      transition-all duration-200 
                      ${selectedAttributes.has(attribute)
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/50'
                      }
                    `}
                >
                  {attribute}
                </Button>
              ))}
              
            </div>
            
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {filteredAdditionalArtworks.map((nft) => (
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
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {nft.isLimited && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                          Limited
                        </Badge>
                      )}
                    </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-xs">{nft.creator}</h3>
                      <button
                        onClick={(e) => handleLike(nft.id, e)}
                        className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 hover:bg-black/70 transition-colors"
                      >
                        <Heart 
                          className={`w-3 h-3 ${likedNFTs.has(nft.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                        />
                        <span className="text-white text-xs">{formatLikes(nft.likes + (likedNFTs.has(nft.id) ? 1 : 0))}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}

      {/* NFT Details Modal */}
      <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">NFT Details - {selectedNFT?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedNFT && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="group relative">
                  <div 
                    className="aspect-square overflow-hidden rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all"
                    onClick={() => {
                      const overlay = document.createElement('div');
                      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:9999;display:flex;justify-content:center;align-items:center;cursor:pointer;';
                      
                      const isVideo = selectedNFT.image.includes('video') || selectedNFT.image.startsWith('data:video/');
                      
                      if (isVideo) {
                        const video = document.createElement('video');
                        video.src = selectedNFT.image;
                        video.controls = true;
                        video.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;';
                        overlay.appendChild(video);
                      } else {
                        const img = document.createElement('img');
                        img.src = selectedNFT.image;
                        img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;';
                        overlay.appendChild(img);
                      }
                      
                      overlay.onclick = () => document.body.removeChild(overlay);
                      document.body.appendChild(overlay);
                    }}
                  >
                    {selectedNFT.image.includes('video') || selectedNFT.image.startsWith('data:video/') ? (
                      <video 
                        src={selectedNFT.image}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img 
                        src={selectedNFT.image}
                        alt={selectedNFT.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Click to view fullscreen</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (selectedNFT.metadataUrl !== "#") {
                        window.open(selectedNFT.metadataUrl, '_blank');
                      } else {
                        toast({
                          title: "No NFT address available",
                          description: "This NFT doesn't have a Solscan link available",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Check on Solscan
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      const text = `Check out this amazing NFT: ${selectedNFT.name} by ${selectedNFT.creator}`;
                      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedNFT.name}</h2>
                  <p className="text-muted-foreground mb-4">{selectedNFT.description}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground block">Creator</span>
                      <p className="text-lg">{selectedNFT.creator}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground block">Category</span>
                      <Badge variant="secondary">{selectedNFT.category}</Badge>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground block">Edition</span>
                      <p>{selectedNFT.editionRemaining}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground block">Price</span>
                      <p className="text-lg font-semibold">{selectedNFT.price}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground block">Likes</span>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-semibold">{formatLikes(selectedNFT.likes + (likedNFTs.has(selectedNFT.id) ? 1 : 0))}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-sm text-muted-foreground block">Status</span>
                      <Badge variant={selectedNFT.statusType === 'available' ? 'default' : 'secondary'}>
                        {selectedNFT.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Additional Info for Community Uploads */}
                {(selectedNFT as any).authorBio && (
                  <div>
                    <span className="font-semibold text-sm text-muted-foreground block mb-1">Artist Bio</span>
                    <p className="text-sm bg-muted p-3 rounded-md">{(selectedNFT as any).authorBio}</p>
                  </div>
                )}

                {(selectedNFT as any).tags && (selectedNFT as any).tags.length > 0 && (
                  <div>
                    <span className="font-semibold text-sm text-muted-foreground block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {(selectedNFT as any).tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Community Submission Call to Action */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-center">
            🎨 Want Your NFT Featured Here?
          </h3>
          <p className="text-muted-foreground mb-6">
            Submit your anime art and join our gallery. Top creations get highlighted and recognized! Build your reputation now while we prepare the marketplace.
          </p>
          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Submit Your Art
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <NFTSubmissionForm onSuccess={() => {
                  // Close the dialog by dispatching Escape key (Radix handles it)
                  const event = new KeyboardEvent('keydown', { key: 'Escape' });
                  document.dispatchEvent(event);
                }} />
              </DialogContent>
            </Dialog>
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