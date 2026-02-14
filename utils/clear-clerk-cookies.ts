/**
 * Utility to clear all Clerk-related cookies
 * This fixes authentication issues in development
 */
export function clearClerkCookies() {
  if (typeof window === 'undefined') return

  // List of all possible Clerk cookie names
  const clerkCookiePatterns = [
    '__clerk_db_jwt',
    '__session',
    '__client',
    '__clerk_js_version',
    '__clerk_db_jwt_',
    '__session_',
    '__client_',
  ]

  // Get all cookies
  const allCookies = document.cookie.split(';')

  // Clear all cookies (including Clerk ones)
  allCookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    
    if (!name) return
    
    // Clear for various paths and domains
    const paths = ['/', '/sign-in', '/sign-up', '']
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      window.location.hostname.split('.').slice(-2).join('.'),
      '',
    ]

    paths.forEach(path => {
      domains.forEach(domain => {
        // Try multiple ways to clear
        if (domain) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; secure`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; secure; samesite=none`
        } else {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure`
        }
      })
    })
  })

  // Also clear specific Clerk cookies with all variations
  clerkCookiePatterns.forEach(cookieName => {
    const paths = ['/', '/sign-in', '/sign-up', '']
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      window.location.hostname.split('.').slice(-2).join('.'),
      '',
    ]

    paths.forEach(path => {
      domains.forEach(domain => {
        if (domain) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}; secure`
        } else {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure`
        }
      })
    })
  })

  // Clear localStorage and sessionStorage
  try {
    localStorage.clear()
    sessionStorage.clear()
    
    // Also clear specific Clerk keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('clerk') || key.includes('__clerk')) {
        localStorage.removeItem(key)
      }
    })
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('clerk') || key.includes('__clerk')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (e) {
    console.warn('Could not clear storage:', e)
  }
}
