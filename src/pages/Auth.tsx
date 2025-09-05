import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Mail, Chrome, Loader2, Info, ArrowLeft } from 'lucide-react';
import { AuthEmailInfoContent } from '@/components/AuthEmailInfoContent';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/';

  useEffect(() => {
    const handleAuthCallback = async () => {
      const url = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hashFragment = window.location.hash;
      
      // Check for OAuth callback (query params) or magic link (hash fragment)
      const hasOAuthParams = urlParams.has('code') || urlParams.has('error_description');
      const hasMagicLinkTokens = hashFragment.includes('access_token') || hashFragment.includes('refresh_token') || hashFragment.includes('error');
      
      if (hasOAuthParams || hasMagicLinkTokens) {
        setCompleting(true);
        console.log('Handling auth callback with URL:', url);
        
        try {
          // Handle OAuth callback errors in query params
          if (hasOAuthParams) {
            const errorDescription = urlParams.get('error_description');
            const error = urlParams.get('error');
            
            if (errorDescription || error) {
              console.log('OAuth callback error detected:', { error, errorDescription });
              const errorMsg = errorDescription ? decodeURIComponent(errorDescription) : error;
              throw new Error(errorMsg || 'Authentication failed');
            }
          }
          
          // Handle Magic Link tokens in hash fragment
          if (hasMagicLinkTokens) {
            console.log('Processing magic link tokens from hash...');
            
            // Parse hash fragment for tokens
            const hashParams = new URLSearchParams(hashFragment.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const tokenType = hashParams.get('token_type');
            const expiresIn = hashParams.get('expires_in');
            
            if (accessToken && refreshToken) {
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error('Magic link session error:', sessionError);
                throw sessionError;
              }
              
              if (data.session) {
                console.log('Magic link successful, session created');
                toast({
                  title: "Welcome!",
                  description: "You've been signed in successfully.",
                });
                
                // Clean URL and redirect to target
                window.history.replaceState({}, document.title, '/auth');
                navigate(safeRedirect, { replace: true });
                return;
              }
            } else {
              // Check for error in hash
              const errorDescription = hashParams.get('error_description');
              const error = hashParams.get('error');
              if (errorDescription || error) {
                throw new Error(errorDescription || error || 'Magic link authentication failed');
              }
            }
          }
          
          // Handle OAuth code exchange for query params
          if (hasOAuthParams && urlParams.has('code')) {
            console.log('Attempting OAuth session exchange...');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
            
            if (exchangeError) {
              console.error('OAuth session exchange error:', exchangeError);
              throw exchangeError;
            }
            
            if (data.session) {
              console.log('OAuth callback successful, session created');
              toast({
                title: "Welcome!",
                description: "You've been signed in successfully.",
              });
              
              // Clean URL and redirect to target
              window.history.replaceState({}, document.title, '/auth');
              navigate(safeRedirect, { replace: true });
              return;
            }
          }
        } catch (error: any) {
          console.error('Auth callback failed:', error);
          
          // Handle specific error types for better UX
          let title = "Sign in failed";
          let description = error.message || "Authentication failed. Please try again.";
          
          if (error.message?.includes('One-time token not found') || 
              error.message?.includes('invalid_request') ||
              error.message?.includes('token_not_found') ||
              error.message?.includes('Token has expired')) {
            title = "Invalid or expired link";
            description = "This magic link has expired or already been used. Please request a new one.";
          }
          
          toast({
            title,
            description,
            variant: "destructive",
          });
          
          // Focus email input for easy retry if it's a token error
          if (error.message?.includes('token') || error.message?.includes('expired')) {
            setTimeout(() => {
              const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
              if (emailInput) emailInput.focus();
            }, 100);
          }
          
          // Clean URL but stay on auth page
          window.history.replaceState({}, document.title, '/auth');
        } finally {
          setCompleting(false);
        }
      }
    };

    // Check if user is already logged in
    const checkUser = async () => {
      console.log('Checking user session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (session) {
        console.log('User already logged in, redirecting to', safeRedirect);
        navigate(safeRedirect, { replace: true });
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
        navigate(safeRedirect, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, safeRedirect, completing]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { getOAuthRedirectUrl } = await import('@/lib/authRedirect');
      const redirectUrl = getOAuthRedirectUrl(safeRedirect);
      
      console.log('Google OAuth redirect URL:', redirectUrl);
      
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
      const { getAuthRedirectUrl } = await import('@/lib/authRedirect');
      const redirectUrl = getAuthRedirectUrl(safeRedirect);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        // Check for rate limit error and parse wait time
        if (error.message.includes('rate_limit') || error.message.includes('429')) {
          // Try to parse the exact seconds from the error message
          const waitMatch = error.message.match(/(\d+)\s*seconds?/);
          const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 60;
          
          setCooldownSeconds(waitSeconds);
          toast({
            title: "Too many requests",
            description: `Please wait ${waitSeconds} seconds before trying again. You can use Google OAuth as an alternative.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
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
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-background to-muted p-4 pt-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(safeRedirect)}
              className="p-2 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
          </div>
          <CardTitle className="text-2xl font-bold mb-2">Welcome to</CardTitle>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
            <span className="text-2xl font-bold">ANIME.TOKEN</span>
          </div>
          <CardDescription>
            Sign in to like NFTs, follow creators, and join the community
          </CardDescription>
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
                className="w-full h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || googleLoading || cooldownSeconds > 0}
              className="w-full"
              variant="outline"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Send Magic Link'}
            </Button>
            {cooldownSeconds > 0 && (
              <p className="text-xs text-destructive text-center">
                Rate limited. Please wait {cooldownSeconds} seconds before trying again.
              </p>
            )}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <span>No password—we'll email you a sign-in link</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center rounded-full w-4 h-4 bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    aria-label="Email delivery information"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <AuthEmailInfoContent />
                </DialogContent>
              </Dialog>
            </div>
          </form>
          
          <div className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Need help? Visit our{" "}
              <Link 
                to="/support"
                state={{ from: '/auth' }}
                className="text-primary underline hover:no-underline"
              >
                Contact & Support
              </Link>{" "}
              section
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our <a href="/terms" className="underline hover:text-foreground">Terms</a> and <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}