'use client'

import { useEffect } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { normalizeRedirectPath } from '@/lib/auth-redirect'

function ClearSessionInner() {
  const { signOut } = useClerk()
  const searchParams = useSearchParams()
  const redirectUrl = normalizeRedirectPath(searchParams.get('redirect_url'))
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`

  useEffect(() => {
    // signOut() revokes the session and resets __client server-side, while
    // preserving the __clerk_db_jwt dev browser token. Manually deleting
    // cookies on top of it breaks the next sign-in handshake.
    const clearEverything = async () => {
      if (typeof window === 'undefined') return

      try {
        await signOut()
      } catch {
        // still send them to sign-in
      }

      window.location.replace(signInHref)
    }

    clearEverything()
  }, [signOut, signInHref])

  return <div className="min-h-dvh bg-background" aria-hidden />
}

export default function ClearSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" aria-hidden />}>
      <ClearSessionInner />
    </Suspense>
  )
}
