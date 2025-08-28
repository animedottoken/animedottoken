import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Mail, Chrome, Loader2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

export default function AuthModal({ 
  open, 
  onOpenChange, 
  title = "Welcome to ANIME.TOKEN",
  description = "Sign in to like NFTs, follow creators, and join the community",
  onSuccess 
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${window.location.origin}/auth?redirect=${encodeURIComponent(currentPath)}`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data?.url) {
        if (window.top) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${window.location.origin}/auth?redirect=${encodeURIComponent(currentPath)}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a magic link to sign in. Click the link to continue (it will open in the app preview).",
        });
        onOpenChange(false);
        setEmail('');
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center mb-2">{title.split(' ')[0]} {title.split(' ')[1]}</DialogTitle>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-6 w-6" />
            <span className="text-lg font-bold">ANIME.TOKEN</span>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full"
            size="lg"
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
            />
            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full"
              variant="outline"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Magic Link
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No password—use the link we email you to sign in
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}