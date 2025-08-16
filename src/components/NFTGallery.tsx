import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Share, ExternalLink, Heart, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { toast } from "sonner";
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
    priceUSDC: "0.00 USDC",
    priceANIME: "0 ANIME",
    metadataUrl: "https://solscan.io/account/example1",
    status: "100 Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "100",
    likes: 2847,
    mandatoryTag: "Image",
    optionalTags: ["AI Art", "Digital Art", "Limited"]
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
    priceUSDC: "Invitation Only",
    priceANIME: "Invitation Only",
    metadataUrl: "https://solscan.io/account/example2",
    status: "Special Edition",
    statusType: "special" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "100",
    likes: 1923,
    mandatoryTag: "Image",
    optionalTags: ["Digital Art", "Limited"]
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
    priceUSDC: "Earned",
    priceANIME: "Earned",
    metadataUrl: "https://solscan.io/account/example3",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "1,000",
    likes: 1456,
    mandatoryTag: "Image",
    optionalTags: ["Others", "Digital Art", "Limited"]
  },
  {
    id: "hodler",
    name: "Hodler",
    creator: "GoldMiner",
    image: hodlersNFT,
    description: "For long-term holders.",
    category: "Meme",
    editionRemaining: "Unlimited",
    price: "Hold ANIME",
    priceUSDC: "Hold ANIME",
    priceANIME: "Hold ANIME",
    metadataUrl: "https://solscan.io/account/example4",
    status: "Always Available",
    statusType: "unlimited" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "Unlimited",
    likes: 998,
    mandatoryTag: "Image",
    optionalTags: ["Meme", "Digital Art", "Limited"]
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
    price: "0.5 ANIME",
    priceUSDC: "12.50 USDC",
    priceANIME: "306 829 ANIME",
    metadataUrl: "https://solscan.io/account/example5",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "50",
    likes: 10200,
    mandatoryTag: "Image",
    optionalTags: ["Digital Art", "AI Art", "Limited"]
  },
  {
    id: "neon-girl",
    name: "Neon Girl",
    creator: "NeonDreamer",
    image: "/lovable-uploads/172bbb91-3be7-4657-9a93-dcc7acb73474.png",
    description: "Cyberpunk anime character.",
    category: "AI Art",
    editionRemaining: "75",
    price: "0.3 ANIME",
    priceUSDC: "7.50 USDC",
    priceANIME: "184 097 ANIME",
    metadataUrl: "https://solscan.io/account/example6",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "75",
    likes: 856,
    mandatoryTag: "Image",
    optionalTags: ["AI Art", "Limited"]
  },
  {
    id: "mecha-pilot",
    name: "Mecha Pilot",
    creator: "RobotMaster",
    image: "/lovable-uploads/179894ec-bb13-4a92-94d4-451cdeb9163b.png",
    description: "Elite mecha pilot design.",
    category: "Others",
    editionRemaining: "25",
    price: "1.0 ANIME",
    priceUSDC: "25.00 USDC",
    priceANIME: "613 658 ANIME",
    metadataUrl: "https://solscan.io/account/example7",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "25",
    likes: 643,
    mandatoryTag: "Image",
    optionalTags: ["Others", "Digital Art", "Limited"]
  },
  {
    id: "dragon-spirit",
    name: "Dragon Spirit",
    creator: "MysticDragon",
    image: "/lovable-uploads/1bebfca8-6d92-4791-bc30-303e161808a0.png",
    description: "Mystical dragon companion.",
    category: "Digital Art",
    editionRemaining: "100",
    price: "0.8 ANIME",
    priceUSDC: "20.00 USDC",
    priceANIME: "490 926 ANIME",
    metadataUrl: "https://solscan.io/account/example8",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "100",
    likes: 1205,
    mandatoryTag: "Image",
    optionalTags: ["Digital Art", "Limited"]
  },
  {
    id: "pixel-hero",
    name: "Pixel Hero",
    creator: "PixelWizard",
    image: "/lovable-uploads/276547fc-2c14-4f52-bb43-12179e90c7c5.png",
    description: "Retro pixel art character.",
    category: "Pixel Art",
    editionRemaining: "200",
    price: "0.2 ANIME",
    priceUSDC: "5.00 USDC",
    priceANIME: "122 732 ANIME",
    metadataUrl: "https://solscan.io/account/example9",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "200",
    likes: 432,
    mandatoryTag: "Image",
    optionalTags: ["Pixel Art", "Limited"]
  },
  {
    id: "ai-waifu",
    name: "AI Waifu",
    creator: "AIArtist",
    image: "/lovable-uploads/2b1cb628-631d-4556-a5b8-0af2fddb836b.png",
    description: "AI-generated anime character.",
    category: "AI Art",
    editionRemaining: "150",
    price: "0.4 ANIME",
    priceUSDC: "10.00 USDC",
    priceANIME: "245 463 ANIME",
    metadataUrl: "https://solscan.io/account/example10",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "150",
    likes: 789,
    mandatoryTag: "Image",
    optionalTags: ["AI Art", "Digital Art", "Limited"]
  },
  {
    id: "space-girl",
    name: "Space Girl",
    creator: "CosmicArt",
    image: "/lovable-uploads/2d0b0a65-8c68-4d43-ace0-45ea6f8bea2b.png",
    description: "Cosmic anime explorer.",
    category: "Digital Art",
    editionRemaining: "60",
    price: "0.7 ANIME",
    priceUSDC: "17.50 USDC",
    priceANIME: "429 561 ANIME",
    metadataUrl: "https://solscan.io/account/example11",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "60",
    likes: 567,
    mandatoryTag: "Image",
    optionalTags: ["Digital Art", "Limited"]
  },
  {
    id: "meme-cat",
    name: "Meme Cat",
    creator: "MemeLord",
    image: "/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png",
    description: "Popular anime meme cat.",
    category: "Meme",
    editionRemaining: "500",
    price: "0.1 ANIME",
    priceUSDC: "2.50 USDC",
    priceANIME: "61 366 ANIME",
    metadataUrl: "https://solscan.io/account/example12",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "500",
    likes: 2156,
    mandatoryTag: "Image",
    optionalTags: ["Meme", "Limited"]
  },
  {
    id: "warrior-princess",
    name: "Warrior Princess",
    creator: "WarriorArt",
    image: "/lovable-uploads/4635f823-47d8-4ddb-a3f7-12870888c162.png",
    description: "Fierce anime warrior maiden.",
    category: "Others",
    editionRemaining: "80",
    price: "0.6 ANIME",
    priceUSDC: "15.00 USDC",
    priceANIME: "368 195 ANIME",
    metadataUrl: "https://solscan.io/account/example13",
    status: "Available",
    statusType: "available" as const,
    isLimited: true,
    isExclusive: false,
    maxSupply: "80",
    likes: 345,
    mandatoryTag: "Image",
    optionalTags: ["Others", "Limited"]
  },
  {
    id: "digital-ninja",
    name: "Digital Ninja",
    creator: "ShadowNinja",
    image: "/lovable-uploads/4f7e8ad1-deee-43db-a4c9-0db403808de7.png",
    description: "Stealth cyber ninja.",
    category: "Pixel Art",
    editionRemaining: "40",
    price: "0.9 ANIME",
    priceUSDC: "22.50 USDC",
    priceANIME: "552 292 ANIME",
    metadataUrl: "https://solscan.io/account/example14",
    status: "Limited",
    statusType: "limited" as const,
    isLimited: true,
    isExclusive: true,
    maxSupply: "40",
    likes: 892,
    mandatoryTag: "Image",
    optionalTags: ["Pixel Art", "Limited"]
  }
];

export function NFTGallery() {
  const [selectedNFT, setSelectedNFT] = useState<typeof communityFavorites[0] | null>(null);
  const [showMoreArtworks, setShowMoreArtworks] = useState(false);
  const [likedNFTs, setLikedNFTs] = useState<Set<string>>(new Set());
  const [selectedMandatoryTags, setSelectedMandatoryTags] = useState<Set<string>>(new Set());
  const [selectedOptionalTags, setSelectedOptionalTags] = useState<Set<string>>(new Set());
  const [showMyFavorites, setShowMyFavorites] = useState(false);
  const [approvedSubmissions, setApprovedSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);

  // Static site: no backend fetch
  useEffect(() => {
    setApprovedSubmissions([]);
    setLoadingSubmissions(false);
  }, []);

  // Tag definitions
  const mandatoryTags = ["Image", "Video", "Animation", "Music", "Other"];
  const optionalTags = ["Digital Art", "AI Art", "Meme", "Pixel Art", "Others", "Limited"];

  // Community Favorites always show all items (no filtering)
  // Combine additional artworks with approved community submissions, sorted by date
  const allAdditionalArtworks = [
    // First add approved submissions (newest first) 
    ...approvedSubmissions,
    // Then add static artworks
    ...additionalArtworks
  ];
  
  // Filter logic for additional artworks
  const filteredAdditionalArtworks = allAdditionalArtworks.filter(nft => {
    // Check mandatory tag filter (if none selected, show all)
    const matchesMandatory = selectedMandatoryTags.size === 0 || selectedMandatoryTags.has(nft.mandatoryTag);
    
    // Check optional tag filters (must match ALL selected)
    const matchesOptional = selectedOptionalTags.size === 0 || 
      Array.from(selectedOptionalTags).every(tag => {
        if (tag === "Limited") return nft.isLimited;
        return nft.optionalTags?.includes(tag);
      });
    
    // Check My Favorites filter
    const matchesFavorites = !showMyFavorites || likedNFTs.has(nft.id);
    
    return matchesMandatory && matchesOptional && matchesFavorites;
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
    toast.success("Link copied to clipboard!");
  };

  const handleShareX = () => {
    const text = `Check out this amazing NFT: ${selectedNFT?.name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleLearnMore = () => {
    document.getElementById('nft-supporter-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Navigation between NFTs
  const getAllNFTs = () => [...communityFavorites, ...allAdditionalArtworks];
  
  const navigateToNFT = (direction: 'prev' | 'next') => {
    if (!selectedNFT) return;
    
    const allNFTs = getAllNFTs();
    const currentIndex = allNFTs.findIndex(nft => nft.id === selectedNFT.id);
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allNFTs.length - 1;
    } else {
      newIndex = currentIndex < allNFTs.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedNFT(allNFTs[newIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNFT) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToNFT('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToNFT('next');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNFT]);

  return (
    <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <div className="text-center mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">🎨</span>
            NFT Anime Art Gallery
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Showcase your anime-inspired NFTs and compete to create the most beautiful, unique art. Join the $ANIME community and get ready for our NFT marketplace!
          </p>
        </div>
      </div>

      {/* Community Favorites Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-6 text-center">🌟 Community Favourites NFTs</h3>
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
                       <Badge variant="destructive" className="bg-red-500/90 text-white border-red-500/50 text-xs">
                         Sample
                       </Badge>
                       <Badge variant="outline" className="bg-background/90 text-primary border-primary/30 text-xs">
                         {nft.mandatoryTag}
                       </Badge>
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
          {showMoreArtworks ? 'See Less' : 'See More'} NFTs Art Works ({filteredAdditionalArtworks.length})
        </Button>
      </div>

{/* Additional Artworks Grid */}
      {showMoreArtworks && (
        <div className="relative">          
          {/* Filter Controls - One Row Layout */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* My Favorites */}
              <Button
                variant={showMyFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyFavorites(!showMyFavorites)}
                className={`
                  transition-all duration-200 flex items-center gap-2
                  ${showMyFavorites
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/50'
                  }
                `}
              >
                <Heart className={`w-4 h-4 ${showMyFavorites ? 'fill-current' : ''}`} />
                My Favorites {likedNFTs.size > 0 && `(${likedNFTs.size})`}
              </Button>

              {/* Separator */}
              <div className="w-px h-6 bg-border mx-2"></div>

              {/* Format Type Tags (with distinct styling) */}
              <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-muted/20 rounded-md border">
                <span className="text-xs font-medium text-muted-foreground">Format:</span>
                {mandatoryTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedMandatoryTags.has(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newTags = new Set(selectedMandatoryTags);
                      if (selectedMandatoryTags.has(tag)) {
                        newTags.delete(tag);
                      } else {
                        newTags.add(tag);
                      }
                      setSelectedMandatoryTags(newTags);
                    }}
                    className={`
                      transition-all duration-200 
                      ${selectedMandatoryTags.has(tag) 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/50'
                      }
                    `}
                  >
                    {tag}
                  </Button>
                ))}
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border mx-2"></div>

              {/* Style Tags (with distinct styling) */}
              <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-accent/10 rounded-md border border-accent/20">
                <span className="text-xs font-medium text-muted-foreground">Style:</span>
                {optionalTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedOptionalTags.has(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newTags = new Set(selectedOptionalTags);
                      if (selectedOptionalTags.has(tag)) {
                        newTags.delete(tag);
                      } else {
                        newTags.add(tag);
                      }
                      setSelectedOptionalTags(newTags);
                    }}
                    className={`
                      transition-all duration-200 
                      ${selectedOptionalTags.has(tag)
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/50'
                      }
                    `}
                  >
                    {tag}
                  </Button>
                ))}
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border mx-2"></div>

               {/* Delete Filters */}
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   setSelectedMandatoryTags(new Set());
                   setSelectedOptionalTags(new Set());
                   setShowMyFavorites(false);
                 }}
                 className="transition-all duration-200"
               >
                 Delete filters
               </Button>
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
                  {nft.image.includes('video') || nft.image.includes('.mp4') || nft.image.includes('.webm') ? (
                    <video 
                      src={nft.image}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <img 
                      src={nft.image}
                      alt={`${nft.name} NFT`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                     <div className="absolute top-2 right-2 flex flex-col gap-1">
                       <Badge variant="destructive" className="bg-red-500/90 text-white border-red-500/50 text-xs">
                         Sample
                       </Badge>
                       <Badge variant="outline" className="bg-background/90 text-primary border-primary/30 text-xs">
                         {nft.mandatoryTag}
                       </Badge>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">NFT Details - {selectedNFT?.name}</DialogTitle>
          </DialogHeader>
          
          {/* Navigation Arrows */}
          {selectedNFT && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateToNFT('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-background border-2 border-primary/20 hover:border-primary/40 shadow-lg w-12 h-12"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateToNFT('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-background border-2 border-primary/20 hover:border-primary/40 shadow-lg w-12 h-12"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
          
          {selectedNFT && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Image Section - takes 2 columns for more space */}
              <div className="md:col-span-2 space-y-4">
                <div className="group relative max-w-lg mx-auto">
                  <div 
                    className="aspect-square overflow-hidden rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all"
                    onClick={() => {
                      const overlay = document.createElement('div');
                      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:9999;display:flex;justify-content:center;align-items:center;cursor:pointer;';
                      
                      // Add close button
                      const closeBtn = document.createElement('button');
                      closeBtn.innerHTML = '×';
                      closeBtn.style.cssText = 'position:absolute;top:20px;right:30px;background:rgba(255,255,255,0.2);border:none;color:white;font-size:40px;font-weight:bold;cursor:pointer;border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);';
                      closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
                      closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
                      
                      const isVideo = selectedNFT.image.includes('video') || selectedNFT.image.includes('.mp4') || selectedNFT.image.includes('.webm') || selectedNFT.image.startsWith('data:video/');
                      
                      if (isVideo) {
                        const video = document.createElement('video');
                        video.src = selectedNFT.image;
                        video.controls = true;
                        video.autoplay = true;
                        video.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;';
                        overlay.appendChild(video);
                      } else {
                        const img = document.createElement('img');
                        img.src = selectedNFT.image;
                        img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;';
                        overlay.appendChild(img);
                      }
                      
                      overlay.appendChild(closeBtn);
                      
                      const closeOverlay = () => {
                        if (overlay && overlay.parentNode) {
                          overlay.parentNode.removeChild(overlay);
                        }
                        document.removeEventListener('keydown', handleKeyDown);
                      };
                      
                      // Close on click (but not on media element)
                      overlay.onclick = (e) => {
                        if (e.target === overlay) closeOverlay();
                      };
                      
                      // Close button handler
                      closeBtn.onclick = closeOverlay;
                      
                      // Close on Escape key
                      const handleKeyDown = (e) => {
                        if (e.key === 'Escape') {
                          closeOverlay();
                          document.removeEventListener('keydown', handleKeyDown);
                        }
                      };
                      document.addEventListener('keydown', handleKeyDown);
                      
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
                  <p className="text-xs text-muted-foreground text-center mt-2">Click to view fullscreen</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 max-w-lg mx-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Check if this is a sample NFT (has example URL)
                      if (selectedNFT.metadataUrl && selectedNFT.metadataUrl.includes("example")) {
                        toast.info("Sample NFT", {
                          description: "This is just a sample. Real NFTs will be linked to Solscan. As new real NFTs are uploaded, we will replace these samples with authentic NFTs.",
                        });
                      } else if (selectedNFT.metadataUrl && selectedNFT.metadataUrl !== "#") {
                        window.open(selectedNFT.metadataUrl, '_blank');
                      } else {
                        toast.error("No Solscan link available", {
                          description: "This NFT doesn't have a verified address for Solscan viewing",
                        });
                      }
                    }}
                    className="flex-1"
                    disabled={false}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Solscan
                  </Button>
                  
                  <Button
                    variant={likedNFTs.has(selectedNFT.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLike(selectedNFT.id, { stopPropagation: () => {} } as React.MouseEvent)}
                    className="flex items-center gap-2"
                  >
                     <Heart 
                       className={`w-4 h-4 ${likedNFTs.has(selectedNFT.id) ? 'fill-red-500 text-red-500' : ''}`}
                     />
                     Like
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      const text = `Check out this amazing NFT: ${selectedNFT.name} by ${selectedNFT.creator}`;
                      const shareUrl = `${window.location.origin}/share/nft/${selectedNFT.id}`;
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
                      window.open(twitterUrl, '_blank');
                    }}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Details Section - takes 1 column, more narrow */}
              <div className="space-y-6">
                {/* Name, Description, Creator Group */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">{selectedNFT.name}</h2>
                  <p className="text-muted-foreground">{selectedNFT.description}</p>
                  <div>
                    <span className="font-semibold text-sm text-muted-foreground block">Created by</span>
                    <p className="text-lg font-medium">{selectedNFT.creator}</p>
                  </div>
                </div>

                {/* Max Supply and Likes Group */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-sm text-muted-foreground block">Max supply</span>
                    <p className="text-lg font-medium">{selectedNFT.maxSupply}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-muted-foreground block">Likes</span>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-lg font-medium">{formatLikes(selectedNFT.likes + (likedNFTs.has(selectedNFT.id) ? 1 : 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <span className="font-semibold text-sm text-muted-foreground block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-2">
                     <Badge variant="secondary" className="text-sm">
                       {selectedNFT.mandatoryTag}
                     </Badge>
                    {selectedNFT.optionalTags?.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Additional Info for Community Uploads */}
                {(selectedNFT as any).authorBio && (
                  <div>
                    <span className="font-semibold text-sm text-muted-foreground block mb-1">Artist Bio</span>
                    <p className="text-sm bg-muted p-3 rounded-md">{(selectedNFT as any).authorBio}</p>
                  </div>
                )}

                {/* Price - Bottom Right like webshops */} 
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 mt-6">
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-sm text-muted-foreground">Price</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{(selectedNFT as any).priceUSDC || selectedNFT.price}</p>
                      {(selectedNFT as any).priceANIME && (selectedNFT as any).priceANIME !== (selectedNFT as any).priceUSDC && (
                        <p className="text-sm text-muted-foreground">≈ {(selectedNFT as any).priceANIME}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purchase Button and Security Text */}
                <div className="space-y-3">
                  <Button 
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold gap-2"
                    onClick={() => {
                      const purchaseMessage = `Hi! I'm interested in purchasing the "${selectedNFT.name}" NFT by ${selectedNFT.creator}. Price: ${(selectedNFT as any).priceUSDC || selectedNFT.price}. Please guide me through the secure purchase process. Thanks!`;
                      
                      navigator.clipboard.writeText(purchaseMessage).then(() => {
                        setShowPurchasePopup(true);
                      }).catch(() => {
                        // Fallback if clipboard API fails
                        setShowPurchasePopup(true);
                        toast.error("Could not copy to clipboard", {
                          description: "Please manually type your purchase request in Discord"
                        });
                      });
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Start Purchase on Discord
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    To ensure security, all purchases are handled manually by our official Escrow service on Discord.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Popup */}
      <Dialog open={showPurchasePopup} onOpenChange={setShowPurchasePopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Purchase details copied!</DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              A message has been copied for you. Click the button below to go to our Discord, then simply paste the message in the #nft-buyers channel to start.
            </p>
            
            <Button 
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold gap-2"
              onClick={() => {
                window.open('https://discord.gg/mpf4EXWsG9', '_blank');
                setShowPurchasePopup(false);
              }}
            >
              <SiDiscord className="h-4 w-4" />
              Click here to go to the #nft-buyers channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community Submission Call to Action */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-center">
            🎨 Want Your NFT Featured Here?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join our Discord community to submit your anime art and get featured! Share your creations with fellow artists and builders.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold gap-2"
              onClick={() => window.open('https://discord.gg/HmSJdT5MRX', '_blank')}
            >
              <SiDiscord className="h-4 w-4" />
              Submit on Discord
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