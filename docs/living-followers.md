# Living Followers

This update adds six connected systems to the existing solo home world, without changing original objective indexes or adding services/dependencies.

## Followers and requests

Follower IDs deterministically produce names and one of four traits, retained across existing saves. Devout followers generate 15% more prayer faith; industrious followers advance assigned gathering/attack work 15% faster. Gentle followers are more sensitive to a dreaded ruler; bold followers produce 20% more prayer faith under dread. The Worldbook lists living followers and focuses the camera on a chosen person.

At 20 seconds, then at most every 45 seconds, an available follower may request sunlight, work, or farm rain. At most three requests exist. They expire after 90 seconds of simulation, without a penalty. Two seconds of nearby sunlight, an assigned job, or two seconds of rain on a completed farm answer the corresponding request. A response grants 6 faith and 12 happiness once. Bubbles are limited to the visible side of the home planet. Requests are also readable in the Worldbook; no precision click on a bubble is necessary.

## Guided opening

New worlds have five milestones: sunlight, farm rain, an assigned job, gathered resources, then a second completed house. They grant small one-time faith rewards independently of existing objectives. The guide can be hidden and restored from the Worldbook. Established saves without this extension skip the opening rewards rather than granting a retrospective payout. This is contextual guidance, not an input-locking tutorial or a promise that every player finishes in exactly five minutes.

## Civilization and divine choices

Each age changes robes and house details: paths at Clay, annexes at Bronze, solar roofs at Iron, luminous halos at Gold and floating crystals at Stars. An age advance triggers a short follower jump and happiness celebration. These are cosmetic changes, not extra production buildings or a connected road/pathfinding network.

The existing alignment meter now also affects daily behavior. At +25 alignment, followers regain an additional 0.2 happiness/second. At -25, prayer decisions become 10 percentage points more likely and bold prayer faith rises, but gentle followers lose an extra 0.45 happiness/second and others lose 0.15. Peaceful/dreaded cultures alter robe colors and building symbols. An existing permanent commandment retains visual priority and its original mechanics; alignment itself can still move.

## Miracle combinations

- **Sunshower:** channel rain for at least 2 seconds, then use sun within 12 seconds and 1.3 world units, near a completed farm. Nearby farms gain 30% growth, capped below an instant harvest.
- **Thunderstorm:** the same rain preparation followed by a successful paid Lightning cast. Aliens within 1.8 units take 35 extra damage; followers in that area lose 15 happiness and panic for at least 4 seconds. This is dangerous, not a free protective miracle.

Both share a 30-second cooldown. Normal Lightning unlocks/costs still apply. Recipes are always explained in the Worldbook; discoveries are recorded. A save does not preserve a partially channeled combo.

## Cosmetics and photos

Twilight sky unlocks at Clay, ocean dusk and jade/rose-quartz walls at Bronze, rings at Iron and a moon at Gold. Defaults remain available. Selection is age-checked in both the UI and state setter and persists per world. Cosmetics do not cost resources or influence physics.

Photo mode pauses simulation, hides gameplay UI and allows mouse/touch orbit and zoom. Exit with the visible control or Escape. PNG export explicitly renders the scene before capture, without a permanently preserved drawing buffer. Export excludes HTML UI and postprocessing. It requests a browser download; browser/native download support is not guaranteed, so failure messaging offers device screenshots. There is no screenshot upload, account feed, sharing backend or storage permission request.

## Save compatibility and limits

The optional `living` extension retains save version 1. It stores opening progress, answered count, known combinations and cosmetic selections. It validates enums, clamps values, restricts selections to the saved age, copies collections and ignores unknown values. Active requests and gesture memory restart on load; there is no offline request/deadline simulation. Photo mode is session-only. Existing follower IDs, objectives, accounts and colony data are unchanged.

Simulation and save tests cover requests/rewards/expiry, traits, opening migration, combination locality/timing/cooldown, real input integration, age celebrations, cosmetic bounds/round trips and photo-mode pause/input safety. UI, PNG-download behavior and physical-device performance require a working preview/browser and native-device checks; unit tests do not establish those outcomes.
