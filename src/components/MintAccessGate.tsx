import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusDots } from '@/components/StatusDots';
import { SolanaWalletButton } from '@/components/SolanaWalletButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MintAccessGateProps {
  children: React.ReactNode;
}

export const MintAccessGate = ({ children }: MintAccessGateProps) => {
  const { user, loading } = useAuth();
  const { connected, connecting } = useSolanaWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!user;
  const isWalletConnected = connected && !connecting;
  const canProceed = isAuthenticated && isWalletConnected;

  // Show loading skeleton while auth is loading
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  // If all requirements are met, render the protected content
  if (canProceed) {
    return <>{children}</>;
  }

  // Build redirect URL for auth
  const redirectUrl = encodeURIComponent(location.pathname + location.search + location.hash);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-accent/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Access Required
          </CardTitle>
          <p className="text-muted-foreground">
            To start minting, please complete the following requirements:
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status indicators */}
          <div className="flex items-center justify-center gap-4 p-4 bg-accent/5 rounded-lg">
            <StatusDots 
              isLoggedIn={isAuthenticated}
              isWalletConnected={isWalletConnected}
              size="md"
              className="gap-2"
            />
            <span className="text-sm text-muted-foreground">
              {isAuthenticated && isWalletConnected ? 'Ready to mint!' : 'Complete requirements to continue'}
            </span>
          </div>

          {/* Sign in section */}
          {!isAuthenticated && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Sign In Required
              </h3>
              <p className="text-sm text-muted-foreground">
                You need to be signed in to create NFTs and collections.
              </p>
              <Button 
                onClick={() => navigate(`/auth?redirect=${redirectUrl}`)}
                className="w-full"
                variant="default"
              >
                Sign In to Continue
              </Button>
            </div>
          )}

          {/* Wallet connection section */}
          {isAuthenticated && !isWalletConnected && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Wallet Connection Required
              </h3>
              <p className="text-sm text-muted-foreground">
                Connect your Solana wallet to mint NFTs on the blockchain.
              </p>
              <SolanaWalletButton />
            </div>
          )}

          {/* Both missing */}
          {!isAuthenticated && !isWalletConnected && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Wallet Connection Required
              </h3>
              <p className="text-sm text-muted-foreground">
                After signing in, you'll also need to connect your Solana wallet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};