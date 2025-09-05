import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bug, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mail,
  Server,
  Key,
  Globe,
  Copy,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { NewsletterConfigGuide } from '@/components/NewsletterConfigGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DebugResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export function NewsletterDebugPanel() {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const { user } = useAuth();

  const addDebugResult = (result: DebugResult) => {
    setDebugResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    if (!user) {
      toast.error('Please sign in to run diagnostics');
      return;
    }

    setIsDebugging(true);
    setDebugResults([]);

    try {
      // Step 1: Test newsletter subscription function
      addDebugResult({
        step: 'Authentication',
        status: 'info',
        message: `Testing with user: ${user.email}`,
        details: { userId: user.id, email: user.email }
      });

      // Step 2: Test newsletter subscription function
      addDebugResult({
        step: 'Newsletter Function',
        status: 'info',
        message: 'Calling newsletter-subscribe function...'
      });

      const { data, error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: {}
      });

      if (error) {
        addDebugResult({
          step: 'Newsletter Function',
          status: 'error',
          message: 'Function call failed',
          details: error
        });
      } else {
        addDebugResult({
          step: 'Newsletter Function',
          status: 'success',
          message: 'Function call successful',
          details: data
        });

        // Check email delivery status
        if (data.emailSent === false) {
          addDebugResult({
            step: 'Email Delivery',
            status: 'warning',
            message: 'Email delivery failed - likely configuration issue',
            details: {
              confirmUrl: data.confirmUrl,
              suggestion: 'Check RESEND_FROM_EMAIL and RESEND_API_KEY secrets'
            }
          });
        } else if (data.emailSent === true) {
          addDebugResult({
            step: 'Email Delivery',
            status: 'success',
            message: 'Email sent successfully'
          });
        }
      }

      // Step 3: Test newsletter status function
      addDebugResult({
        step: 'Status Check',
        status: 'info',
        message: 'Testing newsletter-status function...'
      });

      const { data: statusData, error: statusError } = await supabase.functions.invoke('newsletter-status', {
        body: {}
      });

      if (statusError) {
        addDebugResult({
          step: 'Status Check',
          status: 'error',
          message: 'Status check failed',
          details: statusError
        });
      } else {
        addDebugResult({
          step: 'Status Check',
          status: 'success',
          message: 'Status check successful',
          details: statusData
        });
      }

    } catch (error) {
      addDebugResult({
        step: 'General Error',
        status: 'error',
        message: 'Diagnostic failed',
        details: error
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const getStatusIcon = (status: DebugResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const copyDetails = (details: any) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    toast.success('Details copied to clipboard');
  };

  return (
    <Tabs defaultValue="diagnostics" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="diagnostics">Run Diagnostics</TabsTrigger>
        <TabsTrigger value="guide">Configuration Guide</TabsTrigger>
      </TabsList>
      
      <TabsContent value="diagnostics" className="space-y-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Newsletter Debug Panel
            </CardTitle>
            <CardDescription>
              Diagnose newsletter subscription and email delivery issues. This will help identify configuration problems.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Common Issues:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>RESEND_FROM_EMAIL</strong> not set to verified sender address</li>
                  <li>• <strong>RESEND_API_KEY</strong> invalid or missing</li>
                  <li>• Domain not verified in Resend dashboard</li>
                  <li>• Function logs show detailed error messages</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={runDiagnostics}
                disabled={isDebugging || !user}
                className="flex-1"
              >
                {isDebugging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4 mr-2" />
                    Run Newsletter Diagnostics
                  </>
                )}
              </Button>
            </div>

            {!user && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please sign in to run newsletter diagnostics.
                </AlertDescription>
              </Alert>
            )}

            {debugResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Diagnostic Results:</h4>
                {debugResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium text-sm">{result.step}</span>
                        <Badge variant={
                          result.status === 'success' ? 'default' :
                          result.status === 'error' ? 'destructive' :
                          result.status === 'warning' ? 'secondary' : 'outline'
                        }>
                          {result.status}
                        </Badge>
                      </div>
                      {result.details && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyDetails(result.details)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Show details
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Alert>
              <Server className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong> Check the edge function logs in Supabase for detailed error messages.
                <a 
                  href="https://supabase.com/dashboard/project/eztzddykjnmnpoeyfqcg/functions/newsletter-subscribe/logs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary hover:underline"
                >
                  View Newsletter Function Logs →
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="guide">
        <NewsletterConfigGuide />
      </TabsContent>
    </Tabs>
  );
}