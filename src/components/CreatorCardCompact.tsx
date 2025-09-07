import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Heart, Image, Layers } from 'lucide-react';
import { Creator } from '@/hooks/useCreatorsPublic';

interface CreatorCardCompactProps {
  creator: Creator;
}

export const CreatorCardCompact = ({ creator }: CreatorCardCompactProps) => {
  const getRankBadgeVariant = (rank: string) => {
    switch (rank) {
      case 'DIAMOND':
        return 'secondary';
      case 'GOLD':
        return 'outline';
      case 'SILVER':
        return 'secondary';
      case 'BRONZE':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Link to={`/creator/${creator.creator_user_id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={creator.profile_image_url} 
                alt={creator.nickname}
              />
              <AvatarFallback className="text-lg">
                {creator.nickname?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">
                  {creator.nickname}
                </h3>
                {creator.verified && (
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                )}
                {creator.profile_rank !== 'DEFAULT' && (
                  <Badge variant={getRankBadgeVariant(creator.profile_rank)}>
                    {creator.profile_rank}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{creator.follower_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{creator.total_likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  <span>{creator.created_nft_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>{creator.created_collection_count}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};