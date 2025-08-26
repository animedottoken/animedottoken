
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Crown, Rocket } from 'lucide-react';
import { useBoostedListings } from '@/hooks/useBoostedListings';
import { useToast } from '@/hooks/use-toast';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftId: string;
  nftName: string;
  nftImage: string;
  onBoostCreated?: () => void;
}

export const BoostModal = ({ isOpen, onClose, nftId, nftName, nftImage, onBoostCreated }: BoostModalProps) => {
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { getTopBids, createBoost } = useBoostedListings();
  const { toast } = useToast();
  const { publicKey, connect, connecting } = useSolanaWallet();

  const topBids = getTopBids(10);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'god': return <Crown className="h-4 w-4" />;
      case 'top': return <Rocket className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'god': return 'bg-primary/5 border-primary/20';
      case 'top': return 'bg-accent/5 border-accent/20';
      default: return 'bg-muted border-border';
    }
  };
  const handleSubmit = async () => {
    if (!publicKey) {
      await connect();
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Bid",
        description: "Please enter a valid bid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Integrate with Solana transaction to transfer $ANIME tokens
      // For now, we'll simulate with a dummy transaction signature
      const dummyTxSignature = `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await createBoost(nftId, amount, dummyTxSignature);
      
      if (result.success) {
        toast({
          title: "Boost Created!",
          description: `Successfully boosted "${nftName}" with ${amount} $ANIME tokens`,
        });
        onBoostCreated?.();
        onClose();
        setBidAmount('');
      } else {
        toast({
          title: "Boost Failed",
          description: result.error || "Failed to create boost",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Boost Your NFT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <img 
                  src={nftImage} 
                  alt={nftName}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/og-anime.jpg';
                  }}
                />
                <div>
                  <h3 className="font-semibold">{nftName}</h3>
                  <p className="text-sm text-muted-foreground">Get premium visibility for 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bid Input */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Your Bid Amount ($ANIME)</label>
            
            {/* Cost Summary Box */}
            {bidAmount && parseFloat(bidAmount) > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">You will pay:</span>
                  <span className="text-lg font-bold text-primary">
                    {parseFloat(bidAmount).toLocaleString()} $ANIME
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This amount will be deducted from your wallet
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount you want to spend"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min="1"
                step="1"
                className="text-lg"
              />
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || connecting || (!publicKey && !connecting) || (publicKey && (!bidAmount || parseFloat(bidAmount) < 1))}
                className="px-8"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : connecting ? (
                  'Connecting...'
                ) : !publicKey ? (
                  'Connect Wallet'
                ) : (
                  `Pay ${bidAmount || '0'} $ANIME`
                )}
              </Button>
            </div>
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
              <p className="text-sm font-medium text-primary">
                💡 Boost Cost: Minimum 1 $ANIME • Duration: 24 hours
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Higher bids get better placement in the boosted section
              </p>
            </div>
          </div>

          {/* Current Top Bids */}
          <div className="space-y-4">
            <h4 className="font-semibold">Current Top 10 Bids</h4>
            {topBids.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  No active boosts yet. Be the first!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {topBids.map((bid) => (
                  <Card key={bid.id} className={`${getTierStyles(bid.tier)} border rounded-xl`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[56px]">
                            <span className="font-semibold">#{bid.bid_rank}</span>
                            {getTierIcon(bid.tier)}
                          </div>
                          <img 
                            src={bid.nft_image_url} 
                            alt={bid.nft_name}
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/images/og-anime.jpg';
                            }}
                          />
                          <div>
                            <p className="font-medium text-sm">{bid.nft_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bid.bidder_wallet_masked}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold">{Number(bid.bid_amount).toLocaleString()} $ANIME</div>
                          <Badge variant="secondary" className="text-2xs uppercase tracking-wide mt-1">
                            {bid.tier}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Tier Info */}
          <Card>
            <CardContent className="p-4">
              <h5 className="font-medium mb-3">Boost Tiers</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">God Tier (Rank 1–3):</span>
                  <span className="text-muted-foreground">Premium placement with crown icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  <span className="font-medium">Top Tier (Rank 4–10):</span>
                  <span className="text-muted-foreground">High placement with rocket icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Boosted Tier (Rank 11+):</span>
                  <span className="text-muted-foreground">Visible in boosted section</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
