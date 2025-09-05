import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Key,
  Mail,
  Globe,
  Settings
} from 'lucide-react';

export function NewsletterConfigGuide() {
  const requirements = [
    {
      title: 'Resend Account Setup',
      items: [
        'Create account at resend.com',
        'Verify your sending domain (animedottoken.com)',
        'Generate API key with send permissions'
      ],
      icon: <Globe className="h-4 w-4" />,
      link: 'https://resend.com/domains'
    },
    {
      title: 'Supabase Secrets Configuration',
      items: [
        'RESEND_API_KEY: Your Resend API key',
        'RESEND_FROM_EMAIL: "ANIME.TOKEN Newsletter <newsletter@animedottoken.com>"',
        'RESEND_NEWSLETTER_AUDIENCE_ID: Your Resend audience ID (optional)'
      ],
      icon: <Key className="h-4 w-4" />,
      link: 'https://supabase.com/dashboard/project/eztzddykjnmnpoeyfqcg/settings/functions'
    },
    {
      title: 'Domain Verification',
      items: [
        'Add DNS records for animedottoken.com in Resend',
        'Wait for DNS propagation (up to 24 hours)',
        'Verify domain status shows "Verified" in Resend'
      ],
      icon: <Mail className="h-4 w-4" />,
      link: 'https://resend.com/domains'
    }
  ];

  const commonIssues = [
    {
      issue: 'Email sending fails',
      causes: [
        'Domain not verified in Resend',
        'RESEND_FROM_EMAIL doesn\'t match verified domain',
        'Invalid or expired API key'
      ],
      solution: 'Check domain verification status and ensure from email matches verified domain'
    },
    {
      issue: 'Function authentication errors',
      causes: [
        'User not signed in',
        'Invalid JWT token',
        'Supabase client configuration issue'
      ],
      solution: 'Ensure user is authenticated before calling newsletter functions'
    },
    {
      issue: 'Database connection errors',
      causes: [
        'Missing SUPABASE_SERVICE_ROLE_KEY',
        'Incorrect Supabase project configuration',
        'Network connectivity issues'
      ],
      solution: 'Verify all Supabase environment variables are correctly set'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Newsletter Configuration Guide
          </CardTitle>
          <CardDescription>
            Step-by-step setup guide for newsletter email delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requirements.map((req, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {req.icon}
                  <h4 className="font-medium">{req.title}</h4>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={req.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Configure
                  </a>
                </Button>
              </div>
              <ul className="space-y-2 ml-6">
                {req.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Common Issues & Solutions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {commonIssues.map((issue, index) => (
            <Alert key={index}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{issue.issue}</div>
                  <div className="text-sm">
                    <strong>Common causes:</strong>
                    <ul className="mt-1 space-y-1 ml-4">
                      {issue.causes.map((cause, causeIndex) => (
                        <li key={causeIndex} className="list-disc text-muted-foreground">{cause}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-sm">
                    <strong>Solution:</strong> {issue.solution}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Expected Configuration:</strong>
          <div className="mt-2 space-y-1 text-sm font-mono">
            <div>RESEND_FROM_EMAIL = "ANIME.TOKEN Newsletter &lt;newsletter@animedottoken.com&gt;"</div>
            <div>RESEND_API_KEY = "re_xxxxxxxxxx" (from Resend dashboard)</div>
          </div>
          <div className="mt-2 text-sm">
            Domain animedottoken.com must be verified in Resend dashboard with all DNS records properly configured.
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}