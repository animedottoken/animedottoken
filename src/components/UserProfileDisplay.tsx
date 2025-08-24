import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { truncateAddress } from '@/utils/addressUtils';

interface UserProfile {
  wallet_address: string;
  nickname?: string;
  trade_count: number;
  profile_rank: 'DEFAULT' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  profile_image_url?: string;
}

interface UserProfileDisplayProps {
  walletAddress: string;
  showRankBadge?: boolean;
  showTradeCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserProfileDisplay = ({ 
  walletAddress, 
  showRankBadge = true, 
  showTradeCount = false,
  size = 'md',
  className = '' 
}: UserProfileDisplayProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-profile', {
          body: { wallet_address: walletAddress },
        });

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [walletAddress]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'BRONZE': return 'border-amber-600';
      case 'SILVER': return 'border-slate-400';
      case 'GOLD': return 'border-yellow-500';
      case 'DIAMOND': return 'border-cyan-400';
      default: return 'border-border';
    }
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'BRONZE': return { text: 'Bronze', color: 'bg-amber-600' };
      case 'SILVER': return { text: 'Silver', color: 'bg-slate-400' };
      case 'GOLD': return { text: 'Gold', color: 'bg-yellow-500' };
      case 'DIAMOND': return { text: 'Diamond', color: 'bg-cyan-400' };
      default: return { text: 'Rookie', color: 'bg-muted' };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return { avatar: 'w-8 h-8', text: 'text-sm', badge: 'text-xs' };
      case 'md': return { avatar: 'w-10 h-10', text: 'text-sm', badge: 'text-xs' };
      case 'lg': return { avatar: 'w-12 h-12', text: 'text-base', badge: 'text-sm' };
      default: return { avatar: 'w-10 h-10', text: 'text-sm', badge: 'text-xs' };
    }
  };

  if (loading) {
    const sizeClasses = getSizeClasses();
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses.avatar} rounded-full bg-muted animate-pulse`} />
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded w-20 animate-pulse" />
          {showTradeCount && <div className="h-2 bg-muted rounded w-12 animate-pulse" />}
        </div>
      </div>
    );
  }

  const displayName = profile?.nickname || truncateAddress(walletAddress);
  const rankColor = getRankColor(profile?.profile_rank || 'DEFAULT');
  const rankBadge = getRankBadge(profile?.profile_rank || 'DEFAULT');
  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Avatar className={`${sizeClasses.avatar} border-2 ${rankColor}`}>
          <AvatarImage 
            src={profile?.profile_image_url} 
            alt={displayName} 
          />
          <AvatarFallback className="font-bold">
            {profile?.nickname ? profile.nickname[0].toUpperCase() : walletAddress.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {showRankBadge && profile?.profile_rank !== 'DEFAULT' && (
          <Badge 
            className={`absolute -bottom-1 -right-1 ${rankBadge.color} text-white ${sizeClasses.badge} px-1`}
          >
            <Crown className="w-2 h-2 mr-0.5" />
            {size === 'lg' ? rankBadge.text[0] : ''}
          </Badge>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`font-medium truncate ${sizeClasses.text}`}>
          {displayName}
        </div>
        {showTradeCount && profile && (
          <div className="text-xs text-muted-foreground">
            {profile.trade_count} trades
          </div>
        )}
      </div>
    </div>
  );
};