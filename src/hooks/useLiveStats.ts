interface LiveStats {
  discordMembers: number;
  twitterFollowers: number;
}

export function useLiveStats(): LiveStats {
  // Static values - no live API calls
  return { 
    discordMembers: 123, 
    twitterFollowers: 456 
  };
}