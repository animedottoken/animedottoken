import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react';

export default function Support() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromAuth = (location.state as any)?.from === '/auth' || new URLSearchParams(location.search).get('from') === 'auth';
  const goBack = () => {
    if (fromAuth) navigate('/auth');
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={goBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/auth')}>Sign In</span>
              <span className="mx-2">/</span>
              <span>Contact & Support</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <HelpCircle className="h-8 w-8" />
              Contact & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                How to Get Help
              </h2>
              <p className="text-muted-foreground mb-4">
                We're here to help! If you're experiencing issues or have questions about ANIME.TOKEN, here are the best ways to reach us:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Community Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Join our Discord community for real-time help and discussions with other users.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Join Discord Community
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send us detailed questions or bug reports via email.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Common Issues & Solutions</h2>
              <div className="space-y-3">
                <details className="border rounded-lg">
                  <summary className="p-3 cursor-pointer hover:bg-muted/50">
                    <strong>Wallet Connection Issues</strong>
                  </summary>
                  <div className="p-3 pt-0 text-muted-foreground">
                    <p>If you're having trouble connecting your wallet:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Make sure your wallet extension is installed and unlocked</li>
                      <li>Try refreshing the page</li>
                      <li>Check if you're on the correct network (Solana)</li>
                      <li>Clear your browser cache and cookies</li>
                    </ul>
                  </div>
                </details>
                
                <details className="border rounded-lg">
                  <summary className="p-3 cursor-pointer hover:bg-muted/50">
                    <strong>NFT Minting Problems</strong>
                  </summary>
                  <div className="p-3 pt-0 text-muted-foreground">
                    <p>If your NFT mint failed or is stuck:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Check your wallet for sufficient SOL balance for transaction fees</li>
                      <li>Wait for network congestion to clear</li>
                      <li>Try minting again after a few minutes</li>
                      <li>Contact support if the issue persists after 24 hours</li>
                    </ul>
                  </div>
                </details>
                
                <details className="border rounded-lg">
                  <summary className="p-3 cursor-pointer hover:bg-muted/50">
                    <strong>Profile or Creator Page Not Loading</strong>
                  </summary>
                  <div className="p-3 pt-0 text-muted-foreground">
                    <p>If profiles aren't displaying correctly:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Verify the wallet address is correct</li>
                      <li>Try refreshing the page</li>
                      <li>The profile may need time to sync if it's newly created</li>
                      <li>Report persistent issues to our support team</li>
                    </ul>
                  </div>
                </details>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Report a Bug</h2>
              <p className="text-muted-foreground mb-4">
                Found a bug? Help us improve by providing detailed information:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Include in your report:</h4>
                <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
                  <li>What you were trying to do</li>
                  <li>What happened instead</li>
                  <li>Your browser and device type</li>
                  <li>Screenshots if applicable</li>
                  <li>Any error messages you saw</li>
                </ul>
              </div>
            </section>
            
            {/* Cross-navigation */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Related:</p>
              <div className="flex gap-4">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate('/terms')}
                >
                  Terms of Service →
                </Button>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => navigate('/privacy')}
                >
                  Privacy Policy →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={goBack}>
            ← Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}