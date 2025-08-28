import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/auth')}>Sign In</span>
              <span className="mx-2">/</span>
              <span>Privacy Policy</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use the information we collect to provide, maintain, and improve our services and communicate with you.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through our platform.
              </p>
            </section>
            
            {/* Cross-navigation */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Related:</p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={() => navigate('/terms')}
              >
                Terms of Service →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}