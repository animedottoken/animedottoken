import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GamifiedProfile {
  wallet_address: string;
  nickname?: string;
  bio?: string;
  trade_count: number;
  profile_rank: 'DEFAULT' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  pfp_unlock_status: boolean;
  bio_unlock_status?: boolean;
  current_pfp_nft_mint_address?: string;
  profile_image_url?: string;
  banner_image_url?: string;
}

export interface UserNFT {
  mint_address: string;
  name: string;
  image_url?: string;
  symbol?: string;
}

export const useGamifiedProfile = () => {
  const [profile, setProfile] = useState<GamifiedProfile | null>(null);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [pfpLoading, setPfpLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const { publicKey, connected } = useSolanaWallet();

  const fetchProfile = useCallback(async () => {
    if (!connected || !publicKey) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-profile', {
        body: { wallet_address: publicKey.toString() },
      });

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchUserNFTs = useCallback(async () => {
    if (!connected || !publicKey) {
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
      toast.error('Failed to load your NFTs');
    }
  }, [connected, publicKey]);

  const setNickname = useCallback(async (nickname: string, transactionSignature?: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setNicknameLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-nickname', {
        body: { 
          nickname, 
          wallet_address: publicKey.toString(),
          transaction_signature: transactionSignature 
        },
      });

      if (error) {
        // Handle specific error cases with better messaging
        if (error.message?.includes('NICKNAME_ALREADY_SET')) {
          toast.error('You already have a nickname set. You can only set your nickname once.');
        } else if (error.message?.includes('already taken')) {
          toast.error('This nickname is already taken. Please choose a different one.');
        } else {
          toast.error(error.message || 'Failed to set nickname');
        }
        return false;
      }
      
      toast.success(`Nickname "${nickname}" set successfully!`);
      await fetchProfile(); // Refresh profile
      return true;
    } catch (err: any) {
      console.error('Error setting nickname:', err);
      toast.error(err.message || 'Failed to set nickname');
      return false;
    } finally {
      setNicknameLoading(false);
    }
  }, [connected, publicKey, fetchProfile]);

  const unlockPFP = useCallback(async (transactionSignature: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setPfpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('unlock-pfp', {
        body: { wallet_address: publicKey.toString(), transaction_signature: transactionSignature },
      });

      if (error) throw error;
      
      toast.success('PFP feature unlocked successfully!');
      await fetchProfile(); // Refresh profile
      return true;
    } catch (err: any) {
      console.error('Error unlocking PFP:', err);
      toast.error(err.message || 'Failed to unlock PFP feature');
      return false;
    } finally {
      setPfpLoading(false);
    }
  }, [connected, publicKey, fetchProfile]);

  const setPFP = useCallback(async (nftMintAddress: string, transactionSignature: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setPfpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-pfp', {
        body: { 
          nft_mint_address: nftMintAddress, 
          wallet_address: publicKey.toString(),
          transaction_signature: transactionSignature
        },
      });

      if (error) throw error;
      
      toast.success('Profile picture updated successfully!');
      await fetchProfile(); // Refresh profile
      return true;
    } catch (err: any) {
      console.error('Error setting PFP:', err);
      toast.error(err.message || 'Failed to set profile picture');
      return false;
    } finally {
      setPfpLoading(false);
    }
  }, [connected, publicKey, fetchProfile]);

  const setBio = useCallback(async (bio: string, transactionSignature: string): Promise<boolean> => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setBioLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-bio', {
        body: { 
          bio: bio.trim(),
          transaction_signature: transactionSignature,
          wallet_address: publicKey.toString()
        },
      });

      if (error) {
        console.error('Error setting bio:', error);
        toast.error(error.message || 'Failed to set bio');
        return false;
      }

      if (data.error) {
        console.error('Error in set-bio response:', data.error);
        toast.error(data.error);
        return false;
      }

      // Refresh profile data
      await fetchProfile();
      
      return true;
    } catch (error) {
      console.error('Error setting bio:', error);
      toast.error('Failed to set bio');
      return false;
    } finally {
      setBioLoading(false);
    }
  }, [connected, publicKey, fetchProfile]);

  const setBanner = useCallback(async (bannerFile: File): Promise<boolean> => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setBioLoading(true); // Reuse bio loading state for banner
    try {
      // Upload to Supabase Storage
      const fileName = `banner_${publicKey.toString()}_${Date.now()}.${bannerFile.name.split('.').pop()}`;
      const filePath = `banners/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('collection-images')
        .upload(filePath, bannerFile);

      if (uploadError) {
        console.error('Error uploading banner:', uploadError);
        toast.error('Failed to upload banner image');
        return false;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('collection-images')
        .getPublicUrl(filePath);

      // Update profile with new banner URL
      const { data, error } = await supabase.functions.invoke('set-banner', {
        body: { 
          banner_url: urlData.publicUrl,
          wallet_address: publicKey.toString(),
          transaction_signature: 'simulated_banner_transaction'
        },
      });

      if (error) {
        console.error('Error setting banner:', error);
        toast.error(error.message || 'Failed to update banner');
        return false;
      }

      if (data.error) {
        console.error('Error in set-banner response:', data.error);
        toast.error(data.error);
        return false;
      }

      toast.success('Banner updated successfully!');
      await fetchProfile();
      
      return true;
    } catch (error) {
      console.error('Error setting banner:', error);
      toast.error('Failed to update banner');
      return false;
    } finally {
      setBioLoading(false);
    }
  }, [connected, publicKey, fetchProfile]);

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

  useEffect(() => {
    fetchProfile();
    fetchUserNFTs();
  }, [fetchProfile, fetchUserNFTs]);

  return {
    profile,
    userNFTs,
    loading,
    nicknameLoading,
    pfpLoading,
    bioLoading,
    setNickname,
    unlockPFP,
    setPFP,
    setBio,
    setBanner,
    getRankColor,
    getRankBadge,
    fetchProfile,
    fetchUserNFTs,
  };
};