import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface FollowedAuthorCardProps {
  wallet_address: string;
  nickname?: string;
  bio?: string;
  profile_image_url?: string;
  followerCount: number;
  onClick: (walletAddress: string) => void;
}

export const FollowedAuthorCard = ({
  wallet_address,
  nickname,
  bio,
  profile_image_url,
  followerCount,
  onClick
}: FollowedAuthorCardProps) => {
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onClick(wallet_address)}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Avatar */}
        <div className="flex-shrink-0 mb-3">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage 
              src={profile_image_url || '/placeholder.svg'} 
              alt="Profile" 
            />
            <AvatarFallback className="text-lg font-bold">
              {nickname?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Name */}
        <h3 className="font-semibold text-center mb-2 group-hover:text-primary transition-colors truncate">
          {nickname || 'Anonymous User'}
        </h3>
        
        {/* Profile Likes */}
        <div className="flex items-center justify-center gap-2 mb-3" title="Profile likes">
          <Heart className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium">{followerCount}</span>
        </div>
        
        {/* Bio */}
        <div className="flex-1 flex items-center">
          {bio ? (
            <p className="text-xs text-muted-foreground line-clamp-3 text-center">
              {bio}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic text-center">
              No bio added yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};