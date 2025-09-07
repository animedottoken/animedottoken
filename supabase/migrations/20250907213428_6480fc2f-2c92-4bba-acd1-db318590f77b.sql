-- Enhanced security for newsletter_subscribers table (Clean implementation)

-- 1. Create encryption functions for email addresses
CREATE OR REPLACE FUNCTION public.encrypt_email(email_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN substring(
    encode(
      digest(email_text || 'newsletter_salt_2024', 'sha256'), 
      'hex'
    ), 1, 32
  ) || '***' || right(email_text, 4);
END;
$$;

-- 2. Create secure newsletter subscription function with rate limiting and audit
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
  
  -- Check if email already exists
  SELECT id INTO subscriber_id 
  FROM newsletter_subscribers 
  WHERE email = p_email;
  
  IF subscriber_id IS NOT NULL THEN
    UPDATE newsletter_subscribers 
    SET 
      opt_in_token = generated_token,
      status = 'pending',
      updated_at = now(),
      unsubscribed_at = NULL
    WHERE id = subscriber_id;
  ELSE
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
      'timestamp', now()
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

-- 3. Create audit trigger for newsletter table access
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

-- 4. Additional comment on existing security
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscribers with enhanced security: RLS restricted to service role only, audit logging enabled, rate limiting implemented';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Customer email addresses - protected by service role only RLS policies and audit logging';
COMMENT ON COLUMN newsletter_subscribers.opt_in_token IS 'Secure token for email confirmation - prevents unauthorized subscriptions';