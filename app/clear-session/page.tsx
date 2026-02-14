'use client'

import { useEffect, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { clearClerkCookies } from '@/utils/clear-clerk-cookies'

export default function ClearSessionPage() {
  const { signOut } = useClerk()
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    // Aggressively clear everything
    const clearEverything = async () => {
      if (typeof window === 'undefined') return

      try {
        // First, try to sign out via Clerk API
        try {
          await signOut()
        } catch (e) {
          // If signOut fails, continue anyway
          console.warn('Sign out failed, continuing with manual clear:', e)
        }
      } catch (e) {
        console.warn('Error during sign out:', e)
      }

      // Clear all cookies
      clearClerkCookies()
      
      // Clear all storage
      try {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear IndexedDB (Clerk might use it)
        if ('indexedDB' in window) {
          indexedDB.databases().then(databases => {
            databases.forEach(db => {
              if (db.name) {
                indexedDB.deleteDatabase(db.name)
              }
            })
          })
        }
      } catch (e) {
        console.warn('Could not clear storage:', e)
      }

      setCleared(true)
      
      // Wait a bit longer to ensure everything is cleared
      // Then redirect to sign-in with NO query params to prevent loops
      setTimeout(() => {
        // Force a hard navigation - this clears everything
        window.location.replace('/sign-in')
      }, 1500)
    }

    clearEverything()
  }, [signOut])

  return (
    <div className='flex justify-center min-h-screen items-center bg-white dark:bg-slate-900'>
      <div className='text-center max-w-md px-4'>
        <div className='w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
          {cleared ? 'Session Cleared!' : 'Clearing Session...'}
        </h2>
        <p className='text-gray-600 dark:text-gray-400 mb-4'>
          {cleared 
            ? 'Redirecting to sign-in page...' 
            : 'Removing all cookies and cached data...'}
        </p>
        {cleared && (
          <p className='text-sm text-gray-500 dark:text-gray-500'>
            If you're not redirected automatically, <a href="/sign-in" className='text-purple-600 hover:text-purple-700 underline'>click here</a>
          </p>
        )}
      </div>
    </div>
  )
}
