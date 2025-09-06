import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, LogOut, Clock } from 'lucide-react';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface SecuritySettingsDialogProps {
  children: React.ReactNode;
}

export const SecuritySettingsDialog = ({ children }: SecuritySettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const { rememberSession, setRememberSession, signOutFromAllDevices, lastActivity } = useSessionSecurity();
  const { user } = useAuth();
  const { rememberWallet, setRememberWallet } = useSolanaWallet();

  const handleSignOutAllDevices = async () => {
    try {
      await signOutFromAllDevices();
      setOpen(false);
    } catch (error) {
      console.error('Failed to sign out from all devices');
    }
  };

  const timeSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account security preferences and session settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                Session Management
              </CardTitle>
              <CardDescription>
                Control how long you stay signed in and manage active sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="remember-session">Remember my login</Label>
                  <p className="text-sm text-muted-foreground">
                    If OFF, you'll be signed out after ~30 minutes of inactivity
                  </p>
                </div>
                <Switch
                  id="remember-session"
                  checked={rememberSession}
                  onCheckedChange={setRememberSession}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Last activity</p>
                    <p className="text-sm text-muted-foreground">
                      {timeSinceActivity < 1 ? 'Just now' : `${timeSinceActivity} minutes ago`}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignOutAllDevices}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out everywhere
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-4 w-4" />
                Wallet Preferences
              </CardTitle>
              <CardDescription>
                Control how your wallet connections are managed in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="remember-wallet">Remember my wallet choice</Label>
                  <p className="text-sm text-muted-foreground">
                    If ON, your selected wallet will be remembered for future connections
                  </p>
                </div>
                <Switch
                  id="remember-wallet"
                  checked={rememberWallet}
                  onCheckedChange={setRememberWallet}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account created:</span>
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last sign in:</span>
                  <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};