import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto py-8">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}