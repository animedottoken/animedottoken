import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import foundersNFT from "@/assets/nft-founders.jpg";
import ambassadorsNFT from "@/assets/nft-ambassadors.jpg";
import hodlersNFT from "@/assets/nft-hodlers.jpg";

const nftTypes = [
  {
    id: "founders",
    icon: "🥇",
    title: "Founder",
    image: foundersNFT,
    value: "Value: $100",
    description: "Exclusive recognition for early builders and visionaries who help establish the foundation of ANIME.TOKEN.",
    howToEarn: [
      "Promote ANIME.TOKEN on Twitter (X), Discord, or other social platforms using our hashtags:",
      "#ANIME #ANIME.TOKEN #AnimeDotToken $ANIME #ANIMEfounders",
      "Share at least 3 posts per week mentioning ANIME.TOKEN or linking to our content.",
      "Actively invite at least 5 new people to join our Discord or follow our Twitter.",
      "Participate in at least 1 community discussion/event per month."
    ],
    reward: "Unique, verifiable NFT on the Solana blockchain.",
    details: "Proof of activity can be screenshots, link history, or public posts we can verify. Founder NFTs are limited and given only once — holders will be recognized as the original visionaries of the ANIME revival."
  },
  {
    id: "ambassadors", 
    icon: "🤝",
    title: "Ambassador",
    image: ambassadorsNFT,
    value: "Value: $100",
    description: "Recognition for active community builders driving engagement, conversation, and influence across target communities.",
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
    title: "Hodler",
    image: hodlersNFT,
    value: "Value: $100",
    description: "Loyalty recognition for dedicated supporters who believe in ANIME.TOKEN's long-term vision and hold through market cycles.",
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
    <section id="nft-supporter-section" className="py-16 px-4 bg-gradient-to-br from-background via-background/80 to-muted/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            🎖 ANIME.TOKEN Supporter NFT Program
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Three exclusive NFTs to recognize and reward our most valued community supporters. Earn yours by helping grow ANIME.TOKEN — no purchase required.
          </p>
          <div className="mt-4 text-sm text-muted-foreground font-medium">
            Free Rewards • Choose Your Channel • Verified Recognition
          </div>
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
                  <h3 className="text-xl font-bold">{nft.title}</h3>
                </div>
                
                {/* Value */}
                <p className="text-primary font-semibold text-sm mb-1 text-center">{nft.value}</p>
                
                {/* Limitation */}
                <div className="mb-3 flex justify-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                    {nft.id === "founders" && "Max: 100 NFTs"}
                    {nft.id === "ambassadors" && "Max: 1,000 NFTs"}
                    {nft.id === "hodlers" && "Unlimited"}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{nft.description}</p>
                
                {/* How to Earn */}
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">How to Earn:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {nft.howToEarn.slice(0, 2).map((item, index) => (
                      <li key={index} className="leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* Expandable Details */}
                <div className="mb-4">
                  <Collapsible 
                    open={openDetails === nft.id} 
                    onOpenChange={(open) => setOpenDetails(open ? nft.id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="link" className="px-0 text-xs mb-2">
                        {openDetails === nft.id ? "Hide details" : "Show details"}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3">
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {nft.howToEarn.slice(2).map((item, index) => (
                          <li key={index} className="leading-relaxed">• {item}</li>
                        ))}
                      </ul>
                      <div className="text-xs">
                        <p className="font-medium text-foreground mb-1">Reward:</p>
                        <p className="text-muted-foreground">{nft.reward}</p>
                      </div>
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <p className="text-muted-foreground leading-relaxed">{nft.details}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
            <Button 
              variant="ghost" 
              size="lg" 
              className="min-w-[160px]"
              onClick={() => document.getElementById('how-to-buy')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Buy $ANIME
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}