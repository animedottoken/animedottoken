import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

export function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📬 Subscribing to newsletter:', email);
      
      const { data, error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: { email }
      });

      if (error) {
        console.error('Newsletter subscribe error:', error);
        toast.error('Failed to subscribe. Please try again.');
        return;
      }

      console.log('Newsletter subscribe response:', data);
      toast.success(data.message || 'Please check your email to confirm your subscription!');
      setEmail('');
      
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
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
        </form>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </CardContent>
    </Card>
  );
}