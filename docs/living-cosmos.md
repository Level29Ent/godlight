# Living Cosmos: playable systems

Open **Living Cosmos** in the game. This council is not a pause screen: weather, construction, expeditions and warnings continue in real simulation time. Closing it returns to casting powers on the planet. Cosmic progress is included in both device and cloud saves through an optional versioned extension to the existing v1 save; older saves receive fresh cosmic systems while retaining their original civilization.

## Cosmic threats and defenses

A fresh world has a 110-second grace period. A bounded random meteor shower or solar flare then gives a **25-second warning**. The event displays a countdown, target-location control and incoming sky effects; after resolution there is a 150–250-second interval before the next event.

- **Shield:** 20 faith, protects the whole world for 25 seconds. Recasting refreshes rather than infinitely stacking duration. The Tideglass relic extends this to 33 seconds. Impacts resolve before the shield expires on the exact boundary frame.
- **Bunker:** 4 timber and 6 stone, available from the first age. One per world. Up to two available followers walk to its site and build it (12 builder-seconds). It protects a 3m local radius, not the whole planet. Followers within 6m automatically seek completed shelter when a cosmic event is pending. Normal coastal pathing still applies; a remote bunker is not an instant teleport. Use **Locate** to inspect the selected site.
- **Meteors:** three telegraphed targets near an existing settlement. Unprotected impacts use the game's existing destructive meteor behavior: buildings/trees can burn and followers can die. Shielded/local-bunker hits become golden shockwaves.
- **Flares:** no instant population wipe; exposed farms lose moisture and exposed followers lose health/morale. Shielding counters the whole event; bunkers protect locally. Fully shielding a threat earns 30 faith and an averted-event entry.

Events are saved with remaining time and resolved state; loading does not roll a new event or duplicate rewards. Leaving a hidden tab does not simulate hours of unanswerable catastrophes.

## Wonders and workforce

Followers continue gathering timber and stone through existing tree/rock jobs. Blueprint resources are paid once up front, and actual reserved followers must reach a site before progress accrues. Up to two free followers are selected; normal player-assigned jobs are never silently taken over. If a crew dies, available replacements are selected. Assign a crew member to an explicit normal tether task to redirect them.

| Blueprint | Unlock age index/name | Timber | Stone | Builder-seconds | Passive faith/s |
| --- | --- | ---: | ---: | ---: | ---: |
| Bunker | 0 / Dust | 4 | 6 | 12 | Local defense |
| Sun pyramid | 1 / Clay | 25 | 50 | 90 | 1.5 |
| Sky obelisk | 2 / Bronze | 18 | 40 | 75 | 2 |
| Grand colosseum | 3 / Iron | 50 | 70 | 120 | 3 |

One of each blueprint is allowed. Models rise as construction advances. Wonders are a separate persistent project system, not a change to the existing ordinary house/farm/temple construction or old objective indexes. Wonder destruction/repair and multiple copies are not part of this release.

## Culture and commandments

For **8 stone**, review and confirm one permanent law per world. The confirmation can be cancelled before committing; after carving, only a new world permits a different choice.

- **Code of Peace:** pale robes, circular shrine emblems on ordinary buildings, more frequent peaceful prayer, +10% faith and gentler morale decay.
- **Trial by Combat:** crimson robes, pointed shrine emblems, persistent fear-based worship, and an additional +30% faith while a cosmic threat is pending.

Successful nurturing/destructive miracles move a clamped −100…100 alignment meter; sustained sunlight/rain also nudge benevolence. The permanent law is distinct from this changing moral score. This is not a full tribal warfare/diplomacy simulation.

## Mortal legends and artifacts

Champions unlock in Clay and cost **60 faith** each (one per role).

- **Liora Dawnkeeper, prophet:** wanders between followers, soothing morale, quenching personal fires and restoring some health within 2m every five seconds.
- **Orin Tidewalker, scholar:** doubles survey speed and moves toward active relic expeditions, contributing two additional excavation workers when nearby.

These are original fictional mortal legends, not portrayals of real historical or religious figures.

A **15-faith survey** normally takes 15 seconds and reveals the next artifact site and an uncharted neighboring world. Four bounded procedural searches select mountain peaks/seabed sites. Expeditions cost **8 timber + 4 stone**, reserve up to two followers and take 60 worker-seconds at the dig. Supplied climbing/diving/boat equipment allows expedition crews to cross water; ordinary followers still use land pathing. Mountains unlock in Clay, deep-sea diving in Iron.

- Ember of Dawn: +10% faith generation.
- Tideglass Heart: +8 seconds to shields.
- Root of Ages: +25% crop growth.
- Choir Pearl: +10% faith generation.

Bonuses are derived from recovered relic state, so save/load or clicking again cannot award them repeatedly.

## Climate and wildlife

After an initial 45-second clear interval, a moving regional front becomes a drought, monsoon or blizzard for 35–55 seconds. Clear periods last 55–95 seconds.

- Drought depletes local farm moisture and slows crop growth. **Rain** reduces its remaining time when cast inside the front.
- Monsoons wet crops and quench farm fires but slow growth through flooding. **Sunlight** disperses flooding faster.
- Blizzards heavily slow local crops and reduce follower morale. **Sunlight** shortens the cold front.
- Very low-morale followers can die from prolonged unprotected exposure, leaving time for intervention. A shield or local bunker protects them.

Soil moisture, healthy forests and climate feed a bounded biosphere-health model. Pooled procedural herds, birds and surface-visible fish thrive or dwindle with that health. Birds migrate across the sky; herds/fish use bounded local motion in sampled habitats. Existing trees supply flora and react to sunlight, rain and fire. This is a stylized ecology model, not individual predator/prey breeding or underwater terrain simulation.

## Multi-planet endgame

Survey Selene (lunar), Aurelia (desert) and Thalassa (ocean), then unlock rockets in the **Age of Stars**. Launching costs the displayed faith/timber/stone and transfers three idle settlers from home, preserving at least five at home. The rocket takes 30 simulation seconds to arrive. Distinct orbital world models and settlement towers appear around the home planet.

Colonies grow independently from 3 to at most 30 residents, roughly one per minute (slower under an unhealthy home biosphere). They send faith, stone and timber into the shared economy. Their launch/growth/settler progress is persistent. This is a **parallel autonomous outpost system**, not yet a fully navigable multi-terrain galaxy: there is no camera transfer to a separately playable colony surface, colony-specific weather/combat or interplanetary raids.

## Adaptive audio and performance

The existing generative Web Audio music gains a persistent bounded choir/wind layer and drama/drum pulses. Peace, storms, wrath and cosmic warnings change the mix through smoothed gain/filter transitions rather than allocating new background layers each frame. Later eras subtly brighten the mix. Existing mute controls govern the layers; hidden tabs stop scheduling notes and suspend the audio context. Sounds remain synthesized, not licensed recordings or recorded vocals.

Collections are capped (four wonders, two champions, four relics, three colonies, three incoming meteor visuals, 48 pooled fauna instances and 64 weather particles). No new textures, light sources, remote assets or dependencies are added. Real-device battery use and 60fps are not guaranteed and require profiling.

## Verification boundaries

Unit/integration coverage includes shield duration/impact boundaries, once-only disaster resolution, local bunker vs global protection, flare effects, blueprint costs/gates/workforce/progress, permanent culture, champion healing/surveys, relic gates/bonuses, climate intervention/crops/ecology, settler transfer/colony economy, malformed/legacy saves and normal simulation integration. Browser-preview checks are recorded on the PR; a passing build alone is not proof of playable advanced-age flows. Native wrappers and cloud/payment/push configuration are unchanged.

## Visitable colony surfaces and dinosaur enemies

The galaxy expansion adds **Explore** for every surveyed destination. It switches the existing WebGL scene to that world's own orbitable 3D surface (no second canvas). **Return home** restores the home view; home simulation, colonies and device/cloud autosaves continue. Surveyed worlds can be inspected before launching; resource-backed rockets and three-settler transfer still require the Age of Stars. Each world has an independent saved development/raid state.

After landing, build one project at a time, up to six of each:

- Farm: 15 timber + 5 stone, 15 seconds. +20% growth and +30% timber output per farm.
- Habitat: 20 timber + 15 stone, 20 seconds. +4 capacity per habitat above the initial 6-settler capacity (maximum 30).
- Turret: 10 timber + 25 stone, 18 seconds. Automatically deals 8 damage/second to each attacking dinosaur.

**Hostile dinosaurs inhabit colonized worlds**, not the original home world in this release. Two stylized, animated low-poly dinosaurs approach 60 simulation seconds after settlement, take 20 seconds to reach the base, and each bites for 6 integrity every 2 seconds. Later raids wait at least 120 seconds and never stack while enemies remain; at most four dinosaurs can be restored from a save. Each has 80 HP.

**Smite dinosaurs** costs 15 faith and deals 45 damage to every attacker. Global shields stop bites during their normal duration. **Repair** costs 10 faith + 5 stone and restores 40 integrity (capped at 100). Integrity scales exports, faith and population growth; at zero the colony stops producing until repaired. Settlers are not silently deleted or duplicated by these raids. Kill count, HP, approach progress, construction and integrity persist across loads. Old colonies receive default surfaces on migration.

This is a colony-focused surface mode with orbit controls and strategic development/combat actions, not a cloned full home-world follower sandbox on every planet. Colony settlers are visible aggregate population; there are no individually tetherable colony followers or colony-specific terraforming yet. Existing home-world weather/disasters continue while exploring, so return home to intervene there. No native wrapper, payment, DNS or provider changes are required.
