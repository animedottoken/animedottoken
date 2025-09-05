/**
 * Authentication redirect helper to normalize URLs and prevent new tab issues
 * when magic links are initiated from id-preview domains
 */

/**
 * Get the canonical domain for authentication redirects
 * This ensures magic links always redirect to the main sandbox domain
 * even when initiated from id-preview helper domains
 */
function getCanonicalDomain(): string {
  const currentOrigin = window.location.origin;
  
  // If we're on an id-preview domain, normalize to sandbox domain
  if (currentOrigin.includes('id-preview--')) {
    // Extract project ID from id-preview URL
    const match = currentOrigin.match(/id-preview--([^.]+)\.lovable\.app/);
    if (match) {
      const projectId = match[1];
      console.log(`Normalizing id-preview domain to sandbox for project: ${projectId}`);
      return `https://${projectId}.sandbox.lovable.dev`;
    }
  }
  
  // For other domains (local dev, custom domains, etc.), use as-is
  return currentOrigin;
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