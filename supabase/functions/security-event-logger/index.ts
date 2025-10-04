import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  wallet_address?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.log('❌ No auth header found')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Auth verification failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event_type, user_id, wallet_address, metadata, severity }: SecurityEvent = await req.json()

    // Basic validation
    if (!event_type || !severity) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_type, severity' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate severity level
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(severity)) {
      return new Response(
        JSON.stringify({ error: 'Invalid severity level. Must be: low, medium, high, or critical' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // SECURITY: Validate that user_id matches authenticated user if provided
    const actualUserId = user_id || user.id
    if (user_id && user_id !== user.id) {
      console.log('⚠️ User ID mismatch - using authenticated user ID')
      return new Response(
        JSON.stringify({ error: 'User ID mismatch with authenticated user' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // SECURITY: Check rate limit (max 10 events per minute per user)
    const { data: rateLimitOk, error: rateLimitError } = await supabaseAdmin
      .rpc('check_security_event_rate_limit', {
        p_user_id: actualUserId,
        p_max_events: 10,
        p_window_minutes: 1
      })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
      // Don't block on rate limit errors, but log them
    } else if (!rateLimitOk) {
      console.log(`⚠️ Rate limit exceeded for user: ${actualUserId}`)
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 10 security events per minute.' }),
        { status: 429, headers: corsHeaders }
      )
    }

    // Insert security event log with validated user_id
    const { error } = await supabaseAdmin
      .from('security_events')
      .insert({
        event_type,
        user_id: actualUserId,
        wallet_address,
        metadata: {
          ...metadata,
          authenticated_user: user.id,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        },
        severity,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to log security event' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // For high/critical events, trigger enhanced logging
    if (severity === 'critical' || severity === 'high') {
      console.log(`🚨 SECURITY ALERT [${severity.toUpperCase()}]: ${event_type}`, {
        user_id: actualUserId,
        authenticated_user: user.id,
        wallet_address,
        timestamp: new Date().toISOString()
      })
      
      // TODO: Send webhook/email notification for critical events
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Security logger error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})