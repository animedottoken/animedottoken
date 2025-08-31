import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

type SecurityEventType = 
  | 'suspicious_mint_attempt'
  | 'rate_limit_exceeded'
  | 'invalid_program_id'
  | 'unauthorized_access_attempt'
  | 'large_transaction_attempt'
  | 'wallet_connection_anomaly';

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export function useSecurityLogger() {
  const { user } = useAuth();
  const { publicKey } = useSolanaWallet();

  const logSecurityEvent = async (
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase.functions.invoke('security-event-logger', {
        body: {
          event_type: eventType,
          user_id: user?.id || null,
          wallet_address: publicKey || null,
          metadata: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href,
            ...metadata
          },
          severity
        }
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security logging error:', error);
      // Don't throw - security logging should be non-blocking
    }
  };

  const logSuspiciousActivity = (activity: string, details?: any) => {
    logSecurityEvent('suspicious_mint_attempt', 'medium', {
      activity,
      details
    });
  };

  const logRateLimit = (action: string, count: number) => {
    logSecurityEvent('rate_limit_exceeded', 'high', {
      action,
      attempt_count: count
    });
  };

  const logInvalidProgramId = (programId: string, expectedId: string) => {
    logSecurityEvent('invalid_program_id', 'critical', {
      provided_program_id: programId,
      expected_program_id: expectedId
    });
  };

  return {
    logSecurityEvent,
    logSuspiciousActivity,
    logRateLimit,
    logInvalidProgramId,
  };
}