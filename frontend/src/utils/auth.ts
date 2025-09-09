import { removeCookie } from './common'
import { APP_CONSTANTS } from '@/constants'
import { API_CONFIG } from '@/config/api'

/**
 * Clear all authentication-related cookies
 */
export const clearAuthCookies = (): void => {
  if (typeof document === 'undefined') return;
  
  console.log('🍪 Starting cookie cleanup...');
  
  // List of all auth-related cookies to clear
  const authCookies = [
    APP_CONSTANTS.COOKIES.AUTH_TOKEN,
    'next-auth.session-token',
    'next-auth.jwt-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    'next-auth.state',
    'next-auth.provider',
    'next-auth.redirect',
    'auth-token',
    'session-token',
    'jwt-token'
  ];
  
  // Get current cookies before clearing
  const currentCookies = document.cookie;
  console.log('🍪 Current cookies before clearing:', currentCookies);
  
  // Clear each cookie using the enhanced removeCookie function
  authCookies.forEach(cookieName => {
    console.log(`🍪 Clearing cookie: ${cookieName}`);
    removeCookie(cookieName);
  });
  
  // Additional manual clearing for stubborn cookies
  const hostname = window.location.hostname;
  const isProduction = process.env.NODE_ENV === 'production';
  
  authCookies.forEach(cookieName => {
    const manualRemovalStrategies = [
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}; samesite=lax;`,
      ...(isProduction ? [`${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}; secure;`] : []),
    ];
    
    manualRemovalStrategies.forEach(strategy => {
      document.cookie = strategy;
    });
  });
  
  // Log remaining cookies after clearing
  setTimeout(() => {
    const remainingCookies = document.cookie;
    console.log('🍪 Remaining cookies after clearing:', remainingCookies);
    
    // Check if any auth cookies still exist
    const stillExists = authCookies.some(cookieName => 
      document.cookie.includes(cookieName)
    );
    
    if (stillExists) {
      console.warn('⚠️ Some auth cookies still exist. They might be HttpOnly cookies that need server-side clearing.');
    } else {
      console.log('✅ All auth cookies cleared successfully!');
    }
  }, 100);
}

/**
 * Force clear all cookies by making a request to logout endpoint
 * This is useful for clearing HttpOnly cookies that can't be cleared from client-side
 */
export const forceLogoutWithServer = async (): Promise<void> => {
  try {
    // Build the logout URL using API config
    const logoutUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SIGN_OUT}`;
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    // Call backend logout endpoint to clear HttpOnly cookies
    const response = await fetch(logoutUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...API_CONFIG.HEADERS,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Server-side logout successful');
      const responseData = await response.json().catch(() => null);
      if (responseData) {
        console.log('📄 Logout response:', responseData);
      }
    } else {
      console.warn('⚠️ Server-side logout failed, but continuing with client-side cleanup');
      console.warn('📄 Response status:', response.status, response.statusText);
      
      // Try to get error details
      try {
        const errorData = await response.json();
        console.warn('📄 Error response:', errorData);
      } catch (e) {
        console.warn('📄 Could not parse error response');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Server-side logout timeout');
    } else {
      console.error('❌ Server-side logout error:', error);
    }
    console.log('🔄 Continuing with client-side cleanup...');
  } finally {
    // Always clear client-side cookies regardless of server response
    clearAuthCookies();
  }
}

/**
 * Complete logout process with API call and client-side cleanup
 */
export const performLogout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🚪 Starting complete logout process...');
    await forceLogoutWithServer();
    
    // Step 2: Clear all client-side storage
    if (typeof localStorage !== 'undefined') {
      // Clear specific auth items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('session-token');
      
      // Clear any other auth-related items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user') || key.includes('token')) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log('✅ Complete logout process finished');
    return { success: true, message: 'Logout successful' };
    
  } catch (error) {
    console.error('❌ Logout process error:', error);
    return { success: false, message: 'Logout failed but cleanup completed' };
  }
}

/**
 * Handle authentication errors and redirect to login if needed
 */
export const handleAuthError = (error: any, redirectToLogin: () => void): void => {
  console.error('Authentication error:', error)
  
  // Check if it's an authentication error
  const isAuthError = 
    error?.message?.includes('Authentication required') ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Not authenticated') ||
    error?.message?.includes('Invalid token') ||
    error?.message?.includes('Token expired') ||
    error?.status === 401 ||
    error?.statusCode === 401
  
  if (isAuthError) {
    // Clear all authentication cookies
    clearAuthCookies()
    
    // Clear any stored user data
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_changed')
      // Clear any other auth-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user') || key.includes('token')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    // Clear any stored session data
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user') || key.includes('token')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    // Redirect to login page
    redirectToLogin()
  }
}

/**
 * Check if user is authenticated by verifying if auth cookies exist
 */
export const isAuthenticated = (): boolean => {
  if (typeof document === 'undefined') return false
  
  const jwtToken = document.cookie.includes(APP_CONSTANTS.COOKIES.AUTH_TOKEN)
  const sessionToken = document.cookie.includes('next-auth.session-token')
  const nextAuthJwtToken = document.cookie.includes('next-auth.jwt-token')
  
  return jwtToken || sessionToken || nextAuthJwtToken
}

/**
 * Force logout and redirect to login
 */
export const forceLogout = (redirectToLogin: () => void): void => {
  // Clear all auth data
  clearAuthCookies()
  
  // Clear localStorage and sessionStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
  
  // Redirect to login
  redirectToLogin()
}
