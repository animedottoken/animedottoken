import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export default function Terms() {
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
              <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/')}>Home</span>
              <span className="mx-2">/</span>
              <span>Terms of Service</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using ANIME.TOKEN, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
              <p className="text-muted-foreground">
                Permission is granted to temporarily download one copy of ANIME.TOKEN per device for personal, non-commercial transitory viewing only.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Conduct</h2>
              <p className="text-muted-foreground">
                Users agree to use the platform responsibly and not to engage in any activity that could harm the service or other users.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us through our platform.
              </p>
            </section>
            
            {/* Cross-navigation */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Related:</p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}