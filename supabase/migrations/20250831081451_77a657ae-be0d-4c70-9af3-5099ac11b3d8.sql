-- Add circuit breaker fields to marketplace settings
ALTER TABLE marketplace_settings 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowlist_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pause_message TEXT;

-- Create security events table for monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  wallet_address TEXT,
  metadata JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on security_events (admin-only access)
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert security events
CREATE POLICY "Service role can insert security events" 
ON security_events 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Simple policy - only authenticated users can view their own events for now
CREATE POLICY "Users can view their own security events" 
ON security_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_wallet ON security_events(wallet_address);

-- Drop and recreate the public function with new fields
DROP FUNCTION IF EXISTS get_marketplace_info_public();
CREATE OR REPLACE FUNCTION get_marketplace_info_public()
RETURNS TABLE (
  platform_fee_percentage NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_paused BOOLEAN,
  allowlist_only BOOLEAN,
  pause_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.platform_fee_percentage,
    ms.updated_at,
    ms.is_paused,
    ms.allowlist_only,
    ms.pause_message
  FROM marketplace_settings ms
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$$;

-- Drop and recreate the authenticated function with new fields
DROP FUNCTION IF EXISTS get_marketplace_settings_authenticated();
CREATE OR REPLACE FUNCTION get_marketplace_settings_authenticated()
RETURNS TABLE (
  id TEXT,
  platform_fee_percentage NUMERIC,
  platform_wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_paused BOOLEAN,
  allowlist_only BOOLEAN,
  pause_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    ms.id::TEXT,
    ms.platform_fee_percentage,
    ms.platform_wallet_address,
    ms.created_at,
    ms.updated_at,
    ms.is_paused,
    ms.allowlist_only,
    ms.pause_message
  FROM marketplace_settings ms
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$$;