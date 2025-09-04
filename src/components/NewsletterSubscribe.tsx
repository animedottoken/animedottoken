import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

export function NewsletterSubscribe() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmUrl, setConfirmUrl] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);

    try {
      console.log('📬 Subscribing to newsletter:', user.email);
      
      const { data, error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: {}
      });

      if (error) {
        console.error('Newsletter subscribe error:', error);
        toast.error('Failed to subscribe. Please try again.');
        return;
      }

      console.log('Newsletter subscribe response:', data);
      
      if (data?.emailSent === false && data?.confirmUrl) {
        // Email failed to send, show manual confirmation dialog
        setConfirmUrl(data.confirmUrl);
        setShowConfirmDialog(true);
        toast.warning(data.message || 'Email delivery failed. Please use the confirmation link.');
      } else {
        // Email sent successfully
        toast.success(data.message || 'Please check your email to confirm your subscription!');
      }
      
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyConfirmLink = async () => {
    try {
      await navigator.clipboard.writeText(confirmUrl);
      toast.success('Confirmation link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const openConfirmLink = () => {
    window.open(confirmUrl, '_blank');
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Stay Updated</CardTitle>
          <CardDescription>
            Subscribe to our newsletter for the latest NFT drops, marketplace updates, and exclusive content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Using your account email address
                </p>
              </div>
              <Button 
                onClick={handleSubmit}
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe to Newsletter'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in to subscribe to our newsletter with your account email.
              </p>
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full"
              >
                Sign in to Subscribe
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </CardContent>
      </Card>
      
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign in to Subscribe"
        description="Join our community to receive the latest NFT drops and marketplace updates."
        onSuccess={() => {
          setShowAuthModal(false);
          // Auto-subscribe after successful sign in
          setTimeout(() => handleSubmit(), 1000);
        }}
      />
      
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Subscription</DialogTitle>
            <DialogDescription>
              We couldn't send the confirmation email. Please use the link below to complete your newsletter subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  value={confirmUrl}
                  readOnly
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={copyConfirmLink} variant="outline" size="sm" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={openConfirmLink} size="sm" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}