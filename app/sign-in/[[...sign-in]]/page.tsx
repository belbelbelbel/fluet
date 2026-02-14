'use client'

import { SignIn, useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function SignInForm() {
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded } = useUser()
  const [redirecting, setRedirecting] = useState(false)
  
  // Get redirect URL from search params
  const rawRedirectUrl = searchParams.get('redirect_url') || '/dashboard'
  let redirectUrl = '/dashboard'
  
  if (rawRedirectUrl) {
    try {
      const decoded = decodeURIComponent(rawRedirectUrl)
      if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes('sign-in')) {
        redirectUrl = decoded
      }
    } catch (e) {
      redirectUrl = '/dashboard'
    }
  }

  // Auto-redirect if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && !redirecting) {
      setRedirecting(true)
      // Small delay to show the redirecting message
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 500)
    }
  }, [isLoaded, isSignedIn, redirectUrl, redirecting])

  // Show redirecting message if user is signed in
  if (isLoaded && isSignedIn) {
    return (
      <div className='flex justify-center min-h-screen items-center bg-white dark:bg-slate-900'>
        <div className='text-center'>
          <div className='w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // Just render SignIn - middleware will handle redirects for authenticated users
  return (
    <div className='flex justify-center min-h-screen items-center bg-white dark:bg-slate-900 py-12 px-4'>
      <div className='w-full max-w-md'>
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
              formButtonPrimary: 'bg-purple-600 hover:bg-purple-700 normal-case text-sm',
              headerTitle: 'text-gray-900 dark:text-white',
              headerSubtitle: 'text-gray-600 dark:text-gray-400',
              socialButtonsBlockButton: 'border-gray-300 dark:border-gray-700',
              formFieldInput: 'border-gray-300 dark:border-gray-700',
              footerActionLink: 'text-purple-600 hover:text-purple-700',
            },
            baseTheme: undefined,
          }}
        />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className='flex justify-center min-h-screen items-center bg-white dark:bg-slate-900'>
        <div className='text-center'>
          <div className='w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
