import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Lock } from "lucide-react";
import { useMarketplaceSettings } from "@/hooks/useMarketplaceSettings";

export function SecurityBanner() {
  const { settings } = useMarketplaceSettings();

  if (!settings?.is_paused && !settings?.allowlist_only) {
    return null;
  }

  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/20">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium">
            {settings.is_paused && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Marketplace temporarily paused for security maintenance.</span>
                {settings.pause_message && (
                  <span className="ml-2 text-sm opacity-90">
                    {settings.pause_message}
                  </span>
                )}
              </div>
            )}
            {settings.allowlist_only && !settings.is_paused && (
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Currently in allowlist-only mode. Access restricted to approved users.</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}