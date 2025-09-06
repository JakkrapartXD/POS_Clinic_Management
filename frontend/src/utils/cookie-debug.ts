/**
 * Debug utilities for cookie management
 */

/**
 * List all current cookies
 */
export const listAllCookies = (): void => {
  if (typeof document === 'undefined') {
    console.log('🍪 Document not available (SSR)');
    return;
  }
  
  const cookies = document.cookie;
  console.log('🍪 All current cookies:', cookies);
  
  if (cookies) {
    const cookieArray = cookies.split(';').map(cookie => cookie.trim());
    console.log('🍪 Parsed cookies:', cookieArray);
  } else {
    console.log('🍪 No cookies found');
  }
}

/**
 * Check if specific auth cookies exist
 */
export const checkAuthCookies = (): void => {
  if (typeof document === 'undefined') return;
  
  const authCookieNames = [
    'next-auth.session-token',
    'next-auth.jwt-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    'auth-token',
    'session-token',
    'jwt-token'
  ];
  
  console.log('🔍 Checking for auth cookies:');
  authCookieNames.forEach(cookieName => {
    const exists = document.cookie.includes(cookieName);
    console.log(`  ${exists ? '✅' : '❌'} ${cookieName}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  });
}

/**
 * Test cookie clearing functionality
 */
export const testCookieClearing = (): void => {
  console.log('🧪 Testing cookie clearing...');
  
  // List cookies before
  console.log('📋 Before clearing:');
  listAllCookies();
  checkAuthCookies();
  
  // Import and use clearAuthCookies
  import('./auth').then(({ clearAuthCookies }) => {
    clearAuthCookies();
    
    // Wait a bit then check again
    setTimeout(() => {
      console.log('📋 After clearing:');
      listAllCookies();
      checkAuthCookies();
    }, 200);
  });
}

/**
 * Create a test cookie for testing purposes
 */
export const createTestCookie = (name: string, value: string): void => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=${value}; path=/; max-age=3600; samesite=lax`;
  console.log(`🍪 Created test cookie: ${name}=${value}`);
}

/**
 * Remove a specific cookie with detailed logging
 */
export const removeCookieWithLogging = (name: string): void => {
  if (typeof document === 'undefined') return;
  
  console.log(`🗑️ Attempting to remove cookie: ${name}`);
  
  const before = document.cookie.includes(name);
  console.log(`  Before removal: ${before ? 'EXISTS' : 'NOT FOUND'}`);
  
  // Try multiple removal strategies
  const hostname = window.location.hostname;
  const strategies = [
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`,
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`,
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}; samesite=lax;`,
  ];
  
  strategies.forEach((strategy, index) => {
    document.cookie = strategy;
    console.log(`  Strategy ${index + 1}: ${strategy}`);
  });
  
  setTimeout(() => {
    const after = document.cookie.includes(name);
    console.log(`  After removal: ${after ? 'STILL EXISTS' : 'REMOVED'}`);
  }, 100);
}
