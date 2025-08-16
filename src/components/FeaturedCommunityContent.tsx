import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiDiscord, SiX } from "react-icons/si";
import { Loader2, Upload, ExternalLink } from "lucide-react";
import communityPlaceholder from "@/assets/community-featured-placeholder.jpg";
import { useFeaturedContent, type FeaturedSubmission } from "@/hooks/useFeaturedContent";

const emptySlots = [
  { 
    placeholder: communityPlaceholder,
    overlay: "Your art here",
    cta: "Submit your work to be featured!",
    type: "art" 
  },
  { 
    placeholder: communityPlaceholder,
    overlay: "Your art here",
    cta: "Submit your work to be featured!",
    type: "art" 
  },
  { 
    placeholder: communityPlaceholder,
    overlay: "Your meme here",
    cta: "Make us laugh with your creativity!",
    type: "meme" 
  }
];

export function FeaturedCommunityContent() {
  const { data: featuredContent, isLoading, error } = useFeaturedContent();
  
  // Create slots array with featured content and empty placeholders
  const slots = Array.from({ length: 3 }, (_, index) => {
    const position = index + 1; // positions are 1, 2, 3
    const featuredItem = featuredContent?.find(item => item.position === position);
    
    if (featuredItem) {
      return { type: 'featured', content: featuredItem };
    }
    return { type: 'empty', content: emptySlots[index] };
  });

  // Defensive handling: if there's an error, quietly show placeholders
  if (error) {
    console.error('Featured content error:', error);
    // Continue with empty slots instead of breaking the UI
  }

  return (
    <section className="mx-auto mt-16 max-w-5xl px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-white">
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
            onClick={() => window.open('https://discord.gg/EZ9wRhjr', '_blank')}
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading community content...</span>
        </div>
      )}

      {/* Featured Content Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {slots.map((slot, index) => {
            if (slot.type === 'featured') {
              const submission = slot.content as FeaturedSubmission;
              return (
                <div key={submission.id} className="group relative overflow-hidden rounded-lg border bg-card">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={submission.image}
                      alt={submission.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {submission.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{submission.author}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {submission.caption}
                    </p>
                  </div>
                </div>
              );
            } else {
              const emptySlot = slot.content as typeof emptySlots[0];
              return (
                <div key={`empty-${index}`} className="group relative overflow-hidden rounded-lg border bg-card/50 border-dashed">
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={emptySlot.placeholder}
                      alt="Community submission placeholder"
                      className="w-full h-full object-cover opacity-30"
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
                        Your Spot
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submit your amazing art to be featured here!
                    </p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </section>
  );
}