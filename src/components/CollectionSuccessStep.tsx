import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface Collection {
  id: string;
  name: string;
  verified?: boolean;
  collection_mint_address?: string;
}

interface CollectionSuccessStepProps {
  collection: Collection | null;
  mintingError: string | null;
  onCreateAnother: () => void;
}

export const CollectionSuccessStep: React.FC<CollectionSuccessStepProps> = ({
  collection,
  mintingError,
  onCreateAnother
}) => {
  const navigate = useNavigate();
  const { publicKey } = useSolanaWallet();
  const [isMintingOnChain, setIsMintingOnChain] = useState(false);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleMintOnChain = async () => {
    if (!publicKey || !collection) return;
    
    setIsMintingOnChain(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-collection', {
        body: {
          collectionId: collection.id,
          creatorAddress: publicKey
        }
      });

      if (mintError || !mintResult?.success) {
        console.error('Minting error:', mintError || mintResult);
        toast.error('Failed to mint collection on-chain');
      } else {
        toast.success('Collection minted successfully on-chain! 🎉');
        // Update collection state
        if (collection) {
          collection.collection_mint_address = mintResult.collectionMintAddress;
          collection.verified = true;
        }
      }
    } catch (error) {
      console.error('Unexpected minting error:', error);
      toast.error('Failed to mint collection on-chain');
    } finally {
      setIsMintingOnChain(false);
    }
  };

  const isOffChain = !collection?.collection_mint_address && !collection?.verified;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      {/* Left Column - Collection Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Collection Created Successfully!
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {isOffChain ? (
                <Badge variant="secondary">Off-chain</Badge>
              ) : (
                <Badge variant="default">On-chain</Badge>
              )}
            </div>
            {mintingError && (
              <div className="text-sm text-destructive mt-2">
                Minting Error: {mintingError}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Collection Name</div>
                <div className="font-semibold text-lg">{collection?.name}</div>
              </div>
              
              {collection?.collection_mint_address && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">Collection Mint Address</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyAddress(collection.collection_mint_address!)}
                      className="h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-xs break-all bg-background p-2 rounded border">
                    {collection.collection_mint_address}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - NFT Details & Minting Interface */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Next Step</CardTitle>
            <CardDescription>What would you like to do next?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isOffChain && (
                <Button 
                  onClick={handleMintOnChain}
                  disabled={isMintingOnChain}
                  className="w-full"
                  variant="default"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {isMintingOnChain ? 'Minting On-Chain...' : 'Mint On-Chain Now'}
                </Button>
              )}
              <Button 
                onClick={() => navigate(`/mint/nft?collection=${collection?.id}`)}
                className="w-full"
              >
                🎨 Mint your NFT from this collection
              </Button>
              <Button variant="outline" onClick={onCreateAnother} className="w-full">
                Create Another Collection
              </Button>
              <Button variant="secondary" onClick={handleGoToProfile} className="w-full">
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};