import { useSyncExternalStore } from 'react'
import { Capacitor } from '@capacitor/core'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { grantBoost, grantFaith, say, setPaused, state } from './store'
import { sfx } from './audio'

export const SUPPORTER_ENTITLEMENT = 'supporter'
export const AD_COOLDOWN_MS = 4 * 60 * 1000
export const BOOST_SECONDS = 10 * 60

const LAST_REWARD_KEY = 'godlight:last-reward-at'
const SUPPORTER_CACHE_KEY = 'godlight:supporter'

// Google's official sample IDs serve test ads until real AdMob unit IDs are provided.
const TEST_REWARDED_UNIT = {
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
}

const ENV = {
  rewarded: {
    ios: process.env.NEXT_PUBLIC_ADMOB_REWARDED_IOS,
    android: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ANDROID,
  },
  revenueCat: {
    ios: process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY,
  },
}

export type RewardKind = 'faith' | 'boost'

interface MonetizationState {
  native: boolean
  adsReady: boolean
  storeReady: boolean
  supporter: boolean
  busy: 'ad' | 'purchase' | 'restore' | null
  lastRewardAt: number
  price: string | null
}

const platform = (): 'ios' | 'android' | 'web' => {
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android' ? p : 'web'
}

const readNumber = (key: string) => {
  if (typeof window === 'undefined') return 0
  return Number(window.localStorage.getItem(key)) || 0
}

let snapshot: MonetizationState = {
  native: false,
  adsReady: false,
  storeReady: false,
  supporter: false,
  busy: null,
  lastRewardAt: 0,
  price: null,
}
const listeners = new Set<() => void>()
let initialized = false
let supporterPackage: PurchasesPackage | null = null

function update(patch: Partial<MonetizationState>) {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((l) => l())
}

export function isSupporter() {
  return snapshot.supporter
}

export function useMonetization() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snapshot,
    () => snapshot,
  )
}

function setSupporter(value: boolean) {
  if (value === snapshot.supporter) return
  window.localStorage.setItem(SUPPORTER_CACHE_KEY, value ? '1' : '0')
  update({ supporter: value })
}

async function initAds() {
  const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob')
  let consent = await AdMob.requestConsentInfo()
  if (consent.status === AdmobConsentStatus.REQUIRED && consent.isConsentFormAvailable) {
    consent = await AdMob.showConsentForm()
  }
  if (!consent.canRequestAds) return

  await AdMob.initialize()
  if (platform() === 'ios') {
    const { status } = await AdMob.trackingAuthorizationStatus()
    if (status === 'notDetermined') await AdMob.requestTrackingAuthorization()
  }
  update({ adsReady: true })
}

async function initStore() {
  const p = platform()
  const apiKey = p === 'web' ? undefined : ENV.revenueCat[p]
  if (!apiKey) return

  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  await Purchases.configure({ apiKey })
  await Purchases.addCustomerInfoUpdateListener((info) => {
    setSupporter(!!info.entitlements.active[SUPPORTER_ENTITLEMENT])
  })

  const { customerInfo } = await Purchases.getCustomerInfo()
  setSupporter(!!customerInfo.entitlements.active[SUPPORTER_ENTITLEMENT])

  const offerings = await Purchases.getOfferings()
  supporterPackage = offerings.current?.lifetime ?? offerings.current?.availablePackages[0] ?? null
  update({ storeReady: !!supporterPackage, price: supporterPackage?.product.priceString ?? null })
}

export function initMonetization() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const native = Capacitor.isNativePlatform()
  update({
    native,
    lastRewardAt: readNumber(LAST_REWARD_KEY),
    supporter: native && window.localStorage.getItem(SUPPORTER_CACHE_KEY) === '1',
  })
  if (!native) return
  initAds().catch(() => update({ adsReady: false }))
  initStore().catch(() => update({ storeReady: false }))
}

function applyReward(kind: RewardKind) {
  const now = Date.now()
  window.localStorage.setItem(LAST_REWARD_KEY, String(now))
  update({ lastRewardAt: now })
  if (kind === 'faith') {
    const amount = rewardFaithAmount()
    grantFaith(amount)
    say(`A gift from the heavens: +${amount} faith.`, 'good')
  } else {
    grantBoost(BOOST_SECONDS)
    say('Your followers pray with doubled fervor for 10 minutes.', 'good')
  }
  sfx('objective')
}

export function rewardFaithAmount() {
  return Math.round(Math.max(50, state.faithRate * 90) / 5) * 5
}

async function showRewardedAd(): Promise<boolean> {
  const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob')
  const p = platform() === 'ios' ? 'ios' : 'android'
  const realUnit = ENV.rewarded[p]
  let earned = false

  const handles = await Promise.all([
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      earned = true
    }),
  ])
  const closed = new Promise<void>((resolve) => {
    void AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve()).then((h) => handles.push(h))
    void AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => resolve()).then((h) => handles.push(h))
  })

  try {
    await AdMob.prepareRewardVideoAd({ adId: realUnit ?? TEST_REWARDED_UNIT[p], isTesting: !realUnit })
    await AdMob.showRewardVideoAd()
    await closed
  } finally {
    handles.forEach((h) => void h.remove())
  }
  return earned
}

export async function claimReward(kind: RewardKind) {
  if (snapshot.busy) return
  if (Date.now() - snapshot.lastRewardAt < AD_COOLDOWN_MS) return

  if (snapshot.supporter) {
    applyReward(kind)
    return
  }
  if (!snapshot.native || !snapshot.adsReady) return

  update({ busy: 'ad' })
  setPaused(true)
  try {
    const earned = await showRewardedAd()
    if (earned) applyReward(kind)
    else say('The vision faded before it finished. No gift this time.', 'info')
  } catch {
    say('No offerings are available right now. Try again soon.', 'info')
  } finally {
    setPaused(false)
    update({ busy: null })
  }
}

export async function buySupporterPack() {
  if (snapshot.busy || !supporterPackage) return
  update({ busy: 'purchase' })
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: supporterPackage })
    const active = !!customerInfo.entitlements.active[SUPPORTER_ENTITLEMENT]
    setSupporter(active)
    if (active) {
      sfx('ageUp')
      say('Thank you, Supporter. Your followers now shine with golden halos.', 'good')
    }
  } catch (error) {
    const cancelled = (error as { userCancelled?: boolean | null })?.userCancelled
    if (!cancelled) say('The purchase could not be completed. Please try again.', 'bad')
  } finally {
    update({ busy: null })
  }
}

export async function restorePurchases() {
  if (snapshot.busy || !snapshot.native) return
  update({ busy: 'restore' })
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.restorePurchases()
    const active = !!customerInfo.entitlements.active[SUPPORTER_ENTITLEMENT]
    setSupporter(active)
    say(active ? 'Supporter Pack restored.' : 'No previous purchases were found.', active ? 'good' : 'info')
  } catch {
    say('Could not reach the store to restore purchases.', 'bad')
  } finally {
    update({ busy: null })
  }
}
