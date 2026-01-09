/**
 * Unity Bridge - Auth Token Integration
 * 
 * This script provides functions for Unity WebGL to access
 * authentication tokens from the Plobie website.
 * 
 * Usage in Unity (C#):
 * 
 *   [DllImport("__Internal")]
 *   private static extern string GetAuthToken();
 *   
 *   void Start() {
 *       string token = GetAuthToken();
 *       if (!string.IsNullOrEmpty(token)) {
 *           // Use token for API calls
 *       }
 *   }
 */

// Store the Supabase auth key for localStorage
const SUPABASE_AUTH_KEY = 'sb-' + (window.NEXT_PUBLIC_SUPABASE_URL || '').split('//')[1]?.split('.')[0] + '-auth-token';

/**
 * Get the current Supabase auth token
 * @returns {string} JWT access token or empty string if not logged in
 */
function getAuthToken() {
  try {
    // Try Supabase's localStorage key
    const authData = localStorage.getItem(SUPABASE_AUTH_KEY);
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.access_token || '';
    }
    
    // Fallback: Check for custom stored token
    const customToken = localStorage.getItem('plobie_auth_token');
    if (customToken) {
      return customToken;
    }
    
    return '';
  } catch (error) {
    console.error('[Unity Bridge] Error getting auth token:', error);
    return '';
  }
}

/**
 * Check if user is logged in
 * @returns {string} "true" or "false" (strings for Unity interop)
 */
function isUserLoggedIn() {
  return getAuthToken() ? 'true' : 'false';
}

/**
 * Get user ID from the auth token (JWT decode)
 * @returns {string} User UUID or empty string
 */
function getUserId() {
  try {
    const token = getAuthToken();
    if (!token) return '';
    
    // Decode JWT payload (middle part)
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || '';
  } catch (error) {
    console.error('[Unity Bridge] Error decoding token:', error);
    return '';
  }
}

/**
 * Get the API base URL
 * @returns {string} API base URL
 */
function getApiBaseUrl() {
  return window.location.origin + '/api';
}

/**
 * Log a message from Unity (for debugging)
 * @param {string} message - Message to log
 */
function logFromUnity(message) {
  console.log('[Unity]', message);
}

/**
 * Show an error to the user (can be customized)
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showError(title, message) {
  console.error('[Unity Error]', title, message);
  // Could trigger a toast/modal in the web UI
  if (window.showToast) {
    window.showToast({ type: 'error', title, message });
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
}

// Expose functions globally for Unity WebGL
window.getAuthToken = getAuthToken;
window.isUserLoggedIn = isUserLoggedIn;
window.getUserId = getUserId;
window.getApiBaseUrl = getApiBaseUrl;
window.logFromUnity = logFromUnity;
window.showError = showError;
window.redirectToLogin = redirectToLogin;

// ============================================
// PLOBIE NAMESPACE (agreed upon in meeting)
// Unity should use: window.plobie.getAccessToken()
// ============================================
window.plobie = {
  // Primary auth function - returns JWT or empty string
  getAccessToken: getAuthToken,
  
  // Helper functions
  isLoggedIn: () => getAuthToken() !== '',
  getUserId: getUserId,
  getApiUrl: getApiBaseUrl,
  
  // Debugging
  log: logFromUnity,
  
  // Navigation
  redirectToLogin: redirectToLogin,
  
  // Version for compatibility checks
  version: '1.0.0'
};

// Log bridge initialization
console.log('[Unity Bridge] Initialized v1.0.0');
console.log('[Unity Bridge] User logged in:', isUserLoggedIn());
console.log('[Unity Bridge] Access via window.plobie.getAccessToken()');

