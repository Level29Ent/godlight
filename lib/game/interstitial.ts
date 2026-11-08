export const IOS_INTERSTITIAL_UNIT = 'ca-app-pub-9730543201329278/6555046817'
export const IOS_TEST_INTERSTITIAL_UNIT = 'ca-app-pub-3940256099942544/4411468910'
export const INTERSTITIAL_COOLDOWN_MS = 4 * 60 * 1000
const MAX_READY_AGE_MS = 55 * 60 * 1000

interface Handle { remove(): Promise<void> }
export interface InterstitialBridge {
  prepare(adId: string, test: boolean): Promise<unknown>
  show(): Promise<void>
  listen(event: 'dismissed' | 'failed' | 'showed', callback: () => void): Promise<Handle>
}
export function createInterstitialController(bridge: InterstitialBridge, options: {
  allowed(): boolean; test: boolean; now(): number; pause(active: boolean): void
}) {
  let readyAt: number | null = null
  let loading = false, busy = false
  const createdAt = options.now()
  let lastShown = createdAt
  async function preload() {
    if (!options.allowed() || loading || busy || readyAt !== null) return
    loading = true
    try {
      await bridge.prepare(options.test ? IOS_TEST_INTERSTITIAL_UNIT : IOS_INTERSTITIAL_UNIT, options.test)
      if (options.allowed()) readyAt = options.now()
    } catch { readyAt = null }
    finally { loading = false }
  }
  async function atBreak(): Promise<boolean> {
    if (!options.allowed() || busy || readyAt === null || options.now() - lastShown < INTERSTITIAL_COOLDOWN_MS) return false
    if (options.now() - readyAt > MAX_READY_AGE_MS) { readyAt = null; void preload(); return false }
    busy = true
    readyAt = null
    const handles: Handle[] = []
    let shown = false
    try {
      let finish!: () => void
      const closed = new Promise<void>(resolve => { finish = resolve })
      // Await all registrations before show; even a partial setup is cleaned up on failure.
      handles.push(await bridge.listen('dismissed', finish))
      handles.push(await bridge.listen('failed', finish))
      handles.push(await bridge.listen('showed', () => { shown = true; lastShown = options.now() }))
      if (!options.allowed()) return false
      options.pause(true)
      await bridge.show()
      await closed
      return shown
    } catch { return false }
    finally {
      for (const h of handles) await h.remove().catch(() => {})
      options.pause(false)
      busy = false
      // Load failures/no-fill never block restarting and don't trigger surprise late ads.
      void preload()
    }
  }
  return { preload, atBreak }
}
