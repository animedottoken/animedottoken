import { supabase } from '@/integrations/supabase/client';

export const uploadMetadataToStorage = async (
  metadata: object,
  type: 'collection' | 'nft',
  name: string
): Promise<string> => {
  try {
    const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    const filePath = `metadata/${fileName}`;
    
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const { error: uploadError } = await supabase.storage
      .from('nft-media')
      .upload(filePath, metadataBlob);
    
    if (uploadError) {
      console.error('Metadata upload error:', uploadError);
      throw new Error('Failed to upload metadata');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('nft-media')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
};

export const createExplorerUrl = (signature: string, cluster: 'devnet' | 'mainnet'): string => {
  const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
};

export const createAddressUrl = (address: string, cluster: 'devnet' | 'mainnet'): string => {
  const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/address/${address}${clusterParam}`;
};

export const requestDevnetAirdrop = async (walletAddress: string): Promise<{success: boolean; signature?: string; error?: string}> => {
  try {
    // Use the public Solana devnet faucet
    const response = await fetch('https://faucet.solana.com/airdrop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: walletAddress,
        lamports: 2000000000, // 2 SOL
      }),
    });
    
    if (!response.ok) {
      throw new Error('Faucet request failed');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      signature: data.signature || 'airdrop-success',
    };
  } catch (error: any) {
    console.error('Airdrop error:', error);
    return {
      success: false,
      error: error.message || 'Airdrop failed',
    };
  }
};