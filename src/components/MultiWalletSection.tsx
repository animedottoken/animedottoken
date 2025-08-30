import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LinkWalletDialog } from '@/components/LinkWalletDialog';
import { Wallet, Plus, Trash2, AlertTriangle, Crown, Link, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserWallets, UserWallet } from '@/hooks/useUserWallets';
import { truncateAddress } from '@/utils/addressUtils';
import { toast } from 'sonner';

export const MultiWalletSection = () => {
  const [linkWalletOpen, setLinkWalletOpen] = useState(false);
  const [unlinkWalletId, setUnlinkWalletId] = useState<string | null>(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('multiWalletSectionExpanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const { wallets, summary, loading, error, unlinkWallet, cleanupPrimaryWallets } = useUserWallets();

  useEffect(() => {
    localStorage.setItem('multiWalletSectionExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const handleUnlinkWallet = async () => {
    if (!unlinkWalletId) return;
    
    const success = await unlinkWallet(unlinkWalletId);
    if (success) {
      setUnlinkWalletId(null);
    }
  };

  const handleCleanupPrimary = async () => {
    const success = await cleanupPrimaryWallets();
    if (success) {
      setShowCleanupDialog(false);
    }
  };

  const primaryWallet = wallets.find(w => w.wallet_type === 'primary');
  const secondaryWallets = wallets.filter(w => w.wallet_type === 'secondary');

  const getWalletIcon = (walletType: 'primary' | 'secondary') => {
    return walletType === 'primary' ? Crown : Link;
  };

  const getWalletBadgeVariant = (walletType: 'primary' | 'secondary') => {
    return walletType === 'primary' ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Multi-Wallet Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Multi-Wallet Profile
              </CardTitle>
              <CardDescription>
                Manage your primary identity wallet and secondary wallets. Your profile displays NFTs from all linked wallets.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total Wallets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.primary}</div>
              <div className="text-xs text-muted-foreground">Primary</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.secondary}</div>
              <div className="text-xs text-muted-foreground">Secondary</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.remaining_secondary_slots}</div>
              <div className="text-xs text-muted-foreground">Slots Left</div>
            </div>
          </div>

          {/* Primary Wallet */}
          {primaryWallet && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                Primary Wallet (Identity)
              </h4>
              <div className="p-3 bg-muted rounded-lg border-l-4 border-l-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-mono text-sm">
                        {truncateAddress(primaryWallet.wallet_address)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Linked {new Date(primaryWallet.linked_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getWalletBadgeVariant(primaryWallet.wallet_type)} className="text-xs">
                      Primary
                    </Badge>
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCleanupDialog(true)}
                      className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Primary Wallet Warning */}
          {!primaryWallet && (
            <Alert className="border-warning/20 bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No primary wallet linked. You won't be able to verify ownership of NFTs or collections without a primary identity wallet.
                <div className="mt-3 space-y-2">
                  <Button
                    onClick={() => setLinkWalletOpen(true)}
                    variant="default" 
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Link Primary Wallet Now
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCleanupDialog(true)}
                    className="w-full sm:w-auto ml-0 sm:ml-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Reset Primary Wallet
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Secondary Wallets */}
          {secondaryWallets.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Link className="h-4 w-4 text-blue-600" />
                Secondary Wallets ({secondaryWallets.length}/10)
              </h4>
              <div className="space-y-2">
                {secondaryWallets.map((wallet) => {
                  const WalletIcon = getWalletIcon(wallet.wallet_type);
                  return (
                    <div key={wallet.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <WalletIcon className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-mono text-sm">
                              {truncateAddress(wallet.wallet_address)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Linked {new Date(wallet.linked_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getWalletBadgeVariant(wallet.wallet_type)} className="text-xs">
                            Secondary
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUnlinkWalletId(wallet.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Secondary Wallet Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setLinkWalletOpen(true)}
              disabled={summary.remaining_secondary_slots === 0}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {!primaryWallet ? 'Link Primary Wallet' : 'Add Secondary Wallet'}
            </Button>
          </div>

          {/* Info */}
          <Alert className="bg-blue-50 border-blue-200 text-blue-700">
            <Wallet className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>How it works:</strong> Your primary wallet is your main identity. Secondary wallets let you view NFTs from multiple wallets in one unified profile. For transactions, you'll need to connect the specific wallet that owns the NFT.
            </AlertDescription>
          </Alert>
          </CardContent>
        )}
      </Card>

      {/* Link Wallet Dialog */}
      <LinkWalletDialog
        open={linkWalletOpen}
        onOpenChange={setLinkWalletOpen}
        walletType={!primaryWallet ? 'primary' : 'secondary'}
      />

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        open={!!unlinkWalletId}
        onOpenChange={(open) => !open && setUnlinkWalletId(null)}
        onConfirm={handleUnlinkWallet}
        title="Unlink Wallet"
        description="Are you sure you want to unlink this secondary wallet? You can re-link it later if needed."
        confirmText="Unlink Wallet"
        variant="destructive"
      />

      {/* Cleanup Primary Wallets Dialog */}
        <ConfirmDialog
          open={showCleanupDialog}
          onOpenChange={setShowCleanupDialog}
          title="Reset Primary Wallet"
          description="This removes your primary wallet record (if any) so you can start fresh. You can then link a new primary wallet. This action cannot be undone."
          confirmText="Reset"
          variant="destructive"
          onConfirm={handleCleanupPrimary}
        />
    </>
  );
};