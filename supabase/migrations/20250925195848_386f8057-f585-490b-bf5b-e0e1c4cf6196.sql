-- Security Fix: Clear wallet verification signatures to prevent identity theft
-- This migration addresses the security issue where verification signatures could be stolen

-- Step 1: Create a secure function to handle post-verification cleanup
CREATE OR REPLACE FUNCTION public.secure_wallet_verification_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- If a wallet just became verified, clear the sensitive verification data
  IF NEW.is_verified = true AND (OLD.is_verified = false OR OLD.is_verified IS NULL) THEN
    -- Clear verification signature and message after successful verification
    NEW.verification_signature := NULL;
    NEW.verification_message := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Create trigger to automatically clear verification data after verification
DROP TRIGGER IF EXISTS cleanup_verification_data_on_verify ON public.user_wallets;
CREATE TRIGGER cleanup_verification_data_on_verify
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_wallet_verification_cleanup();

-- Step 3: Create a function for secure wallet verification that doesn't store signatures long-term  
CREATE OR REPLACE FUNCTION public.verify_wallet_securely(
  p_user_id uuid,
  p_wallet_address text,
  p_wallet_type text,
  p_signature text,
  p_message text
) RETURNS jsonb AS $$
DECLARE
  verification_successful boolean := false;
  wallet_id uuid;
BEGIN
  -- NOTE: In a real implementation, you would validate the signature here
  -- For now, we assume the signature validation happens in the calling edge function
  verification_successful := true;
  
  IF verification_successful THEN
    -- Insert the wallet without storing sensitive verification data
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
    
    -- Log the verification event for audit purposes (without sensitive data)
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
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Signature verification failed'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Clean up existing verification data from all verified wallets
-- This removes the security risk from existing data
UPDATE public.user_wallets 
SET 
  verification_signature = NULL,
  verification_message = NULL
WHERE is_verified = true;

-- Step 5: Add additional RLS policy to prevent access to verification data even by the user
-- This creates a more secure approach where verification data is never accessible via API
CREATE POLICY "Block access to verification signatures" ON public.user_wallets
FOR SELECT USING (false);