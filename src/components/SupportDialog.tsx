import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageCircle, Mail, FileText, ExternalLink } from 'lucide-react';

interface SupportDialogProps {
  trigger?: React.ReactNode;
}

export function SupportDialog({ trigger }: SupportDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <HelpCircle className="h-4 w-4" />
      Support
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Need Help?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                // Open Discord or community link
                window.open('#', '_blank');
              }}
            >
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Community Support</div>
                  <div className="text-sm text-muted-foreground">
                    Get help from other users
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                // Open email client or contact form
                window.location.href = 'mailto:support@anime.token';
              }}
            >
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Email Support</div>
                  <div className="text-sm text-muted-foreground">
                    Direct help from our team
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setOpen(false);
                window.location.href = '/support';
              }}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Full Support Page</div>
                  <div className="text-sm text-muted-foreground">
                    FAQs and troubleshooting
                  </div>
                </div>
              </div>
            </Button>
          </div>
          
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Quick fixes:</div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                Refresh page
              </Badge>
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                Check wallet
              </Badge>
              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                Clear cache
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}