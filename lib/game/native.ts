import { Capacitor } from '@capacitor/core'
import type { SfxName } from './audio'

type Impact = 'light' | 'medium' | 'heavy'
type Pattern = { kind: 'impact'; style: Impact } | { kind: 'notify'; type: 'success' | 'warning' | 'error' }

const HAPTICS: Partial<Record<SfxName, Pattern>> = {
  select: { kind: 'impact', style: 'light' },
  poke: { kind: 'impact', style: 'light' },
  chop: { kind: 'impact', style: 'light' },
  assign: { kind: 'impact', style: 'light' },
  tether: { kind: 'impact', style: 'light' },
  build: { kind: 'impact', style: 'medium' },
  zap: { kind: 'impact', style: 'medium' },
  alienHit: { kind: 'impact', style: 'medium' },
  thunder: { kind: 'impact', style: 'heavy' },
  quake: { kind: 'impact', style: 'heavy' },
  meteorImpact: { kind: 'impact', style: 'heavy' },
  ufoExplode: { kind: 'impact', style: 'heavy' },
  complete: { kind: 'notify', type: 'success' },
  objective: { kind: 'notify', type: 'success' },
  ageUp: { kind: 'notify', type: 'success' },
  challengeWon: { kind: 'notify', type: 'success' },
  challengeLost: { kind: 'notify', type: 'warning' },
  death: { kind: 'notify', type: 'warning' },
  error: { kind: 'notify', type: 'error' },
}

const MIN_HAPTIC_GAP_MS = 60
const RETURN_REMINDER_ID = 1001
const RETURN_REMINDER_DELAY_MS = 6 * 60 * 60 * 1000

let lastHapticAt = 0
let initialized = false

export const isNativeApp = () => Capacitor.isNativePlatform()

export function haptic(name: SfxName) {
  if (!isNativeApp()) return
  const pattern = HAPTICS[name]
  if (!pattern) return
  const now = Date.now()
  if (now - lastHapticAt < MIN_HAPTIC_GAP_MS) return
  lastHapticAt = now

  void import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle, NotificationType }) => {
      if (pattern.kind === 'impact') {
        const style = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }[pattern.style]
        return Haptics.impact({ style })
      }
      const type = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      }[pattern.type]
      return Haptics.notification({ type })
    })
    .catch(() => {})
}

async function scheduleReturnReminder() {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const { display } = await LocalNotifications.checkPermissions()
  if (display !== 'granted') return
  await LocalNotifications.cancel({ notifications: [{ id: RETURN_REMINDER_ID }] })
  await LocalNotifications.schedule({
    notifications: [
      {
        id: RETURN_REMINDER_ID,
        title: 'Your followers are praying',
        body: 'Faith has been gathering while you were away. Return and shine upon your world.',
        schedule: { at: new Date(Date.now() + RETURN_REMINDER_DELAY_MS), allowWhileIdle: true },
      },
    ],
  })
}

async function cancelReturnReminder() {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.cancel({ notifications: [{ id: RETURN_REMINDER_ID }] })
}

export function requestNotificationPermission() {
  if (!isNativeApp()) return
  void import('@capacitor/local-notifications')
    .then(async ({ LocalNotifications }) => {
      const { display } = await LocalNotifications.checkPermissions()
      if (display === 'prompt' || display === 'prompt-with-rationale') {
        await LocalNotifications.requestPermissions()
      }
    })
    .catch(() => {})
}

export function initNativeApp() {
  if (initialized || !isNativeApp()) return
  initialized = true

  void import('@capacitor/app')
    .then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        const task = isActive ? cancelReturnReminder() : scheduleReturnReminder()
        task.catch(() => {})
      })

      if (Capacitor.getPlatform() === 'android') {
        App.addListener('backButton', () => {
          void App.minimizeApp()
        })
      }
    })
    .catch(() => {})
}
