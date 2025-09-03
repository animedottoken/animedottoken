// Metaplex Program IDs - Pinned for security
export const METAPLEX_AUCTION_HOUSE_PROGRAM_ID = "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk";
export const METAPLEX_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
export const METAPLEX_CANDY_MACHINE_PROGRAM_ID = "CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR";

// Solana System Programs
export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

// Current commit hash for transparency (to be updated manually or via build process)
export const COMMIT_HASH = "development-build";

// Program validation helper
export const validateProgramId = (programId: string, expectedId: string, programName: string) => {
  if (programId !== expectedId) {
    throw new Error(`Security: Invalid ${programName} program ID. Expected: ${expectedId}, Got: ${programId}`);
  }
  return true;
};