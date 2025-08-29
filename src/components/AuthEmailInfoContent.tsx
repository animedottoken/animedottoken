import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function AuthEmailInfoContent() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Email Delivery Information</DialogTitle>
        <DialogDescription>
          Understanding magic link delivery times
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium mb-2">Delivery Times by Provider</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• <strong>Gmail:</strong> Usually instant (within seconds)</li>
            <li>• <strong>Outlook/Hotmail:</strong> 1-2 minutes</li>
            <li>• <strong>Yahoo:</strong> 2-5 minutes</li>
            <li>• <strong>Other providers:</strong> May take up to 10 minutes</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Troubleshooting Tips</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Try using Google sign-in as an alternative</li>
            <li>• Wait a few minutes before requesting another link</li>
          </ul>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Still having issues?{" "}
            <a 
              href="/support" 
              className="text-primary underline hover:no-underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </>
  );
}