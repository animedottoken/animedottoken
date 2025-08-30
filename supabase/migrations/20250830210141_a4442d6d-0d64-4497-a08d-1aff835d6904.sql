-- Clean up any existing primary wallets for authenticated users
-- This allows users to start fresh with wallet linking

-- Create a function to clean up primary wallets for the current authenticated user
CREATE OR REPLACE FUNCTION public.cleanup_user_primary_wallets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Only proceed if user is authenticated
  IF current_user_id IS NOT NULL THEN
    -- Delete all primary wallets for this user
    DELETE FROM public.user_wallets 
    WHERE user_id = current_user_id 
    AND wallet_type = 'primary';
    
    -- Log the cleanup (optional)
    RAISE NOTICE 'Cleaned up primary wallets for user: %', current_user_id;
  ELSE
    RAISE EXCEPTION 'User not authenticated';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_user_primary_wallets() TO authenticated;