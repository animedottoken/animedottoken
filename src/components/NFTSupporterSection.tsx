import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import foundersNFT from "/lovable-uploads/a1ba5db4-90c5-4d0a-8223-8888c83dcaae.png";
import ambassadorsNFT from "@/assets/nft-ambassadors.jpg";
import hodlersNFT from "@/assets/nft-hodlers.jpg";

const nftTypes = [
  {
    id: "founders",
    icon: "🥇",
    title: "Founder",
    image: foundersNFT,
    role: "",
    description: "The strategic commanders of the ANIME ARMY. Founders are the elite members providing foundational, high-impact value. They are the key advisors, builders, and strategists shaping the future of the entire project.",
    howToEarn: [
      "This role is the highest honor and is awarded directly for exceptional contributions that fundamentally advance the project. To be considered, a candidate must proactively contact the team and provide evidence of meeting one of the following measurable targets:",
      "Partnership|Secure a formal, announced partnership with another established project, influencer, or platform.",
      "Project Management|Successfully manage an official project initiative from proposal to completion (e.g., a marketing campaign, community competition, or content sprint).",
      "Treasury Growth|Introduce a strategic opportunity that results in a verifiable increase of over 10 ETH (or equivalent) to the project treasury.",
      "Ecosystem Development|Deliver a functional tool (e.g., Discord bot, analytics dashboard) that is officially adopted for community use."
    ],
    reward: "Unique, verifiable NFT on the Solana blockchain.",
    details: "Founder NFTs are limited and given only once — holders will be recognized as the original visionaries of the ANIME revival. This is the highest tier of recognition for those who shape the project's direction."
  },
  {
    id: "ambassadors", 
    icon: "🤝",
    title: "Ambassador",
    image: ambassadorsNFT,
    role: "Role: Content Creator",
    description: "Recognition for the dedicated content creators and social media leaders who amplify our message and grow our community's reach.",
    howToEarn: [
      "Consistently promote ANIME.TOKEN in target communities (crypto, anime, NFT spaces).",
      "Use hashtags: #ANIME #ANIME.TOKEN #AnimeDotToken $ANIME #ANIMEAmbassadors",
      "Post or share at least 2 original pieces of content (images, memes, videos, threads) per month about ANIME.TOKEN.",
      "Mention ANIME.TOKEN in collaborations or influencer shoutouts where possible."
    ],
    reward: "Limited edition NFT proving your role and influence.",
    details: "Ambassadors serve as the bridge between ANIME.TOKEN and new audiences, representing our vision. The NFT is a badge of trust, signaling your active role in shaping the project's public presence."
  },
  {
    id: "hodlers",
    icon: "🏆",
    title: "ANIME ARMY Loyalty Ranks",
    image: hodlersNFT,
    role: "Role: Loyal Supporter",
    description: "A program to recognize our most dedicated supporters. The blockchain verifies your loyalty, and each rank unlocks unique recognition and status within the ANIME ARMY.",
    howToEarn: [
      "Hold $ANIME for a qualifying period:",
      "• Gold: 3 months holding period",
      "• Diamond: 12 months holding period", 
      "• Legend: Never sold since acquisition",
      "Activity is optional but encouraged — engaging with the community increases recognition.",
      "Use hashtags: #ANIME #ANIME.TOKEN #AnimeDotToken $ANIME #ANIMEhodlers"
    ],
    reward: "NFT showing your level — Gold, Diamond, or Legend Hodler.",
    details: "Hodler NFTs are a way to celebrate loyalty. The blockchain verifies your holding history, and each tier unlocks unique recognition in the community."
  }
];

export function NFTSupporterSection() {
  const [openDetails, setOpenDetails] = useState<string | null>(null);

  return (
    <section id="nft-supporter-section" className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <div>
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            🎖 ANIME.TOKEN Supporter NFT Program
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Our ecosystem is powered by three distinct and vital groups. This program outlines the three exclusive NFTs created to recognize and reward each of our most valued community supporters. Find your role, contribute to the mission, and earn your on-chain recognition.
          </p>
        </div>

        {/* Section 1: The ANIME ARMY */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-center mb-6">Section 1: The ANIME ARMY</h3>
        </div>

        {/* NFT Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {nftTypes.map((nft) => (
            <Card key={nft.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardContent className="p-6">
                {/* NFT Image */}
                <div className="mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={nft.image} 
                    alt={nft.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Icon and Title */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{nft.icon}</div>
                  {nft.id === "founders" && (
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                  )}
                  <h3 className="text-xl font-bold">{nft.title}</h3>
                </div>
                
                
                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{nft.description}</p>
                
                {/* How to Earn */}
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">How to Earn:</h4>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p className="leading-relaxed">{nft.howToEarn[0]}</p>
                    <div className="space-y-2 mt-3">
                      {nft.howToEarn.slice(1).map((item, index) => {
                        const [title, description] = item.split('|');
                        return (
                          <div key={index} className="bg-muted/30 p-3 rounded">
                            <h5 className="font-semibold text-xs mb-1">{title}</h5>
                            <p className="leading-relaxed text-xs">{description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* Already Supporting Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
            <h3 className="text-xl md:text-2xl font-semibold mb-4">
              💬 Already Supporting? Think You Qualify?
            </h3>
            <p className="text-muted-foreground mb-6">
              We don't sell these NFTs — we award them. If you've been promoting ANIME.TOKEN, inviting others, or holding strong, you may already be eligible.
            </p>
            <Button 
              size="lg" 
              onClick={() => window.open('https://discord.gg/your-discord', '_blank')}
            >
              📩 Let's Connect
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Send us a message on Twitter or Discord so we can check your activity and mint your NFT.
            </p>
          </div>
        </div>

        {/* Why These NFTs Matter */}
        <div className="text-center mb-8">
          <h3 className="text-xl md:text-2xl font-semibold mb-6">
            🔍 Why These NFTs Matter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl mb-2">🔗</div>
              <h4 className="font-semibold mb-2">Proof of Contribution</h4>
              <p className="text-sm text-muted-foreground">Forever linked to your wallet on Solana.</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-semibold mb-2">Exclusive Recognition</h4>
              <p className="text-sm text-muted-foreground">Different roles mean different perks and roles in the community.</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-semibold mb-2">Part of History</h4>
              <p className="text-sm text-muted-foreground">Early support is rewarded long-term.</p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="text-center">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">
            📌 Quick Start
          </h3>
          <div className="max-w-2xl mx-auto space-y-3 text-muted-foreground mb-6">
            <p>1. Pick a role you want to aim for (Founder, Ambassador, or Hodler).</p>
            <p>2. Follow the "How to Earn" steps for that NFT.</p>
            <p>3. Stay active, use the hashtags, and let us know when you're ready.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="min-w-[160px]"
              onClick={() => window.open('https://discord.gg/your-discord', '_blank')}
            >
              Join Discord
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="min-w-[160px]"
              onClick={() => window.open('https://twitter.com/AnimeDotToken', '_blank')}
            >
              Follow on X
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}