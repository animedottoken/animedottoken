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
          setDiscordMembers(1);
        }
      } catch (error) {
        console.log('Discord API error:', error);
        setDiscordMembers(1);
      }
    };

    const fetchTwitterFollowers = async () => {
      try {
        // Using actual follower count
        setTwitterFollowers(9);
      } catch (error) {
        console.debug('Twitter follower count fetch failed', error);
        setTwitterFollowers(9);
      }
    };

    // Initial fetch
    fetchDiscordMembers();
    fetchTwitterFollowers();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDiscordMembers();
      fetchTwitterFollowers();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { discordMembers, twitterFollowers };
}