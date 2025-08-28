import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Mail, Chrome, Loader2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    const handleAuthCallback = async () => {
      const url = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for OAuth callback or magic link
      const hasAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error_description');
      
      if (hasAuthParams) {
        setCompleting(true);
        console.log('Handling auth callback with URL:', url);
        
        try {
          // Handle error in URL
          const errorDescription = urlParams.get('error_description');
          if (errorDescription) {
            throw new Error(decodeURIComponent(errorDescription));
          }
          
          // Exchange code/token for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          
          if (error) {
            console.error('Session exchange error:', error);
            throw error;
          }
          
          if (data.session) {
            console.log('Auth callback successful, session created');
            toast({
              title: "Welcome!",
              description: "You've been signed in successfully.",
            });
            
            // Clean URL and redirect
            window.history.replaceState({}, document.title, `/auth${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`);
            navigate(redirectTo);
            return;
          }
        } catch (error: any) {
          console.error('Auth callback failed:', error);
          toast({
            title: "Sign in failed",
            description: error.message || "Authentication failed. Please try again.",
            variant: "destructive",
          });
          
          // Clean URL but stay on auth page
          window.history.replaceState({}, document.title, `/auth${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`);
        } finally {
          setCompleting(false);
        }
      }
    };

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectTo);
        return;
      }
      
      // Handle auth callback if present
      await handleAuthCallback();
    };
    
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && !completing) {
        toast({
          title: "Welcome!",
          description: "You've been signed in successfully.",
        });
        navigate(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, completing]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data?.url) {
        window.location.href = data.url;
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
      const redirectUrl = `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`;
      
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
          description: "We've sent you a magic link to sign in. Click the link to continue.",
        });
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

  // Show completing state during auth callback
  if (completing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-center text-muted-foreground">Completing sign-in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2">Welcome to</CardTitle>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
            <span className="text-2xl font-bold">ANIME.TOKEN</span>
          </div>
          <CardDescription>
            Sign in to like NFTs, follow creators, and join the community
          </CardDescription>
          {redirectTo !== '/' && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              💡 After signing in, you'll be redirected back to where you were
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full"
              />
            </div>
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

          {/* Temporary bypass for testing */}
          <div className="mt-4 pt-4 border-t border-muted">
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              Skip Authentication (Testing Only)
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Temporary bypass while we fix auth issues
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our terms and privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}