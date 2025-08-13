import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import foundersNFT from "@/assets/nft-founders.jpg";
import ambassadorsNFT from "@/assets/nft-ambassadors.jpg";
import hodlersNFT from "@/assets/nft-hodlers.jpg";

const nftTypes = [
  {
    id: "founders",
    title: "Founders NFT",
    image: foundersNFT,
    description: "Held 100,000+ $ANIME before Aug 1, 2025",
    subtitle: "Early believers who established the foundation"
  },
  {
    id: "ambassadors", 
    title: "Ambassadors NFT",
    image: ambassadorsNFT,
    description: "Active on Twitter, TikTok, YouTube, Discord, or Blog writing",
    subtitle: "Choose your channel and start promoting ANIME.TOKEN"
  },
  {
    id: "hodlers",
    title: "Hodlers NFT",
    image: hodlersNFT,
    description: "Gold (90 days), Diamond (365 days), or Eternal holders",
    subtitle: "Long-term supporters with verified wallet holding"
  }
];

export function NFTSupporterSection() {
  return (
    <section id="nft-supporter-section" className="py-16 px-4 bg-gradient-to-br from-background via-background/80 to-muted/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            🎖 ANIME.TOKEN Supporter NFT Program
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Earn exclusive NFTs by supporting ANIME.TOKEN across different channels. Choose your preferred platform and start contributing to our community.
          </p>
          <div className="mt-4 text-sm text-muted-foreground font-medium">
            Free Rewards • Choose Your Channel • Verified Recognition
          </div>
        </div>

        {/* NFT Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {nftTypes.map((nft, index) => (
            <Card key={nft.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardContent className="p-6 text-center">
                {/* NFT Image */}
                <div className="mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={nft.image} 
                    alt={nft.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{nft.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{nft.subtitle}</p>
                <p className="text-sm leading-relaxed">{nft.description}</p>
                
                {/* Limited Edition Badge */}
                <div className="mt-4 inline-block">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Limited Edition #{String(index + 1).padStart(3, '0')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">
            Be part of ANIME.TOKEN history
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join our growing community of supporters, builders, and believers. Recognition starts with participation.
          </p>
          
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