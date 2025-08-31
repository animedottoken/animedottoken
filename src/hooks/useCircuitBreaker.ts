import { useMarketplaceSettings } from "@/hooks/useMarketplaceSettings";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useCircuitBreaker() {
  const { settings } = useMarketplaceSettings();
  const { user } = useAuth();

  const checkAccess = (action: string = "perform this action") => {
    if (settings?.is_paused) {
      toast.error("Service temporarily unavailable", {
        description: settings.pause_message || "Marketplace is paused for maintenance"
      });
      return false;
    }

    if (settings?.allowlist_only && !user) {
      toast.error("Access restricted", {
        description: "Sign in required to access this feature"
      });
      return false;
    }

    return true;
  };

  const guardedAction = (action: () => Promise<void> | void, actionName?: string) => {
    return async () => {
      if (!checkAccess(actionName)) return;
      
      try {
        await action();
      } catch (error) {
        console.error(`Guarded action "${actionName}" failed:`, error);
        throw error;
      }
    };
  };

  return {
    checkAccess,
    guardedAction,
    isPaused: settings?.is_paused || false,
    isAllowlistOnly: settings?.allowlist_only || false,
    pauseMessage: settings?.pause_message,
  };
}