# Village Improvements

This expansion adds two paid improvement tiers to existing houses, farms and wells. Access them through Worldbook → World health → Village improvements or by inspecting an eligible building. No new screen-edge triggers are added; the responsive dock is unchanged.

## Rules

- Tier 1 requires Age of Clay and takes 20 simulation seconds. Tier 2 requires Age of Bronze and takes 35 seconds.
- Per-tier prices are paid once, upfront. Tier 1 costs 25 faith plus: house 12 timber/8 stone, farm 10/6, well 8/12. Tier 2 doubles those costs (50 faith plus doubled materials).
- Buildings must be finished, alive and not burning. Only one improvement per site can run at once; different sites work independently. Missing resources, age locks, duplicate work, destroyed/missing sites, unsupported buildings, photo mode and game-over reject before charging.
- Local craftspeople perform timed improvements; no existing worker jobs are reassigned and a free follower is not required. Services continue at the current tier while improving. New benefits apply only on completion. Timers pause when the game is paused or the building burns, continue during colony visits and resume from saved remaining time.
- There is no cancellation/refund or instant healing. Destruction removes the site's improvements and any paid work with it. Building count and original objective indexes do not change.

## Benefits

- **Expanded homes:** +2 housing per completed tier. A house provides 3/5/7 housing at tier 0/1/2, in addition to the world's unchanged base and temple capacity.
- **Terraced fields:** +20% crop-growth rate per completed tier (1×/1.2×/1.4×), composing with existing climate/relic factors. Farms still require moisture and do not get an instant harvest or free water.
- **Irrigation channels:** well irrigation radius 2.2/2.6/3.0 units and moisture rate 0.05/0.065/0.08 per second. This only changes nearby farm irrigation, not follower care or tree-growth radii.

Small green/gold site pillars indicate completed tiers; a blue work ring indicates an improvement underway. These are procedural markers, not a complete building-art redesign. Inspection shows tier, costs, timer, fire interruption and rules. Commissioning and completion appear in the bounded story journal.

## Saves and limits

Each building gets an optional `u` extension containing completed level and remaining work time. Older saves remain tier 0. Restore clamps levels to 0–2, timers to the tier's normal duration, discards non-finite values and strips work from unfinished/unsupported sites. Data is copied rather than aliased. Original save version, device recovery banks and challenge isolation remain unchanged. No services, packages or environment variables are added.

Model tests cover gating/charges, one-time completion, caps, fire/pause/destruction, actual housing/crop/irrigation effects, old/malformed saves, timer round trips, photo restrictions, journal deduplication and colony-visit/game-over behavior. Long-term balance, marker appearance, responsive card scrolling and tap interactions require preview/device playtesting; passing tests/build do not establish visual correctness.
