'use client'

import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [anonymousClient()],
})
export const { signIn, signUp, signOut, useSession } = authClient

let guestRequest: Promise<unknown> | null = null

/** Creates a passwordless guest profile once; safe to call repeatedly. */
export function ensureGuest() {
  guestRequest ??= signIn.anonymous().finally(() => {
    guestRequest = null
  })
  return guestRequest
}
