-- CRITICAL SECURITY FIX: Remove wallet verification signature storage (Fixed)
-- These columns pose a security risk even with RLS policies in place
-- All signature verification should happen in-memory in edge functions

-- 1. Drop the trigger first (if it exists)
DROP TRIGGER IF EXISTS cleanup_verification_data_on_verify ON public.user_wallets;

-- 2. Drop the trigger function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS public.secure_wallet_verification_cleanup() CASCADE;

-- 3. Drop the columns that store sensitive verification data
ALTER TABLE public.user_wallets 
  DROP COLUMN IF EXISTS verification_signature,
  DROP COLUMN IF EXISTS verification_message;

-- 4. Update the verify_wallet_securely function to not use these columns
CREATE OR REPLACE FUNCTION public.verify_wallet_securely(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_wallet_type TEXT,
  p_signature TEXT,
  p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id UUID;
BEGIN
  -- NOTE: Signature verification happens in the calling edge function
  -- This function just creates the verified wallet record
  -- Signatures are NEVER stored in the database for security
  
  -- Insert the wallet as verified (verification already done by caller)
  INSERT INTO public.user_wallets (
    user_id,
    wallet_address,
    wallet_type,
    is_verified
  ) VALUES (
    p_user_id,
    p_wallet_address,
    p_wallet_type,
    true
  ) RETURNING id INTO wallet_id;
  
  -- Log the verification event for audit (without sensitive data)
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    wallet_address,
    metadata
  ) VALUES (
    'wallet_verification_completed',
    'info',
    p_user_id,
    p_wallet_address,
    jsonb_build_object(
      'wallet_type', p_wallet_type,
      'verification_method', 'signature',
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', wallet_id,
    'message', 'Wallet verified successfully'
  );
END;
$$;

-- 5. Add comment explaining the security model
COMMENT ON FUNCTION public.verify_wallet_securely IS 
'SECURITY: This function creates verified wallet records after signature verification. 
Signature verification MUST be performed by the calling edge function before invoking this function.
Signatures are NEVER stored in the database to prevent potential theft or replay attacks.';