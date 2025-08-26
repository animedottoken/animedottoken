import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCollections } from '@/hooks/useCollections';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { CollectionBasicsStep } from './CollectionBasicsStep';
import { CollectionSettingsStep } from './CollectionSettingsStep';
import { CollectionReviewStep } from './CollectionReviewStep';
import { CollectionSuccessStep } from './CollectionSuccessStep';
import type { Property } from '@/components/PropertiesEditor';

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
  const { createCollection } = useCollections({ suppressErrors: true });
  const { publicKey, connect, connecting } = useSolanaWallet();
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!publicKey) {
      await connect();
      return;
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

    setIsMinting(true);
    setMintingError(null);
    try {
      // Create collection
      const result = await createCollection({
        ...formData,
        name: formData.name,
        symbol: formData.symbol,
        site_description: formData.site_description,
        onchain_description: formData.onchain_description,
        image_file: formData.image_file,
        banner_file: formData.banner_file,
        external_links: formData.external_links,
        category: formData.category,
        explicit_content: formData.explicit_content,
        enable_primary_sales: formData.enable_primary_sales,
        mint_price: formData.mint_price,
        max_supply: formData.max_supply,
        royalty_percentage: formData.royalty_percentage,
        treasury_wallet: formData.treasury_wallet || publicKey,
        whitelist_enabled: formData.whitelist_enabled,
        go_live_date: formData.go_live_date,
        mint_end_at: formData.mint_end_at,
        supply_mode: formData.supply_mode,
        locked_fields: formData.locked_fields,
        attributes: formData.attributes,
      });

      if (result.success && result.collection) {
        if (mintNow) {
          // Mint the Collection NFT on-chain
          toast.success('Collection created! Now minting on-chain...');
          
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-collection', {
            body: {
              collectionId: result.collection.id,
              creatorAddress: publicKey
            }
          });

          if (mintError || !mintResult?.success) {
            console.error('Minting error:', mintError || mintResult);
            setMintingError(mintError?.message || mintResult?.error || 'Failed to mint collection');
            toast.error('Collection created but failed to mint on-chain');
          } else {
            toast.success('Collection minted successfully on-chain! 🎉');
            result.collection.collection_mint_address = mintResult.collectionMintAddress;
            result.collection.verified = true;
          }
        } else {
          toast.success('Collection created off-chain! You can mint it later.');
        }

        setStep3Collection(result.collection);
        setActiveStep(4);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      let errorMessage = 'Unexpected error occurred';
      
      // Surface exact Edge Function errors
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = error.message;
        } else if ('error' in error && error.error) {
          errorMessage = error.error;
        } else if ('details' in error && error.details) {
          errorMessage = error.details;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMintingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMinting(false);
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
    setStep3Collection(null);
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
          onBack={() => setActiveStep(1)}
          onNext={() => setActiveStep(3)}
        />
      )}

      {activeStep === 3 && (
        <CollectionReviewStep
          formData={formData}
          isMinting={isMinting}
          mintNow={mintNow}
          setMintNow={setMintNow}
          onBack={() => setActiveStep(2)}
          onSubmit={handleSubmit}
        />
      )}

      {activeStep === 4 && (
        <CollectionSuccessStep
          collection={step3Collection}
          mintingError={mintingError}
          onCreateAnother={handleCreateAnother}
        />
      )}
    </div>
  );
};
