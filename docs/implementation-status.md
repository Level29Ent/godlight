# Godlight expansion: implementation status

## This PR: playable, offline-capable foundation

- Stylized solar-system background: sun, eight planets and Saturn's rings; procedural geometry with no texture downloads, hit targets, shadows or extra lights.
- Keep shader-warmup materials alive after hiding them. Previously unmounting disposed the resources intended to prevent first-use hitches. Physical-device profiling is still required; no locked-60fps claim is made.
- Resolve committed merge conflicts while preserving all tool IDs, six ages, the append-only objective sequence covered by the existing tests, compact expandable power/quest controls and advertising consent checks.
- Restore the server-capable Next.js build; static export cannot host the existing authentication routes and cloud-save Server Actions. Patch Next.js to 16.4.5.
- Generate a self-contained Workbox worker from the exact build's JS, CSS and fonts. Precache the public `/` game shell and offline assets. No API, auth, Server Action or RSC runtime caching. New workers wait rather than replacing a running game's build. A first successful online install is required.
- Device autosave every 15 seconds and on background/page exit, with an explicit restore button. Cloud saves remain separate and require network/authentication. Browser storage can be unavailable, evicted or cleared.
- Lazy-load the cloud-save dialog separately from autosave and title controls.
- Battery saver: lower DPR, fewer stars, no postprocessing or shadows, demand-driven rendering at about 30fps. Pause rendering when hidden. Clear held gestures when the window loses focus.
- React/simulation/graphics-loss fallbacks, plus bounded device-session diagnostic codes. No remote error-reporting provider is connected.
- Global keyboard-focus rings, zoomable viewport, scrollable power/quest controls, labelled and disabled locked powers, reduced-motion CSS.
- Integrity lint, TypeScript, unit tests and production-build scripts, plus a separately supplied GitHub Actions workflow that must be added manually (this publishing connection cannot write workflow files). **Checks alone do not enforce branch protection or prevent a manual production deployment.** Repository rules must require the checks before merging.

## Already present; not newly implemented by this PR

Web Audio synthesis/music and chimes, inertial spherical drag and pinch zoom, faith/prayer economy, six civilization ages, fear bonuses, rain/sun/grove/blessing/bounty/quake/meteor/tornado/aurora powers, resource and construction tasks, random challenges, day/night cycle, clouds, farms/wells/temples/monuments in simulation, instanced trees/followers, Better Auth accounts/guest linking, Postgres cloud saves and native RevenueCat/AdMob/local reminders.

These are not substitutes for the more advanced requested designs below.

## Product decisions required for the remaining roadmap

1. **Commerce:** keep the existing native RevenueCat entitlement and add Stripe only for the web? Define prices, currencies, tier benefits, cancellations/refunds and entitlement ownership before adding Checkout, Billing Portal or webhook processing. There is no existing Stripe route to “upgrade.” A production implementation needs signature validation, durable event-ID deduplication, transactional entitlement updates, out-of-order-event handling and non-2xx responses on retryable failures; it must never grant access based on the redirect URL. No Stripe credentials or products were configured here.
2. **Accounts/community/multiplayer:** retain the existing Better Auth/Postgres stack, or migrate to Supabase/Firebase? Retaining it avoids breaking current accounts and saves. Define moderation, profile privacy, avatar upload limits, deletion/export retention, abuse controls and authoritative trade/raid rules. The last merged product change removed multiplayer, so the newly requested trading/raids need a fresh server-authoritative design rather than restoring the old prototype. Community feeds, profiles/avatars/badges, trading, visits, raids and realtime synchronization are not implemented in this PR.
3. **Push:** choose an FCM project and consent model, token storage/deletion and who may send targeted messages. Existing local reminders are not FCM push. Credentials must be configured directly in the service/project settings, never posted in chat.
4. **Gameplay release:** choose the next coherent playable milestone: (a) prayer bubbles, alignment and miracle combinations; (b) wildlife, climate/season survival, biome terraforming, custom skies/rings/moons; or (c) wonders, prophets, pantheon trees, relic excavation, advanced eras, cosmic shields/events and mandates. These new systems need save-version migration and balancing; they are not added by this stability PR.
5. **Presentation/tools:** theme-wide daylight mode, search/filter/autocomplete, photo/cinematic mode, customized planets, personal activity charts, CSV/PDF export, new XP/ranks and spatial audio remain separate implementation work, not hidden behind placeholder buttons.

## External configuration and verification still needed

- **Cloudflare:** godlight.app uses Cloudflare nameservers. This PR changes only application response headers; it does not alter Cloudflare rules or DNS. Avoid shared caches for user-specific API/auth/save responses. Immutable Next.js chunks already carry framework-managed caching; do not apply year-long immutable caching to replaceable public filenames.
- **Native/offline:** the current Capacitor shell loads https://godlight.app. Browser Workbox caching is not a guarantee of offline WKWebView/native behavior. Truly bundled native offline gameplay requires a separate local web build and an online API/auth strategy. PWABuilder packaging, APNs/FCM provisioning, native builds, store validation and real iOS/Android profiling were not performed. No speculative AppDelegate FPS flags were added.
- **Assets:** the game world is procedural, not PNG/JPEG terrain textures. Existing marketing screenshots are already WebP. Retain PNG installation icons for compatibility. KTX2 requires real texture inputs, transcoder delivery and GPU fallbacks; no KTX2 conversion pipeline is claimed.
- **Observability:** diagnostics currently remain in sessionStorage (`godlight-diagnostics-v1`) with timestamps and source codes only. Select a reporting provider/retention policy before connecting remote crash telemetry.
- **CI enforcement:** first add the separately supplied workflow at `.github/workflows/checks.yml`, then require the `checks` job on the production branch. Preview deployments may build concurrently with Actions; this PR does not pretend to gate Vercel deployment scheduling.
