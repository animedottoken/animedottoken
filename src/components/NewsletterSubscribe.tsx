import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

export function NewsletterSubscribe() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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
      toast.success(data.message || 'Please check your email to confirm your subscription!');
      
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
    </Card>
  );
}