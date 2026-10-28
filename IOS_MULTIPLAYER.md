# Divine Duels: first playable multiplayer slice

Divine Duels adds an invite-only five-round hidden-choice contest at `/duels`.
It is separate from single-player progression: existing rewarded faith, boosts,
and Supporter purchases cannot change duel scores. It is not realtime shared-planet
multiplayer, matchmaking, a ranked economy, or a finished App Store release.

## Backend rollout

1. Back up the existing Postgres database and run `scripts/duels.sql` against
   the same database used by `DATABASE_URL`. No new service or secret is needed.
2. Deploy the PR only after the migration. The single-player game remains available
   if the table has not yet been created, but duels will fail.
3. Periodically run the cleanup query in that file. Rooms expire after 24 hours;
   each account may host at most five unfinished, unexpired duels.

Sessions use the existing Better Auth guest/account flow. Invite codes are bearer
invitations: share privately. Server actions authenticate every operation, lock a
room row during move resolution, and do not return unrevealed choices or user IDs.
There are no durable wallets or competitive rewards. Account-level room caps are
not a substitute for abuse protection against people creating multiple accounts.
Guest account linking does not migrate duel membership; finish a duel before
changing accounts. Deleting either participant account deletes the duel via
foreign-key cascade; expired-room cleanup removes other retained rooms.

## Device acceptance checks (required before shipping)

- Open two separate sessions on two devices. Create on A, join on B, and verify A
  cannot take both seats; a third session cannot read or join the occupied room.
- Lock a move on A. Confirm the network response on B reveals no opponent move.
- Submit both moves at once: only one round resolves. Resend the old round or
  double-tap: no additional points or rounds may be awarded.
- Complete five rounds, including ties; confirm both clients see mirrored scores
  and the same winner. Further moves must fail.
- Refresh mid-round and rejoin with the invite code; confirm your seat and locked
  choice persist. Test background/resume and network loss on an actual iPhone.
- Confirm ads and solo-game boosts never affect scores.

## iOS and AdMob

The existing Capacitor shell loads `https://godlight.app`; `/duels` ships with that
web app. Use the repository's `pnpm ios` workflow on macOS with Xcode, signing,
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
no-fill, cancellation, and reward completion on-device before release. The duel
screen deliberately has no ads during a match; existing optional rewards remain
in the solo game. Competitive rewards would require server-side reward verification
and stronger abuse controls, not trusting a client callback.

References:
- https://developers.google.com/admob/ios/rewarded
- https://developers.google.com/admob/ios/test-ads

## Local checks

`node --experimental-strip-types --test tests/duels.test.mjs` checks all power
pairings and invalid input. `pnpm exec tsc --noEmit` checks TypeScript.
These do not replace two-session Postgres integration tests or iOS acceptance.

### Validation at implementation time

- Rule tests pass (2 tests, all nine power pairings covered).
- Full TypeScript validation reports three errors in the pre-existing root
  `hud.tsx`: the `bounty` tool mapping and the `night`/`auroraTimer` state fields.
  The same errors were reproduced on unchanged `main`.
- Production compilation and static-page generation complete, but the installed
  Next.js 16.4.0 build exits with `SecurityFatalError` reporting a known security
  vulnerability. Upgrade the affected dependency before release. The repository
  already skips TypeScript build errors; this change does not alter that setting.
- No production environment values were loaded; local auth initialization also
  warns about missing production auth URL/secret configuration.
- Database migration, concurrent two-session gameplay, browser rendering, iPhone
  execution, AdMob consent/rewards, and App Store submission remain unverified.
