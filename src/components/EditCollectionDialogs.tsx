import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditDialogProps {
  children: React.ReactNode;
  collectionId?: string;
}

interface EditMintPriceDialogProps extends EditDialogProps {
  currentPrice: number;
  onSave: (newPrice: number) => void;
}

export const EditMintPriceDialog = ({ children, currentPrice, collectionId, onSave }: EditMintPriceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!collectionId) {
      toast.error('Collection ID is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: collectionId,
          updates: { mint_price: price }
        }
      });

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update mint price');
        return;
      }

      onSave(price);
      toast.success(`Mint price updated to ${price} SOL`);
      setOpen(false);
    } catch (error) {
      console.error('Error updating mint price:', error);
      toast.error('Failed to update mint price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Mint Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="mint-price" className="required-field">Mint Price (SOL) *</Label>
            <Input
              id="mint-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore
            />
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EditTreasuryWalletDialogProps extends EditDialogProps {
  currentWallet: string;
  onSave: (newWallet: string) => void;
}

export const EditTreasuryWalletDialog = ({ children, currentWallet, collectionId, onSave }: EditTreasuryWalletDialogProps) => {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState(currentWallet);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!collectionId) {
      toast.error('Collection ID is required');
      return;
    }

    if (!wallet.trim()) {
      toast.error('Treasury wallet address is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: collectionId,
          updates: { treasury_wallet: wallet.trim() }
        }
      });

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update treasury wallet');
        return;
      }

      onSave(wallet.trim());
      toast.success('Treasury wallet updated successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error updating treasury wallet:', error);
      toast.error('Failed to update treasury wallet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Treasury Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="treasury-wallet" className="required-field">Treasury Wallet Address *</Label>
            <Input
              id="treasury-wallet"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter wallet address"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EditWhitelistDialogProps extends EditDialogProps {
  currentEnabled: boolean;
  onSave: (enabled: boolean) => void;
}

export const EditWhitelistDialog = ({ children, currentEnabled, collectionId, onSave }: EditWhitelistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(currentEnabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!collectionId) {
      toast.error('Collection ID is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: collectionId,
          updates: { whitelist_enabled: enabled }
        }
      });

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update whitelist setting');
        return;
      }

      onSave(enabled);
      toast.success(`Whitelist ${enabled ? 'enabled' : 'disabled'} successfully`);
      setOpen(false);
    } catch (error) {
      console.error('Error updating whitelist:', error);
      toast.error('Failed to update whitelist setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Whitelist Setting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="whitelist-enabled">Enable Whitelist</Label>
            <Switch
              id="whitelist-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EditDescriptionDialogProps extends EditDialogProps {
  currentDescription: string;
  onSave: (description: string) => void;
}

export const EditDescriptionDialog = ({ children, currentDescription, collectionId, onSave }: EditDescriptionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(currentDescription);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!collectionId) {
      toast.error('Collection ID is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: collectionId,
          updates: { onchain_description: description.trim() }
        }
      });

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update description');
        return;
      }

      onSave(description.trim());
      toast.success('Description updated successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit On-chain Description</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">On-chain Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Enter collection description..."
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore
            />
            <div className="text-xs text-muted-foreground mt-1">
              {description.length}/200 characters
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};