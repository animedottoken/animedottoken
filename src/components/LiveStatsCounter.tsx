import { useTokenHolders } from "@/hooks/useTokenHolders";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Users, MessageCircle, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiDiscord, SiX } from "react-icons/si";

export function LiveStatsCounter() {
  const holders = useTokenHolders("GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump");
  const { discordMembers, twitterFollowers } = useLiveStats();

  const stats = [
    {
      icon: Users,
      label: "$ANIME Holders",
      value: holders?.toLocaleString() || "Loading...",
      color: "text-primary",
      button: (
        <Button 
          variant="default" 
          size="sm" 
          className="bg-purple-600 hover:bg-purple-700 text-white border-0"
          onClick={() => document.getElementById('how-to-buy')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Buy $ANIME
        </Button>
      )
    },
    {
      icon: MessageCircle,
      label: "New server—be among the first to join!",
      value: "", // Hide the number
      color: "text-accent",
      button: (
        <Button asChild variant="glass" size="sm">
          <a href="https://discord.gg/EZ9wRhjr" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2">
            <SiDiscord className="h-4 w-4" aria-hidden="true" />
            Join Discord
          </a>
        </Button>
      )
    },
    {
      icon: Twitter,
      label: "X Followers",
      value: twitterFollowers?.toLocaleString() || "Loading...",
      color: "text-primary",
      button: (
        <Button asChild variant="glass" size="sm">
          <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2">
            <SiX className="h-4 w-4" aria-hidden="true" />
            Follow us
          </a>
        </Button>
      )
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <IconComponent className={`h-8 w-8 mb-3 ${stat.color}`} aria-hidden="true" />
              {stat.value && (
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
              )}
              <div className={`text-sm text-white/70 font-medium mb-4 text-center ${!stat.value ? 'mt-4' : ''}`}>
                {stat.label}
              </div>
              {stat.button}
            </div>
          );
        })}
      </div>
    </div>
  );
}