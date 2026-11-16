# Chronicles & Ascension

This adds a bounded first implementation of five solo-game improvements. No new service, payment flow, leaderboard or multiplayer dependency is introduced.

## Follower story journal

Worldbook now contains up to 80 recent timestamped memories: founding followers, births, rain/fire rescues, answered prayers, losses, founding settlers, age changes, cosmic disasters and colony specialization completions. Favorite up to eight followers and filter by person or favorites, including remembered settlers and fallen followers. Favorites survive memory eviction, but older individual events roll off the bounded journal. Older saves receive an empty journal; events from earlier versions cannot be reconstructed.

## Colony differences and home rewards

All existing construction and shared-resource costs remain unchanged. Each colony adds its own pressure and objective:

- **Selene / Moonstone:** lose 0.12 integrity/sec until a habitat exists. Two habitats and 20 exported cargo unlock permanent home-building repair at 0.3 HP/sec, excluding burning buildings and capped at each building's maximum.
- **Aurelia / Sun crystal:** lose 0.18 integrity/sec until a farm exists. Two farms and 20 cargo unlock +10% home faith generation.
- **Thalassa / Tide pearl:** dinosaur approaches are 25% faster. Two turrets and 180 continuous seconds with at least 80 integrity unlock +0.015 moisture/sec for completed home farms. Losing integrity below 80 or dropping below two turrets resets the secure timer before completion.

Cargo accrues at population × 0.04 × integrity fraction per second only for settled, populated, functioning colonies. These are named specialization counters, not new tradable wallet currencies. Existing timber/stone exports continue unchanged. Rewards are earned automatically once, saved per world, and remain active after a later colony setback. Colony controls and Worldbook explain the rules.

## Celestial Ascension

Reach Age of Stars, answer 20 prayers, avert three cosmic disasters, finish three wonders and complete all three colony specializations. Worldbook then offers a one-time 1,000-faith Ascension. It preserves all population and progress, cheers followers, records a journal milestone and surrounds the home world with three luminous orbital arcs. This is an achievable endgame goal, not prestige/rebirth, a purchase or a reset.

## Separate challenge worlds

The title/in-game Challenges control opens a keyboard-accessible native dialog that pauses simulation while choosing. Escape or Close dismisses it and restores focus. It offers two fixed seeds:

- **The Long Drought (29401):** a 120-second initial drought and low farm moisture; survive at least 300 seconds and complete five harvests.
- **Gentle Hands (29402):** reach eight home followers with Sun, Rain, Touch and buildings. Paid miracle tools, cosmic shields and colony smites are blocked by simulation validation, not just hidden buttons.

Simulation randomness is a separate seeded stream, including initial population/resources and model events. Rendering/audio do not consume it. Same seeds reproduce starting model conditions; this is **not** a frame-perfect deterministic replay or competitive anti-cheat system. Frame cadence and player inputs still affect outcomes. The RNG checkpoint is restored with challenge saves, but pre-existing save serialization does not preserve every transient animation, pathfinding or AI timer.

### Save isolation and recovery

Normal device autosaves remain `godlight-world-v1`. Challenges write only `godlight-challenge-v1`; each bank rejects data marked for the other bank. A running normal world must be successfully backed up before challenge entry or resume; if browser storage is unavailable/full, entry is refused without changing the normal world. Starting fresh asks for confirmation because it replaces challenge progress. Gifts are hidden in challenges. Challenge game-over restart stays in the same scenario rather than silently creating a normal world.

Regular slot writes reject challenge payloads, and regular slot autosave skips challenge sessions. Challenges use their separate device autosave and explicit Save challenge & return to normal world control. Leaving restores your normal device snapshot directly without reloading; if none exists, returns to the title. Open Challenges to resume its separate snapshot. Browser storage can still be cleared/evicted; this is not cross-device cloud backup. On failure, controls report that the normal bank remains unchanged rather than claiming a successful save.

The pre-existing account/save-slot interface retains its existing backing implementation. This update does not migrate it to a new cloud service or promise account-level synchronization.

## Miracle feedback

The power picker shows why a selected power cannot be used (age, scenario restriction, faith, water, slope, spacing or missing aim). Casting uses the same gate, so feedback is not cosmetic-only. Invalid target/resource previews turn red. Local rain preparation and combo cooldown are visible. A ready Thunderstorm expands the Lightning area preview to the actual 1.8-unit combination radius. Existing building material costs and normal tool costs remain in effect; selecting a site does not create materials.

## Compatibility and verification

The optional `chronicle` extension leaves save version and original objective indexes intact. Memories and favorites are bounded; invalid values are normalized. Normal saves continue using unseeded model randomness. No new environment variables are required.

Tests cover memory bounds/round trips, old-save migration, colony hazards/rewards/one-time gates, Ascension, seeded initial state, RNG checkpoints, challenge completion, storage failure before transitions, bank isolation, slot-write rejection, drought-duration restoration, restricted power execution and combo-preview readiness. Desktop/mobile rendering, native controls and real browser recovery still require interactive preview/device verification; passing model tests and builds do not establish those outcomes.


## Device recovery snapshots

Each normal/challenge device-save bank keeps one previous structurally valid snapshot under its own `-backup` key when storage permits. Reads prefer the primary and automatically fall back only when it is missing, malformed, oversized or belongs to the wrong bank. The title labels recovery explicitly so players know it restores older progress. Corrupt primaries never replace good backups. Backup allocation is best-effort; lack of room for a second copy does not itself block saving the primary. A primary write failure still reports failure. This does not protect against browser eviction/clearing, every kind of logical save corruption, or device loss.

Challenge return saves its own progress before switching and refuses to leave on save failure. Normal recovery is resolved before switching banks. Tests cover direct return/resume, missing normal saves, corrupt-primary fallback, quota failures, and pause ownership during challenge transitions. Interactive modal focus/touch flows remain dependent on preview browser verification.
