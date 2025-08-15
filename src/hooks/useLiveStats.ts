import { useEffect, useState } from "react";

interface LiveStats {
  discordMembers: number | null;
  twitterFollowers: number | null;
}

export function useLiveStats(): LiveStats {
  const [discordMembers, setDiscordMembers] = useState<number | null>(null);
  const [twitterFollowers, setTwitterFollowers] = useState<number | null>(null);

  useEffect(() => {
    const fetchDiscordMembers = async () => {
      try {
        // Discord widget API for server stats - using real server ID
        const response = await fetch('https://discord.com/api/guilds/1403646153253195877/widget.json');
        console.log('Discord API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Discord API data:', data);
          const count = data.presence_count || 1;
          console.log('Setting Discord members to:', count);
          setDiscordMembers(count);
        } else {
          console.log('Discord API failed with status:', response.status);
          setDiscordMembers(123);
        }
      } catch (error) {
        console.log('Discord API error:', error);
        setDiscordMembers(123);
      }
    };

    const fetchTwitterFollowers = async () => {
      try {
        console.log('Fetching Twitter followers...');
        // Call our Supabase edge function for Twitter data
        const response = await fetch('https://eztzddykjnmnpoeyfqcg.supabase.co/functions/v1/get-twitter-stats');
        console.log('Twitter edge function response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Twitter edge function data:', data);
          const count = data.followers_count || 123;
          console.log('Setting Twitter followers to:', count);
          setTwitterFollowers(count);
        } else {
          const errorText = await response.text();
          console.error('Twitter edge function failed with status:', response.status, errorText);
          setTwitterFollowers(123);
        }
      } catch (error) {
        console.error('Twitter edge function error:', error);
        setTwitterFollowers(123);
      }
    };

    // Initial fetch
    fetchDiscordMembers();
    fetchTwitterFollowers();

    // Refresh once a day to avoid rate limits
    const interval = setInterval(() => {
      fetchDiscordMembers();
      fetchTwitterFollowers();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { discordMembers, twitterFollowers };
}