import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// NFT data (same as in NFTGallery)
const allNFTs = [
  {
    id: "cyber-samurai",
    name: "Cyber Samurai",
    creator: "tommo8",
    image: "/lovable-uploads/15118b9e-f73d-49b8-9ea3-a8672e651d76.png",
    description: "Futuristic samurai warrior.",
  },
  {
    id: "neon-girl", 
    name: "Neon Girl",
    creator: "NeonDreamer",
    image: "/lovable-uploads/172bbb91-3be7-4657-9a93-dcc7acb73474.png",
    description: "Cyberpunk anime character.",
  },
  {
    id: "mecha-pilot",
    name: "Mecha Pilot", 
    creator: "RobotMaster",
    image: "/lovable-uploads/179894ec-bb13-4a92-94d4-451cdeb9163b.png",
    description: "Elite mecha pilot design.",
  },
  {
    id: "dragon-spirit",
    name: "Dragon Spirit",
    creator: "MysticDragon", 
    image: "/lovable-uploads/1bebfca8-6d92-4791-bc30-303e161808a0.png",
    description: "Mystical dragon companion.",
  },
  {
    id: "pixel-hero",
    name: "Pixel Hero",
    creator: "PixelWizard",
    image: "/lovable-uploads/276547fc-2c14-4f52-bb43-12179e90c7c5.png", 
    description: "Retro pixel art character.",
  },
  {
    id: "ai-waifu",
    name: "AI Waifu",
    creator: "AIArtist",
    image: "/lovable-uploads/2b1cb628-631d-4556-a5b8-0af2fddb836b.png",
    description: "AI-generated anime character.",
  },
  {
    id: "space-girl",
    name: "Space Girl",
    creator: "CosmicArt",
    image: "/lovable-uploads/2d0b0a65-8c68-4d43-ace0-45ea6f8bea2b.png",
    description: "Cosmic anime explorer.",
  },
  {
    id: "meme-cat",
    name: "Meme Cat", 
    creator: "MemeLord",
    image: "/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png",
    description: "Popular anime meme cat.",
  },
  {
    id: "warrior-princess",
    name: "Warrior Princess",
    creator: "WarriorArt",
    image: "/lovable-uploads/4635f823-47d8-4ddb-a3f7-12870888c162.png",
    description: "Fierce anime warrior maiden.",
  },
  {
    id: "digital-ninja",
    name: "Digital Ninja",
    creator: "ShadowNinja", 
    image: "/lovable-uploads/4f7e8ad1-deee-43db-a4c9-0db403808de7.png",
    description: "Stealth cyber ninja.",
  },
  {
    id: "early-supporter",
    name: "First 100 Early Supporter",
    creator: "DotANIME",
    image: "/lovable-uploads/32d40dad-83cd-4e15-a7bf-fb41d7b22689.png",
    description: "Legacy badge for early adopters.",
  },
  {
    id: "founder",
    name: "Founder", 
    creator: "DotANIME",
    image: "/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png",
    description: "For strategic leaders.",
  },
  {
    id: "ambassador",
    name: "Ambassador",
    creator: "DotANIME",
    image: "/lovable-uploads/19b93c70-6ed6-437f-945e-4046ed35eabd.png",
    description: "For community builders.",
  },
  {
    id: "hodler",
    name: "Hodler",
    creator: "DotANIME",
    image: "/lovable-uploads/79b12514-ca3a-49a4-82d7-16f030e3165b.png", 
    description: "For long-term holders.",
  },
  {
    id: "ai-art-generic",
    name: "AI Art",
    creator: "ANIME",
    image: "/images/og-anime.jpg",
    description: "ANIME AI Art NFT Collection",
  },
  {
    id: "others-generic", 
    name: "Others",
    creator: "ANIME",
    image: "/images/og-anime.jpg",
    description: "ANIME NFT Collection",
  }
];

const ShareNFT = () => {
  const { nftId } = useParams<{ nftId: string }>();
  
  const nft = allNFTs.find(n => n.id === nftId);
  
  if (!nft) {
    return <Navigate to="/" replace />;
  }

  const shareUrl = window.location.href;
  const imageUrl = window.location.origin + nft.image;

  return (
    <>
      <Helmet>
        <title>{nft.name} by {nft.creator} | ANIME NFT</title>
        <meta name="description" content={nft.description} />
        <link rel="canonical" href={shareUrl} />
        
        {/* Open Graph */}
        <meta property="og:site_name" content="ANIME Token" />
        <meta property="og:title" content={`${nft.name} by ${nft.creator}`} />
        <meta property="og:description" content={nft.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:secure_url" content={imageUrl} />
        <meta property="og:image:alt" content={`${nft.name} NFT`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AnimeDotToken" />
        <meta name="twitter:title" content={`${nft.name} by ${nft.creator}`} />
        <meta name="twitter:description" content={nft.description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={`${nft.name} NFT`} />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground p-8">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{nft.name} by {nft.creator}</h1>
          <p className="text-xl text-muted-foreground mb-8">{nft.description}</p>
          <p className="mb-8">
            View more on our site: <a href="/" className="text-primary hover:underline">animedottoken.lovable.app</a>
          </p>
          <img 
            src={nft.image} 
            alt={`${nft.name} NFT`} 
            className="max-w-full h-auto rounded-lg shadow-lg"
            width="1200" 
            height="630" 
          />
        </main>
      </div>
    </>
  );
};

export default ShareNFT;