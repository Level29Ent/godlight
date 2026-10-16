import { betterAuth } from 'better-auth'
import { anonymous } from 'better-auth/plugins'
import { and, eq, inArray } from 'drizzle-orm'
import { db, pool } from '@/lib/db'
import { gameSave } from '@/lib/db/schema'

async function moveGuestSaves(fromUserId: string, toUserId: string) {
  const taken = await db.select({ slot: gameSave.slot }).from(gameSave).where(eq(gameSave.userId, toUserId))
  const takenSlots = new Set(taken.map((r) => r.slot))
  const guest = await db.select({ slot: gameSave.slot }).from(gameSave).where(eq(gameSave.userId, fromUserId))
  const movable = guest.map((r) => r.slot).filter((s) => !takenSlots.has(s))
  if (movable.length > 0) {
    await db
      .update(gameSave)
      .set({ userId: toUserId })
      .where(and(eq(gameSave.userId, fromUserId), inArray(gameSave.slot, movable)))
  }
  await db.delete(gameSave).where(eq(gameSave.userId, fromUserId))
}

export const auth = betterAuth({
  database: pool,
  plugins: [
    anonymous({
      generateName: () => 'Guest God',
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await moveGuestSaves(anonymousUser.user.id, newUser.user.id)
      },
    }),
  ],
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
