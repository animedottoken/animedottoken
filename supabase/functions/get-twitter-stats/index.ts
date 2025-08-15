const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN');
    
    console.log('Bearer token exists:', !!TWITTER_BEARER_TOKEN);
    console.log('Bearer token length:', TWITTER_BEARER_TOKEN?.length || 0);
    
    if (!TWITTER_BEARER_TOKEN) {
      console.error('Missing TWITTER_BEARER_TOKEN environment variable');
      throw new Error('Twitter Bearer Token not configured');
    }

    // Fetch Twitter user data for @AnimeDotToken
    console.log('Calling Twitter API...');
    const response = await fetch('https://api.twitter.com/2/users/by/username/AnimeDotToken?user.fields=public_metrics', {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Twitter API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error details:', errorText);
      // Return fallback data if Twitter API fails
      return new Response(
        JSON.stringify({ followers_count: 123 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const data = await response.json();
    console.log('Twitter API response:', data);

    const followersCount = data.data?.public_metrics?.followers_count || 123;

    return new Response(
      JSON.stringify({ followers_count: followersCount }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching Twitter stats:', error);
    
    // Return fallback data on error
    return new Response(
      JSON.stringify({ followers_count: 123 }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});