# Godlight solo iOS release notes

Godlight is a solo planet-tending game. Challenges, objectives, compact menus,
authentication, cloud saves and optional AdMob rewards remain available.

## Removal of the former multiplayer mode

The Divine Duels title-screen entry, `/duels` page, server actions, rules, tests,
and unused installation SQL have been removed. Old `/duels` links return 404 after
deployment. No multiplayer database migration is needed for this version.

No database data is deleted by this change. If an earlier release created the
`divine_duel` table, it is left unused; review retention and back up any needed
records before separately approving database cleanup. Existing solo saves are
unaffected.

## iOS and AdMob

The existing Capacitor shell loads the solo game from `https://godlight.app`. Use the repository's `pnpm ios` workflow on macOS with Xcode, signing,
and your Apple developer account. Native build/device verification has not been
performed in the Linux coding environment.

The repository currently uses Google's sample iOS AdMob application ID in
`ios/App/App/Info.plist`. Keep sample IDs for development. Before monetized release,
replace that with your own AdMob iOS application ID, set
`NEXT_PUBLIC_ADMOB_REWARDED_IOS` to your own rewarded ad unit ID, rebuild the web app,
and sync/rebuild the native app. These are identifiers, not guarantees of ad fill
or earnings. Do not click live ads while testing.

Complete the AdMob consent/privacy configuration, privacy policy and App Store
privacy declarations for the actual data collected. Verify consent, denied ATT,
no-fill, cancellation, and reward completion on-device before release.
Existing optional solo rewards and the consent check remain unchanged.

References:
- https://developers.google.com/admob/ios/rewarded
- https://developers.google.com/admob/ios/test-ads

## Local validation and outstanding release checks

Run `node --experimental-strip-types --test tests/*.test.mjs` and
`pnpm exec tsc --noEmit`. Known existing root `hud.tsx` TypeScript errors and the
previous Next.js security warning need resolution before release. Browser and
native iPhone verification remain required; removing multiplayer does not resolve
those earlier release blockers.

## Gameplay and compact HUD follow-up

- World age, population, materials, happiness, saves, gifts and audio controls are
  inside the collapsed **World & settings** disclosure. Faith remains visible.
- Tasks are collapsed on desktop as well as mobile. The compact task button keeps
  current-objective progress and any active challenge countdown visible.
- The bottom power bar is replaced by a **Choose power** picker with a scrollable
  four-column grid. Selecting a power closes the picker and restores toggle focus.
  Escape closes task/power pickers; existing numeric power shortcuts still work.
- Three recurring challenges join the existing random rotation after the tutorial:
  Timber Trail (+12 net wood in 90s, 45 faith), Stonekeepers (+8 net stone in 90s,
  45 faith), and Raise the Roof (finish an existing site in 100s, 60 faith).
  Spending materials reduces stockpile-task progress. Construction requires an
  unfinished site at challenge creation and cannot be satisfied with a later site.
- Five objectives extend the original progression: wood and stone reserves,
  20 harvests, three temples, and ten challenge victories. Existing objective
  indexes stay unchanged for saved-game compatibility.

Local checks: three task tests cover stockpile baselines,
construction-site eligibility, new objective targets and original objective order.
Visual/browser and iPhone touch checks are not performed in this environment.
Before merging, check 320px/390px portrait and short landscape viewports: closed
menus should leave the planet clear; open every menu, scroll all powers/settings,
select a power, use Escape/Tab, save/load, and confirm touch input over panels does
not trigger powers on the planet. Complete each new challenge and verify only one
faith reward is paid; reload an older save and confirm the next objective is intact.
