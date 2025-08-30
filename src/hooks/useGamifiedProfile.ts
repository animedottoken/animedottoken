import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GamifiedProfile {
  user_id?: string;
  wallet_address?: string;
  nickname?: string;
  bio?: string;
  trade_count: number;
  profile_rank: 'DEFAULT' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  pfp_unlock_status: boolean;
  bio_unlock_status?: boolean;
  current_pfp_nft_mint_address?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  nft_count?: number;
  collection_count?: number;
}

export interface UserNFT {
  mint_address: string;
  name: string;
  image_url?: string;
  symbol?: string;
}

export function useGamifiedProfile() {
  const [profile, setProfile] = useState<GamifiedProfile | null>(null);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();
  const { user } = useAuth();

  const fetchProfile = async () => {
    // Require authenticated user (Web2 identity)
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-profile', {
        body: {}
      });

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNFTs = async () => {
    if (!publicKey) {
      setUserNFTs([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('mint_address, name, image_url, symbol')
        .eq('owner_address', publicKey.toString());

      if (error) throw error;
      setUserNFTs(data || []);
    } catch (err) {
      console.error('Error fetching user NFTs:', err);
      setUserNFTs([]);
    }
  };

  const setNickname = async (nickname: string, paymentTxSignature?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in first");
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('upsert-profile', {
        body: { 
          nickname: nickname
        }
      });

      if (error) {
        toast.error(error.message || 'Failed to set nickname');
        return false;
      }
      
      toast.success(`Nickname "${nickname}" set successfully!`);
      await fetchProfile();
      return true;
    } catch (err: any) {
      console.error('Error setting nickname:', err);
      toast.error(err.message || 'Failed to set nickname');
      return false;
    }
  };

  const unlockPFP = async (transactionSignature: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('unlock-pfp', {
        body: { wallet_address: publicKey.toString(), transaction_signature: transactionSignature },
      });

      if (error) throw error;
      
      toast.success('PFP feature unlocked successfully!');
      await fetchProfile();
      return true;
    } catch (err: any) {
      console.error('Error unlocking PFP:', err);
      toast.error(err.message || 'Failed to unlock PFP feature');
      return false;
    }
  };

  const setPFP = async (nftMintAddress: string, transactionSignature?: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      toast.success('Profile picture updated successfully!');
      await fetchProfile();
      return true;
    } catch (err: any) {
      console.error('Error setting PFP:', err);
      toast.error(err.message || 'Failed to set profile picture');
      return false;
    }
  };

  const setBio = async (bio: string, paymentTxSignature?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in first");
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('upsert-profile', {
        body: { 
          bio: bio
        }
      });

      if (error) {
        console.error('Error setting bio:', error);
        toast.error(error.message || 'Failed to set bio');
        return false;
      }

      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error setting bio:', error);
      toast.error('Failed to set bio');
      return false;
    }
  };

  const setBanner = async (bannerFile: File, paymentTxSignature?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in first");
      return false;
    }

    try {
      // Upload to Supabase storage using user ID path
      const fileName = `${Date.now()}-banner.${bannerFile.type.split('/')[1]}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-banners')
        .upload(filePath, bannerFile);

      if (uploadError) {
        console.error('Banner upload error:', uploadError);
        toast.error("Failed to upload banner");
        return false;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-banners')
        .getPublicUrl(uploadData.path);

      // Update profile with new banner URL (no wallet_address needed)
      const { data, error } = await supabase.functions.invoke('upsert-profile', {
        body: { 
          banner_image_url: publicUrl
        }
      });

      if (error) {
        console.error('Banner update error:', error);
        toast.error("Failed to update banner");
        return false;
      }

      await fetchProfile();
      toast.success("Banner updated successfully!");
      return true;
    } catch (error) {
      console.error('Banner update error:', error);
      toast.error("Failed to update banner");
      return false;
    }
  };

  const getRankColor = useCallback((rank: string) => {
    switch (rank) {
      case 'BRONZE': return 'border-amber-600';
      case 'SILVER': return 'border-slate-400';
      case 'GOLD': return 'border-yellow-500';
      case 'DIAMOND': return 'border-cyan-400';
      default: return 'border-border';
    }
  }, []);

  const getRankBadge = useCallback((rank: string) => {
    switch (rank) {
      case 'BRONZE': return { text: 'Bronze', color: 'bg-amber-600', icon: '🥉' };
      case 'SILVER': return { text: 'Silver', color: 'bg-slate-400', icon: '🥈' };
      case 'GOLD': return { text: 'Gold', color: 'bg-yellow-500', icon: '🥇' };
      case 'DIAMOND': return { text: 'Diamond', color: 'bg-cyan-400', icon: '🏆' };
      default: return { text: 'Starter', color: 'bg-muted', icon: '🌟' };
    }
  }, []);

  // Add setAvatar function for file upload
  const setAvatar = async (avatarFile: File, paymentTxSignature?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in first");
      return false;
    }

    try {
      // Upload to Supabase storage using user ID path
      const fileName = `${Date.now()}-avatar.${avatarFile.type.split('/')[1]}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        toast.error("Failed to upload avatar");
        return false;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(uploadData.path);

      // Update profile with new avatar URL (no wallet_address needed)
      const { data, error } = await supabase.functions.invoke('upsert-profile', {
        body: { 
          profile_image_url: publicUrl
        }
      });

      if (error) {
        console.error('Avatar update error:', error);
        toast.error("Failed to update avatar");
        return false;
      }

      await fetchProfile();
      toast.success("Avatar updated successfully!");
      return true;
    } catch (error) {
      console.error('Avatar update error:', error);
      toast.error("Failed to update avatar");
      return false;
    }
  };

  const updateAssetCounts = async (): Promise<boolean> => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('update-user-asset-counts', {
        body: { wallet_address: publicKey.toString() }
      });

      if (error) {
        console.error('Asset count update error:', error);
        toast.error("Failed to update asset counts");
        return false;
      }

      await fetchProfile();
      toast.success("Asset counts updated!");
      return true;
    } catch (error) {
      console.error('Asset count update error:', error);
      toast.error("Failed to update asset counts");
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserNFTs();
  }, [user, publicKey]);

  return {
    profile,
    userNFTs,
    loading,
    fetchProfile,
    setNickname,
    unlockPFP,
    setPFP,
    setBio,
    setBanner,
    setAvatar,
    updateAssetCounts,
    getRankColor,
    getRankBadge
  };
};