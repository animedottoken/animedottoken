-- Enhanced security for newsletter_subscribers table

-- 1. Create encryption functions for email addresses
CREATE OR REPLACE FUNCTION public.encrypt_email(email_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple encryption using pgcrypto extension
  -- In production, you'd use a proper encryption key from secrets
  RETURN encode(
    digest(email_text || 'newsletter_salt_2024', 'sha256'), 
    'hex'
  )[1:32] || '***' || right(email_text, 4);
END;
$$;

-- 2. Create function to safely insert newsletter subscribers with security logging
CREATE OR REPLACE FUNCTION public.secure_newsletter_subscribe(
  p_email text,
  p_opt_in_token text DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_id uuid;
  generated_token text;
BEGIN
  -- Input validation
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  
  -- Basic email format validation
  IF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Generate secure opt-in token if not provided
  IF p_opt_in_token IS NULL THEN
    generated_token := encode(gen_random_bytes(32), 'base64');
  ELSE
    generated_token := p_opt_in_token;
  END IF;
  
  -- Check if email already exists (use service role context)
  SELECT id INTO subscriber_id 
  FROM newsletter_subscribers 
  WHERE email = p_email;
  
  IF subscriber_id IS NOT NULL THEN
    -- Update existing subscriber
    UPDATE newsletter_subscribers 
    SET 
      opt_in_token = generated_token,
      status = 'pending',
      updated_at = now(),
      unsubscribed_at = NULL
    WHERE id = subscriber_id;
  ELSE
    -- Insert new subscriber
    INSERT INTO newsletter_subscribers (
      email, 
      opt_in_token, 
      status
    ) 
    VALUES (
      p_email, 
      generated_token, 
      'pending'
    )
    RETURNING id INTO subscriber_id;
  END IF;
  
  -- Security audit log
  INSERT INTO security_events (
    event_type,
    severity,
    metadata
  ) VALUES (
    'newsletter_subscription_attempt',
    'info',
    jsonb_build_object(
      'subscriber_id', subscriber_id,
      'email_domain', split_part(p_email, '@', 2),
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'subscriber_id', subscriber_id,
    'opt_in_token', generated_token,
    'message', 'Subscription processed successfully'
  );
END;
$$;

-- 3. Create function to safely confirm newsletter subscription
CREATE OR REPLACE FUNCTION public.secure_newsletter_confirm(
  p_email text,
  p_opt_in_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_id uuid;
  current_status text;
BEGIN
  -- Input validation
  IF p_email IS NULL OR p_email = '' OR p_opt_in_token IS NULL OR p_opt_in_token = '' THEN
    RAISE EXCEPTION 'Email and opt-in token are required';
  END IF;
  
  -- Find and validate subscriber
  SELECT id, status INTO subscriber_id, current_status
  FROM newsletter_subscribers 
  WHERE email = p_email AND opt_in_token = p_opt_in_token;
  
  IF subscriber_id IS NULL THEN
    -- Log potential security issue
    INSERT INTO security_events (
      event_type,
      severity,
      metadata
    ) VALUES (
      'newsletter_invalid_confirmation_attempt',
      'warn',
      jsonb_build_object(
        'email_domain', split_part(p_email, '@', 2),
        'timestamp', now(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    );
    
    RAISE EXCEPTION 'Invalid confirmation token or email address';
  END IF;
  
  -- Update subscriber status
  UPDATE newsletter_subscribers 
  SET 
    status = 'confirmed',
    confirmed_at = now(),
    updated_at = now()
  WHERE id = subscriber_id;
  
  -- Security audit log
  INSERT INTO security_events (
    event_type,
    severity,
    metadata
  ) VALUES (
    'newsletter_subscription_confirmed',
    'info',
    jsonb_build_object(
      'subscriber_id', subscriber_id,
      'email_domain', split_part(p_email, '@', 2),
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email subscription confirmed successfully'
  );
END;
$$;

-- 4. Create function to safely unsubscribe with security logging
CREATE OR REPLACE FUNCTION public.secure_newsletter_unsubscribe(
  p_email text,
  p_opt_in_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_id uuid;
BEGIN
  -- Input validation
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  
  -- Find subscriber (with or without token for convenience)
  IF p_opt_in_token IS NOT NULL THEN
    SELECT id INTO subscriber_id
    FROM newsletter_subscribers 
    WHERE email = p_email AND opt_in_token = p_opt_in_token;
  ELSE
    SELECT id INTO subscriber_id
    FROM newsletter_subscribers 
    WHERE email = p_email;
  END IF;
  
  IF subscriber_id IS NULL THEN
    -- Don't reveal if email exists or not for privacy
    RETURN jsonb_build_object(
      'success', true,
      'message', 'If your email was subscribed, you have been unsubscribed'
    );
  END IF;
  
  -- Update subscriber status
  UPDATE newsletter_subscribers 
  SET 
    status = 'unsubscribed',
    unsubscribed_at = now(),
    updated_at = now()
  WHERE id = subscriber_id;
  
  -- Security audit log
  INSERT INTO security_events (
    event_type,
    severity,
    metadata
  ) VALUES (
    'newsletter_unsubscribe',
    'info',
    jsonb_build_object(
      'subscriber_id', subscriber_id,
      'email_domain', split_part(p_email, '@', 2),
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully unsubscribed from newsletter'
  );
END;
$$;

-- 5. Create secure function to get newsletter status (for edge functions only)
CREATE OR REPLACE FUNCTION public.get_newsletter_subscriber_status(
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_record record;
BEGIN
  -- Only allow service role to call this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;
  
  -- Get subscriber info
  SELECT status, confirmed_at, unsubscribed_at, created_at
  INTO subscriber_record
  FROM newsletter_subscribers 
  WHERE email = p_email;
  
  IF subscriber_record IS NULL THEN
    RETURN jsonb_build_object(
      'exists', false,
      'status', 'not_found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'exists', true,
    'status', subscriber_record.status,
    'confirmed_at', subscriber_record.confirmed_at,
    'unsubscribed_at', subscriber_record.unsubscribed_at,
    'created_at', subscriber_record.created_at
  );
END;
$$;

-- 6. Add additional security audit trigger for newsletter_subscribers
CREATE OR REPLACE FUNCTION public.audit_newsletter_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log any direct access to newsletter_subscribers table
  INSERT INTO security_events (
    event_type,
    severity,
    metadata
  ) VALUES (
    'newsletter_table_access',
    'info',
    jsonb_build_object(
      'operation', TG_OP,
      'table_name', TG_TABLE_NAME,
      'timestamp', now(),
      'user_role', auth.role()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for newsletter access auditing
DROP TRIGGER IF EXISTS audit_newsletter_subscribers_trigger ON newsletter_subscribers;
CREATE TRIGGER audit_newsletter_subscribers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION audit_newsletter_access();

-- 7. Update RLS policies to be even more restrictive with additional checks
DROP POLICY IF EXISTS "Enhanced service role access only" ON newsletter_subscribers;
CREATE POLICY "Enhanced service role access only" 
ON newsletter_subscribers 
FOR ALL 
USING (
  auth.role() = 'service_role'::text 
  AND current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
) 
WITH CHECK (
  auth.role() = 'service_role'::text 
  AND current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- 8. Create rate limiting for newsletter operations
CREATE TABLE IF NOT EXISTS public.newsletter_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_domain text NOT NULL,
  operation_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(email_domain, operation_type)
);

-- Enable RLS on rate limits table
ALTER TABLE public.newsletter_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role rate limits access" 
ON newsletter_rate_limits 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 9. Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_newsletter_rate_limit(
  p_email text,
  p_operation text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  email_domain text;
  current_attempts integer;
  window_start timestamp with time zone;
BEGIN
  -- Extract domain from email
  email_domain := split_part(p_email, '@', 2);
  
  -- Calculate current window
  window_start := date_trunc('hour', now()) - (extract(minute from now())::integer / p_window_minutes)::integer * (p_window_minutes || ' minutes')::interval;
  
  -- Get or create rate limit record
  INSERT INTO newsletter_rate_limits (email_domain, operation_type, window_start)
  VALUES (email_domain, p_operation, window_start)
  ON CONFLICT (email_domain, operation_type)
  DO UPDATE SET 
    attempt_count = CASE 
      WHEN newsletter_rate_limits.window_start < EXCLUDED.window_start THEN 1
      ELSE newsletter_rate_limits.attempt_count + 1
    END,
    window_start = EXCLUDED.window_start;
  
  -- Check if limit exceeded
  SELECT attempt_count INTO current_attempts
  FROM newsletter_rate_limits
  WHERE email_domain = split_part(p_email, '@', 2) 
    AND operation_type = p_operation;
  
  IF current_attempts > p_max_attempts THEN
    -- Log rate limit violation
    INSERT INTO security_events (
      event_type,
      severity,
      metadata
    ) VALUES (
      'newsletter_rate_limit_exceeded',
      'warn',
      jsonb_build_object(
        'email_domain', email_domain,
        'operation', p_operation,
        'attempts', current_attempts,
        'limit', p_max_attempts
      )
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;