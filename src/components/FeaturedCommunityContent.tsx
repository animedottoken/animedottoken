import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, ExternalLink, Users } from "lucide-react";
import { useState } from "react";
import communityPlaceholder from "@/assets/community-featured-placeholder.jpg";
import sampleTwitterPost from "@/assets/sample-twitter-post.jpg";
import sampleAnimeMeme from "@/assets/sample-anime-meme.jpg";

const emptySlots = [
  { 
    id: 1,
    placeholder: sampleAnimeMeme,
    overlay: "Top Community Meme",
    cta: "Made everyone laugh for days!",
    type: "meme",
    sample: true,
    title: "Viral $ANIME Meme",
    description: "Created the funniest $ANIME meme that went viral!",
    createdBy: "@MemeLord_Otaku",
    achievement: "Achieved 2,500 retweets and 15K likes in just 3 days!"
  },
  { 
    id: 2,
    placeholder: communityPlaceholder,
    overlay: "Your art here",
    cta: "Submit your work to be featured!",
    type: "art",
    sample: false,
    title: "Your Spot",
    description: "Submit your amazing anime art or meme here to get featured!",
    createdBy: "",
    achievement: ""
  },
  { 
    id: 3,
    placeholder: sampleTwitterPost,
    overlay: "Viral X Post",
    cta: "This post got 10K+ engagements!",
    type: "post",
    sample: true,
    title: "Community Growth Post",
    description: "Shared their $ANIME journey and got massive community love!",
    createdBy: "@CryptoSamurai_",
    achievement: "Generated 10K+ engagements and brought 500+ new holders!"
  }
];

export function FeaturedCommunityContent() {
  const [selectedItem, setSelectedItem] = useState<typeof emptySlots[0] | null>(null);
  const [isItemOverlayOpen, setIsItemOverlayOpen] = useState(false);

  return (
    <section className="mx-auto mt-16 max-w-5xl px-4 featured-community-content">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-white">
          <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">👥</span>
          Community Showcase
        </h2>
        <p className="text-muted-foreground text-lg mb-6">
          See what our community is creating! Submit your ANIME-inspired memes, art, or posts to be featured.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button 
            variant="outline" 
            className="gap-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
            onClick={() => window.open('https://discord.gg/jqxCbvZvn7', '_blank')}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emptySlots.map((emptySlot, index) => (
            <div 
              key={`empty-${index}`} 
              className={`group relative overflow-hidden rounded-lg border bg-card/50 border-dashed ${emptySlot.sample ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
              onClick={() => emptySlot.sample && setSelectedItem(emptySlot)}
            >
              <div className="aspect-square overflow-hidden relative">
                {emptySlot.sample && (
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                    <Badge variant="destructive" className="bg-red-500/90 text-white border-red-500/50 text-xs">
                      Sample
                    </Badge>
                  </div>
                )}
                <img
                  src={emptySlot.placeholder}
                  alt={emptySlot.sample ? (emptySlot.type === "post" ? "Sample social post" : "Sample anime meme") : "Community submission placeholder"}
                  className={`w-full h-full object-cover ${emptySlot.sample ? "opacity-100" : "opacity-30"}`}
                  loading="lazy"
                  decoding="async"
                />
                
                {/* Overlay */}
                {!emptySlot.sample && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center text-center p-4">
                    <div className="mb-3">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-lg font-semibold text-foreground">{emptySlot.overlay}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {emptySlot.cta}
                    </p>
                  </div>
                )}
              </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1">{emptySlot.title}</h3>
              <p className="text-sm text-muted-foreground">
                {emptySlot.description}
              </p>
            </div>
            </div>
        ))}
      </div>

      {/* Community Item Details Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Community Content - {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="group relative">
                  <div 
                    className="aspect-square overflow-hidden rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all"
                    onClick={() => setIsItemOverlayOpen(true)}
                  >
                    <img 
                      src={selectedItem.placeholder}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">Click to view fullscreen</p>
                </div>
              </div>
              
              {/* Details Section */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-1">Created by</h3>
                    <p className="font-medium">{selectedItem.createdBy}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-1">Achievement</h3>
                    <p className="text-sm">{selectedItem.achievement}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    This is a sample from our community showcase. Real submissions will be featured here when submitted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isItemOverlayOpen && selectedItem && (
            <div
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
              onClick={(e) => { if (e.currentTarget === e.target) setIsItemOverlayOpen(false); }}
            >
              <button
                aria-label="Close fullscreen"
                onClick={(e) => { e.stopPropagation(); setIsItemOverlayOpen(false); }}
                className="absolute top-5 right-6 rounded-full bg-white/20 hover:bg-white/30 text-white w-12 h-12 text-3xl leading-none"
              >
                ×
              </button>
              <img src={selectedItem.placeholder} alt={selectedItem.title} className="max-w-[90%] max-h-[90%] object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}