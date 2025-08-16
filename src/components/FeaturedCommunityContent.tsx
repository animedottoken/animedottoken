import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, ExternalLink, Users } from "lucide-react";
import communityPlaceholder from "@/assets/community-featured-placeholder.jpg";
import communityMeme from "@/assets/community-meme-sample.jpg";
import communityTwitter from "@/assets/community-twitter-sample.jpg";

const emptySlots = [
  { 
    placeholder: communityTwitter,
    overlay: "Sample Post",
    cta: "Example: a strong X post that got great engagement.",
    type: "post",
    sample: true,
  },
  { 
    placeholder: communityPlaceholder,
    overlay: "Your art here",
    cta: "Submit your work to be featured!",
    type: "art",
    sample: false,
  },
  { 
    placeholder: communityMeme,
    overlay: "Sample Meme",
    cta: "Anime meme example that made people laugh!",
    type: "meme",
    sample: true,
  }
];

export function FeaturedCommunityContent() {
  return (
    <section className="mx-auto mt-16 max-w-5xl px-4 featured-community-content">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-white">
          <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">👥</span>
          Community Showcase
        </h2>
        <p className="text-muted-foreground text-lg mb-6">
          See what our amazing community is creating! Submit your ANIME-inspired content to be featured.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button 
            variant="outline" 
            className="gap-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
            onClick={() => window.open('https://discord.gg/HmSJdT5MRX', '_blank')}
          >
            <Upload className="w-4 h-4 text-purple-400" />
            Submit on Discord
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
            onClick={() => window.open('https://x.com/AnimeDotToken', '_blank')}
          >
            <ExternalLink className="w-4 h-4 text-purple-400" />
            Tag us on X
          </Button>
        </div>
      </div>

      {/* Static placeholders only (no backend) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {emptySlots.map((emptySlot, index) => (
          <div key={`empty-${index}`} className="group relative overflow-hidden rounded-lg border bg-card/50 border-dashed">
            <div className="aspect-square overflow-hidden relative">
              <img
                src={emptySlot.placeholder}
                alt={emptySlot.sample ? (emptySlot.type === "post" ? "Sample social post" : "Sample anime meme") : "Community submission placeholder"}
                className="w-full h-full object-cover opacity-30"
                loading="lazy"
                decoding="async"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-center p-4">
                <div className="mb-3">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-lg font-semibold text-foreground">{emptySlot.overlay}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {emptySlot.cta}
                </p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs border-dashed">
                  {emptySlot.sample ? "Sample" : "Your Spot"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Submit your amazing art to be featured here!
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}