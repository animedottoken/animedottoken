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
    const supabaseClient = createClient(
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

    // Insert security event log
    const { error } = await supabaseClient
      .from('security_events')
      .insert({
        event_type,
        user_id,
        wallet_address,
        metadata,
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

    // For high/critical events, could trigger alerts here
    if (severity === 'critical' || severity === 'high') {
      console.log(`SECURITY ALERT [${severity.toUpperCase()}]: ${event_type}`, {
        user_id,
        wallet_address,
        metadata
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