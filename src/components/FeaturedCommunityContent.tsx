import { Button } from "@/components/ui/button";
import { SiDiscord, SiX } from "react-icons/si";
import communityPlaceholder from "@/assets/community-featured-placeholder.jpg";

export function FeaturedCommunityContent() {
  return (
    <section className="w-full max-w-6xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Featured Community Content
        </h2>
        <p className="text-white/70 text-lg">
          Celebrating creativity from our amazing community
        </p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Placeholder Image */}
          <div className="relative overflow-hidden rounded-lg">
            <img 
              src={communityPlaceholder} 
              alt="Community content placeholder showing anime characters creating art"
              className="w-full h-40 lg:h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Content */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white mb-4">
              Your Art Could Be Here!
            </h3>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              Your art, memes, or stories could be featured here! Submit on Discord or tag us on X.
            </p>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild variant="glass" size="lg" className="inline-flex items-center gap-3">
                <a 
                  href="https://discord.gg/animetoken" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="flex items-center gap-3"
                >
                  <SiDiscord className="h-5 w-5" aria-hidden="true" />
                  Submit on Discord
                </a>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="inline-flex items-center gap-3 border-white/20 text-white hover:bg-white/10">
                <a 
                  href="https://x.com/AnimeDotToken" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="flex items-center gap-3"
                >
                  <SiX className="h-5 w-5" aria-hidden="true" />
                  Tag us on X
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Community Submissions Area */}
        <div className="mt-8 bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-3xl">🎨</span>
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">
              Community Showcase
            </h4>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              This space features amazing community submissions. Your creativity could be showcased here!
            </p>
          </div>
          
          {/* Community Content Slots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Slot 1 - Empty with overlay */}
            <div className="relative aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎨</div>
                  <div className="text-white/80 font-medium text-sm">Your art here</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Slot 2 - Empty with overlay */}
            <div className="relative aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-white/80 font-medium text-sm">Coming soon!</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Slot 3 - Empty with overlay */}
            <div className="relative aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎭</div>
                  <div className="text-white/80 font-medium text-sm">Your meme here</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* Call to Action Prompt */}
          <div className="text-center">
            <p className="text-purple-400 font-semibold text-lg mb-2">
              Submit your work to be featured!
            </p>
            <p className="text-white/60 text-sm">
              Share your art, memes, or stories with our community and get showcased here
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          We review all submissions and feature the best content weekly. 
          <span className="text-purple-400"> Keep creating!</span>
        </p>
      </div>
    </section>
  );
}