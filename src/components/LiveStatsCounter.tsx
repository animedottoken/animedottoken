import { useTokenHolders } from "@/hooks/useTokenHolders";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Users, MessageCircle, Twitter } from "lucide-react";

export function LiveStatsCounter() {
  const holders = useTokenHolders("GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump");
  const { discordMembers, twitterFollowers } = useLiveStats();

  const stats = [
    {
      icon: Users,
      label: "$ANIME Holders",
      value: holders?.toLocaleString() || "Loading...",
      color: "text-primary"
    },
    {
      icon: MessageCircle,
      label: "Discord Members",
      value: discordMembers?.toLocaleString() || "Loading...",
      color: "text-accent"
    },
    {
      icon: Twitter,
      label: "X Followers",
      value: twitterFollowers?.toLocaleString() || "Loading...",
      color: "text-secondary"
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
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/70 font-medium">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}