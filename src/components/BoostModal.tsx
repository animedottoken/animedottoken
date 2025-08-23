
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Crown, Rocket } from 'lucide-react';
import { useBoostedListings } from '@/hooks/useBoostedListings';
import { useToast } from '@/hooks/use-toast';

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

  const topBids = getTopBids(10);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'god': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'top': return <Rocket className="h-4 w-4 text-gray-400" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'god': return 'border-yellow-500 bg-yellow-50';
      case 'top': return 'border-gray-400 bg-gray-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const handleSubmit = async () => {
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
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">You will pay:</span>
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
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
                disabled={submitting || !bidAmount || parseFloat(bidAmount) < 1}
                className="px-8"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Pay ${bidAmount || '0'} $ANIME`
                )}
              </Button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                💡 Boost Cost: Minimum 1 $ANIME • Duration: 24 hours
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
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
                {topBids.map((bid, index) => (
                  <Card key={bid.id} className={`${getTierColor(bid.tier)}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-lg">#{bid.bid_rank}</span>
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
                              {bid.bidder_wallet.slice(0, 4)}...{bid.bidder_wallet.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{bid.bid_amount} $ANIME</p>
                          <Badge variant="outline" className="text-xs">
                            {bid.tier.toUpperCase()}
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
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">God Tier (Rank 1-3):</span>
                  <span className="text-muted-foreground">Gold border, crown icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Top Tier (Rank 4-10):</span>
                  <span className="text-muted-foreground">Silver border, rocket icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Boosted Tier (Rank 11+):</span>
                  <span className="text-muted-foreground">Blue border, boosted label</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
