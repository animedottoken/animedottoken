import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gavel, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftName: string;
  nftImage: string;
  currency?: string;
  currentPrice?: number;
  onBidPlaced?: (amount: number) => void;
}

export function BidModal({
  isOpen,
  onClose,
  nftName,
  nftImage,
  currency = "SOL",
  currentPrice,
  onBidPlaced
}: BidModalProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amount = parseFloat(bidAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    if (currentPrice && amount <= currentPrice) {
      toast.error("Bid must be higher than current price");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would integrate with your actual bidding system
      toast.info(`Placing bid of ${amount} ${currency} for ${nftName}`);
      
      onBidPlaced?.(amount);
      setBidAmount("");
      onClose();
    } catch (error) {
      toast.error("Failed to place bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBidAmount("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Place a Bid
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <img
              src={nftImage}
              alt={nftName}
              className="w-12 h-12 rounded object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== "/placeholder.svg") {
                  img.src = "/placeholder.svg";
                }
              }}
            />
            <div>
              <h4 className="font-medium text-sm">{nftName}</h4>
              {currentPrice && (
                <p className="text-xs text-muted-foreground">
                  Current price: {currentPrice} {currency}
                </p>
              )}
            </div>
          </div>

          {/* Bid Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid ({currency})</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your bid will be placed on the blockchain and cannot be cancelled
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || !bidAmount}
            >
              {isSubmitting ? "Placing Bid..." : "Place Bid"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}