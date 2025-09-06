/**
 * Authentication redirect helper to normalize URLs and prevent new tab issues
 * when magic links are initiated from id-preview domains
 */

/**
 * Get the canonical domain for authentication redirects
 * Always uses the current origin for live domain operations
 */
function getCanonicalDomain(): string {
  return window.location.origin;
}

/**
 * Generate a consistent redirect URL for authentication flows
 * @param targetPath - The path to redirect to after successful auth (default: current path)
 * @returns Normalized redirect URL that avoids new tab issues
 */
export function getAuthRedirectUrl(targetPath?: string): string {
  const canonicalDomain = getCanonicalDomain();
  const redirectPath = targetPath || (window.location.pathname + window.location.search + window.location.hash);
  
  // Always redirect to /auth with the target path as a parameter
  const redirectUrl = `${canonicalDomain}/auth?redirect=${encodeURIComponent(redirectPath)}`;
  
  console.log('Generated auth redirect URL:', redirectUrl);
  return redirectUrl;
}

/**
 * Generate OAuth redirect URL (goes through main app routing)
 * @param targetPath - The path to redirect to after successful OAuth
 * @returns OAuth redirect URL
 */
export function getOAuthRedirectUrl(targetPath?: string): string {
  const canonicalDomain = getCanonicalDomain();
  const redirectPath = targetPath || (window.location.pathname + window.location.search + window.location.hash);
  
  // OAuth can redirect to main page with redirect param since it goes through query params
  const redirectUrl = `${canonicalDomain}/?redirect=${encodeURIComponent(redirectPath)}`;
  
  console.log('Generated OAuth redirect URL:', redirectUrl);
  return redirectUrl;
}