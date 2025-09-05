import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useCollections } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';
import { Button } from '@/components/ui/button';
import { metaplexService, type CollectionMetadata } from '@/services/metaplexService';
import { uploadMetadataToStorage, createExplorerUrl } from '@/services/devnetHelpers';
import { CollectionBasicsStep } from './CollectionBasicsStep';
import { CollectionSettingsStep } from './CollectionSettingsStep';
import { CollectionReviewStep } from './CollectionReviewStep';
import { CollectionSuccessStep } from './CollectionSuccessStep';
import type { Property } from '@/components/PropertiesEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useUserWallets } from '@/hooks/useUserWallets';

interface FormData {
  name: string;
  symbol: string;
  site_description: string;
  onchain_description: string;
  image_file: File | null;
  banner_file: File | null;
  external_links: { type: string; url: string }[];
  category: string;
  explicit_content: boolean;
  enable_primary_sales: boolean;
  mint_price: number;
  supply_mode: string;
  max_supply: number;
  royalty_percentage: number;
  treasury_wallet: string;
  whitelist_enabled: boolean;
  go_live_date: string;
  mint_end_at: string;
  locked_fields: string[];
  attributes: Property[];
  mint_end_at_error?: string;
  image_preview_url: string | null;
  banner_preview_url: string | null;
}

export const UnifiedMintInterface = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [step3Collection, setStep3Collection] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingError, setMintingError] = useState(null);
  const [mintNow, setMintNow] = useState(true);
  const [collectionMintResult, setCollectionMintResult] = useState<{signature?: string; mintAddress?: string; explorerUrl?: string} | null>(null);
  const [pendingMintAfterConnect, setPendingMintAfterConnect] = useState(false);
  const [hasShownWalletConnectedToast, setHasShownWalletConnectedToast] = useState(false);
  const { createCollection } = useCollections({ suppressErrors: true });
  const { publicKey, connect, connecting } = useSolanaWallet();
  const { user } = useAuth();
  const { getPrimaryWallet } = useUserWallets();
  const { checkAccess, guardedAction } = useCircuitBreaker();
  const { logSuspiciousActivity } = useSecurityLogger();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fill treasury wallet when wallet is connected and show success toast
  useEffect(() => {
    if (publicKey) {
      // Auto-fill treasury wallet if it's empty
      if (!formData.treasury_wallet) {
        setFormData(prev => ({ ...prev, treasury_wallet: publicKey }));
      }
      
      // Show success toast only once when wallet actually connects (not on initial load)
      if (!hasShownWalletConnectedToast) {
        setHasShownWalletConnectedToast(true);
        toast.success('Wallet connected successfully!');
      }
      
      // If we were waiting to mint after connection, do it now
      if (pendingMintAfterConnect) {
        setPendingMintAfterConnect(false);
        handleSubmit();
      }
    } else {
      // Reset the toast flag and clear treasury wallet when wallet is disconnected
      setHasShownWalletConnectedToast(false);
      setFormData(prev => ({ ...prev, treasury_wallet: '' }));
    }
  }, [publicKey, pendingMintAfterConnect, hasShownWalletConnectedToast]);

  // Scroll to top when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStep]);

  // Step indicator component
  const TOTAL_STEPS = 3;
  const StepIndicator = () => (
    <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8 gap-2 sm:gap-0 px-4">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all
              ${activeStep >= step 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground text-muted-foreground'
              }
            `}>
              {activeStep > step ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <span className="font-semibold text-xs sm:text-sm">{step}</span>
              )}
            </div>
            {step < 3 && (
              <div className={`
                w-8 sm:w-16 h-0.5 mx-1 sm:mx-2
                ${activeStep > step ? 'bg-primary' : 'bg-muted-foreground/30'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="sm:ml-6 text-xs sm:text-sm text-muted-foreground">
        Step {activeStep} of {TOTAL_STEPS}
      </div>
    </div>
  );

  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    site_description: '',
    onchain_description: '',
    image_file: null,
    banner_file: null,
    external_links: [],
    category: '',
    explicit_content: false,
    enable_primary_sales: true,
    mint_price: 0,
    supply_mode: 'fixed',
    max_supply: 1000,
    royalty_percentage: 0,
    treasury_wallet: '',
    whitelist_enabled: false,
    go_live_date: '',
    mint_end_at: '',
    locked_fields: [],
    attributes: [],
    image_preview_url: null,
    banner_preview_url: null,
  });

  // Keep raw string for price input to allow typing values like "0.1"
  const [mintPriceInput, setMintPriceInput] = useState<string>('');
  
  // Keep raw string for royalty input to allow typing values like "2.5"
  const [royaltyInput, setRoyaltyInput] = useState<string>('');

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.image_preview_url) {
        URL.revokeObjectURL(formData.image_preview_url);
      }
      if (formData.banner_preview_url) {
        URL.revokeObjectURL(formData.banner_preview_url);
      }
    };
  }, []);

  // Maintain preview URLs when files exist but preview URLs are missing
  useEffect(() => {
    if (formData.image_file && !formData.image_preview_url) {
      const previewUrl = URL.createObjectURL(formData.image_file);
      setFormData(prev => ({ ...prev, image_preview_url: previewUrl }));
    }
    if (formData.banner_file && !formData.banner_preview_url) {
      const previewUrl = URL.createObjectURL(formData.banner_file);
      setFormData(prev => ({ ...prev, banner_preview_url: previewUrl }));
    }
  }, [formData.image_file, formData.banner_file, formData.image_preview_url, formData.banner_preview_url]);

  const handleSubmit = async () => {
    // Check authentication and wallet linking first
    if (!user) {
      toast.error('Please sign in to create collections', {
        action: {
          label: 'Sign In',
          onClick: () => navigate('/auth')
        }
      });
      return;
    }

    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if user has linked this wallet to their account
    const primaryWallet = await getPrimaryWallet();
    if (!primaryWallet || primaryWallet.wallet_address !== publicKey) {
      toast.error('Please link this wallet to your account first', {
        description: 'You need to link your connected wallet to your account to create collections',
        action: {
          label: 'Go to Profile',
          onClick: () => navigate('/profile')
        }
      });
      return;
    }

    // Circuit breaker check
    if (!checkAccess("create collections")) {
      return;
    }

    if (!publicKey) {
      try {
        await connect();
        toast.info('Please connect your wallet and try again');
        return;
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    if (!formData.image_file) {
      toast.error('Collection avatar is required');
      return;
    }

    // Security: Log large supply attempts
    if (formData.max_supply > 10000) {
      logSuspiciousActivity('large_supply_attempt', {
        max_supply: formData.max_supply,
        collection_name: formData.name
      });
    }

    // Enforce 1-hour buffer if end time is set
    if (formData.mint_end_at) {
      const end = new Date(formData.mint_end_at);
      const minEnd = new Date(Date.now() + 60 * 60 * 1000);
      if (end <= minEnd) {
        const msg = 'End time must be at least 1 hour in the future';
        setFormData({ ...formData, mint_end_at_error: msg });
        toast.error(msg);
        return;
      }
    }

    await guardedAction(async () => {
      setIsMinting(true);
      setMintingError(null);
      try {
        // Upload images first
        let imageUrl = '';
        let bannerUrl = '';
        
        if (formData.image_file) {
          const { supabase } = await import('@/integrations/supabase/client');
          const imageExt = formData.image_file.name.split('.').pop();
          const imagePath = `collection-images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${imageExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('collection-images')
            .upload(imagePath, formData.image_file);
          
          if (uploadError) throw new Error('Failed to upload collection image');
          
          const { data: { publicUrl } } = supabase.storage
            .from('collection-images')
            .getPublicUrl(imagePath);
          
          imageUrl = publicUrl;
        }
        
        if (formData.banner_file) {
          const { supabase } = await import('@/integrations/supabase/client');
          const bannerExt = formData.banner_file.name.split('.').pop();
          const bannerPath = `collection-images/${Date.now()}_banner_${Math.random().toString(36).substr(2, 9)}.${bannerExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('collection-images')
            .upload(bannerPath, formData.banner_file);
          
          if (uploadError) throw new Error('Failed to upload banner image');
          
          const { data: { publicUrl } } = supabase.storage
            .from('collection-images')
            .getPublicUrl(bannerPath);
          
          bannerUrl = publicUrl;
        }

        // Create collection in database first
        const result = await createCollection({
          ...formData,
          image_file: formData.image_file,
          banner_file: formData.banner_file,
          treasury_wallet: formData.treasury_wallet || publicKey,
        });

        if (result.success && result.collection) {
          let collectionMintAddress = null;
          let verified = false;
          let explorerUrl = '';
          
          if (mintNow) {
            // Mint the Collection NFT on-chain using Metaplex
            toast.success('Collection created! Now minting on-chain...');
            
            // Prepare metadata for on-chain mint
            const collectionMetadata: CollectionMetadata = {
              name: formData.name,
              symbol: formData.symbol || 'COLLECTION',
              description: formData.onchain_description || formData.site_description,
              image: imageUrl,
              sellerFeeBasisPoints: Math.round((formData.royalty_percentage || 0) * 100),
              creators: [{
                address: publicKey!,
                verified: true,
                share: 100,
              }],
              attributes: formData.attributes.map(attr => ({
                trait_type: attr.trait_type || '',
                value: attr.value || '',
              })),
            };
            
            // Upload metadata to our storage
            const metadataUri = await uploadMetadataToStorage(collectionMetadata, 'collection', formData.name);
            
            // Mint on-chain with Metaplex
            const mintResult = await metaplexService.mintCollection({
              metadata: { ...collectionMetadata, image: metadataUri },
              creatorWallet: publicKey!,
            });

            if (mintResult.success) {
              collectionMintAddress = mintResult.mintAddress;
              verified = true;
              explorerUrl = mintResult.explorerUrl || '';
              setCollectionMintResult(mintResult);
              
              // Update database with mint address
              const { supabase } = await import('@/integrations/supabase/client');
              await supabase
                .from('collections')
                .update({
                  collection_mint_address: collectionMintAddress,
                  verified: true,
                })
                .eq('id', result.collection.id);
              
              toast.success('Collection minted successfully on Solana Devnet! 🎉');
            } else {
              setMintingError(mintResult.error || 'Failed to mint collection on-chain');
              toast.error('Collection created but failed to mint on-chain', {
                description: mintResult.error,
              });
            }
          } else {
            toast.success('Collection created off-chain! You can mint it later.');
          }

          // Update collection with mint results
          result.collection.collection_mint_address = collectionMintAddress;
          result.collection.verified = verified;
          result.collection.explorer_url = explorerUrl;
          
          setStep3Collection(result.collection);
          setActiveStep(4);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        let errorMessage = 'Unexpected error occurred';
        
        if (error && typeof error === 'object') {
          if ('message' in error && error.message) {
            errorMessage = error.message;
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setMintingError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsMinting(false);
      }
    }, "create collection")();
  };

  const handleConnectWallet = async () => {
    try {
      setPendingMintAfterConnect(true);
      setHasShownWalletConnectedToast(false); // Reset so we can show toast after connection
      await connect();
    } catch (error) {
      setPendingMintAfterConnect(false);
      toast.error('Failed to connect wallet');
      throw error;
    }
  };

  const handleCreateAnother = () => {
    // Reset form and go back to step 1
    setFormData({
      name: '',
      symbol: '',
      site_description: '',
      onchain_description: '',
      image_file: null,
      banner_file: null,
      external_links: [],
      category: '',
      explicit_content: false,
      enable_primary_sales: true,
      mint_price: 0,
      supply_mode: 'fixed',
      max_supply: 1000,
      royalty_percentage: 0,
      treasury_wallet: '',
      whitelist_enabled: false,
      go_live_date: '',
      mint_end_at: '',
      locked_fields: [],
      attributes: [],
      image_preview_url: null,
      banner_preview_url: null,
    });
    setMintPriceInput('');
    setRoyaltyInput('');
    setStep3Collection(null);
    setCollectionMintResult(null);
    setActiveStep(1);
    toast.success('Ready to create another collection!');
  };

  return (
    <div ref={containerRef} className="w-full px-2 sm:px-4 lg:px-8">
      {activeStep <= TOTAL_STEPS && <StepIndicator />}
      
      {activeStep === 1 && (
        <CollectionBasicsStep
          formData={formData}
          setFormData={setFormData}
          mintPriceInput={mintPriceInput}
          setMintPriceInput={setMintPriceInput}
          onNext={() => setActiveStep(2)}
        />
      )}

      {activeStep === 2 && (
        <CollectionSettingsStep
          formData={formData}
          setFormData={setFormData}
          publicKey={publicKey || ''}
          royaltyInput={royaltyInput}
          setRoyaltyInput={setRoyaltyInput}
          onBack={() => setActiveStep(1)}
          onNext={() => setActiveStep(3)}
          onConnectWallet={async () => {
            try {
              await connect();
            } catch (error) {
              toast.error('Failed to connect wallet');
            }
          }}
        />
      )}

      {activeStep === 3 && (
        <CollectionReviewStep
          formData={formData}
          isMinting={isMinting}
          mintNow={mintNow}
          setMintNow={setMintNow}
          publicKey={publicKey}
          connecting={connecting}
          onBack={() => setActiveStep(2)}
          onSubmit={handleSubmit}
          onConnectWallet={handleConnectWallet}
        />
      )}

      {activeStep === 4 && (
        <CollectionSuccessStep
          collection={step3Collection}
          mintingError={mintingError}
          mintResult={collectionMintResult}
          onCreateAnother={handleCreateAnother}
        />
      )}
    </div>
  );
};
