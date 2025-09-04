import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MailCheck, MailX, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNewsletterStatus } from '@/hooks/useNewsletterStatus';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function NewsletterManagement() {
  const { status, loading, error, unsubscribe, refetch } = useNewsletterStatus();
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleUnsubscribe = async () => {
    try {
      setUnsubscribing(true);
      const result = await unsubscribe();
      
      // Check if confirmation email was sent
      const emailSent = result && typeof result === 'object' && 'emailSent' in result && result.emailSent;
      
      toast({
        title: "Unsubscribed successfully",
        description: emailSent 
          ? "You've been unsubscribed from our newsletter. We sent a confirmation to your email."
          : "You've been unsubscribed from our newsletter.",
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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast({
        title: "Status refreshed",
        description: "Newsletter subscription status has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Error",
        description: "Failed to refresh status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><MailCheck className="h-3 w-3" />Subscribed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Mail className="h-3 w-3" />Pending Confirmation</Badge>;
      case 'unsubscribed':
        return <Badge variant="outline" className="flex items-center gap-1"><MailX className="h-3 w-3" />Unsubscribed</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Mail className="h-3 w-3" />Not Subscribed</Badge>;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'You are subscribed and will receive our newsletter updates.';
      case 'pending':
        return 'Please check your email and click the confirmation link to complete your subscription.';
      case 'unsubscribed':
        return 'You have unsubscribed from our newsletter.';
      default:
        return 'You are not currently subscribed to our newsletter.';
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </Button>
          
          <div className="pt-2 border-t">
            <NewsletterSubscribe />
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium">Email: {status.email}</p>
                  {getStatusBadge(status.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getStatusDescription(status.status)}
                </p>
                {status.status === 'confirmed' && status.subscribedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Subscribed on {new Date(status.subscribedAt).toLocaleDateString()}
                  </p>
                )}
                {status.status === 'unsubscribed' && status.unsubscribedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Unsubscribed on {new Date(status.unsubscribedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {status.isSubscribed && (
                <Button
                  onClick={handleUnsubscribe}
                  disabled={unsubscribing}
                  variant="outline"
                  size="sm"
                  className="flex-1"
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
              
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {(status.status === 'not_subscribed' || status.status === 'unsubscribed') && (
              <div className="pt-2 border-t">
                <NewsletterSubscribe />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load subscription status. You can still subscribe below.
              </AlertDescription>
            </Alert>
            <NewsletterSubscribe />
          </div>
        )}
      </CardContent>
    </Card>
  );
}