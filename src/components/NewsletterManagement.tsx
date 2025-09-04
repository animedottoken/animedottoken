import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MailCheck, MailX, Loader2 } from 'lucide-react';
import { useNewsletterStatus } from '@/hooks/useNewsletterStatus';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';
import { useToast } from '@/hooks/use-toast';

export function NewsletterManagement() {
  const { status, loading, unsubscribe } = useNewsletterStatus();
  const [unsubscribing, setUnsubscribing] = useState(false);
  const { toast } = useToast();

  const handleUnsubscribe = async () => {
    try {
      setUnsubscribing(true);
      await unsubscribe();
      toast({
        title: "Unsubscribed successfully",
        description: "You've been unsubscribed from our newsletter.",
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unsubscribe",
        variant: "destructive",
      });
    } finally {
      setUnsubscribing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="flex items-center gap-1"><MailCheck className="h-3 w-3" />Subscribed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Mail className="h-3 w-3" />Pending</Badge>;
      case 'unsubscribed':
        return <Badge variant="outline" className="flex items-center gap-1"><MailX className="h-3 w-3" />Unsubscribed</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Mail className="h-3 w-3" />Not Subscribed</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading subscription status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Newsletter Subscription
        </CardTitle>
        <CardDescription>
          Stay updated with our latest news and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email: {status.email}</p>
                <p className="text-xs text-muted-foreground">
                  {status.status === 'confirmed' && status.subscribedAt && (
                    `Subscribed on ${new Date(status.subscribedAt).toLocaleDateString()}`
                  )}
                  {status.status === 'unsubscribed' && status.unsubscribedAt && (
                    `Unsubscribed on ${new Date(status.unsubscribedAt).toLocaleDateString()}`
                  )}
                  {status.status === 'pending' && 'Check your email to confirm subscription'}
                </p>
              </div>
              {getStatusBadge(status.status)}
            </div>
            
            {status.isSubscribed && (
              <Button
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {unsubscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  <>
                    <MailX className="h-4 w-4 mr-2" />
                    Unsubscribe
                  </>
                )}
              </Button>
            )}
            
            {(status.status === 'not_subscribed' || status.status === 'unsubscribed') && (
              <div className="pt-2 border-t">
                <NewsletterSubscribe />
              </div>
            )}
          </div>
        ) : (
          <NewsletterSubscribe />
        )}
      </CardContent>
    </Card>
  );
}