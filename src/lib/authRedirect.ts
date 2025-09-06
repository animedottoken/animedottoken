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
 * Store the redirect URL in sessionStorage for persistence across provider redirects
 * @param redirectPath - The path to store for later retrieval
 */
function storeRedirectUrl(redirectPath: string): void {
  try {
    sessionStorage.setItem('auth:redirect', redirectPath);
    console.log('Stored redirect URL in sessionStorage:', redirectPath);
  } catch (error) {
    console.warn('Failed to store redirect URL:', error);
  }
}

/**
 * Get the stored redirect URL from sessionStorage and clear it
 * @returns The stored redirect URL or null if not found
 */
function getStoredRedirectUrl(): string | null {
  try {
    const storedRedirect = sessionStorage.getItem('auth:redirect');
    if (storedRedirect) {
      sessionStorage.removeItem('auth:redirect');
      console.log('Retrieved and cleared stored redirect URL:', storedRedirect);
      return storedRedirect;
    }
  } catch (error) {
    console.warn('Failed to get stored redirect URL:', error);
  }
  return null;
}

/**
 * Sanitize and validate a redirect URL
 * @param redirectPath - The path to sanitize
 * @returns A safe redirect path or default fallback
 */
function sanitizeRedirectUrl(redirectPath: string | null): string {
  if (!redirectPath) return '/profile';
  
  // Ensure the path starts with / and is not an external URL
  if (redirectPath.startsWith('/') && !redirectPath.includes('://')) {
    return redirectPath;
  }
  
  console.warn('Invalid redirect path, using default:', redirectPath);
  return '/profile';
}

/**
 * Generate a consistent redirect URL for authentication flows
 * @param targetPath - The path to redirect to after successful auth (default: current path)
 * @returns Normalized redirect URL that avoids new tab issues
 */
export function getAuthRedirectUrl(targetPath?: string): string {
  const canonicalDomain = getCanonicalDomain();
  const redirectPath = targetPath || (window.location.pathname + window.location.search + window.location.hash);
  
  // Store the intended redirect for later retrieval
  storeRedirectUrl(redirectPath);
  
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
  
  // Store the intended redirect for later retrieval
  storeRedirectUrl(redirectPath);
  
  // OAuth can redirect to main page with redirect param since it goes through query params
  const redirectUrl = `${canonicalDomain}/?redirect=${encodeURIComponent(redirectPath)}`;
  
  console.log('Generated OAuth redirect URL:', redirectUrl);
  return redirectUrl;
}

/**
 * Get the final redirect URL, using stored value as fallback if query param is lost
 * @param queryRedirect - The redirect from URL query parameters
 * @returns The final sanitized redirect URL
 */
export function getFinalRedirectUrl(queryRedirect?: string | null): string {
  // Try query parameter first
  if (queryRedirect) {
    const sanitized = sanitizeRedirectUrl(queryRedirect);
    console.log('Using query redirect:', sanitized);
    return sanitized;
  }
  
  // Fall back to stored redirect URL
  const storedRedirect = getStoredRedirectUrl();
  const sanitized = sanitizeRedirectUrl(storedRedirect);
  console.log('Using stored redirect (fallback):', sanitized);
  return sanitized;
}