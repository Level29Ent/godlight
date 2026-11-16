# World Care & Wildlife

A bounded first implementation of the five requested improvements, integrated with Worldbook and existing saves. No new services, dependencies or environment variables.

## Follower inspection

Worldbook → World health provides an inspection-mode control and keyboard-accessible follower/building lists. In inspection mode, tap a follower to see their name, trait, job/state, happiness, health, prioritized need and three recent journal entries. Find me follows their current location. Exit, Escape or choosing a power leaves inspection. Touch-and-drag job assignment is unchanged outside inspection; inspection clears held powers/tethers and cannot cast a miracle. Missing/dead entities clear the selection safely. Selection and inspection mode are session-only, not saved.

## World health

A live, read-only query lists fires, dry completed farms (under 25% moisture), unfinished buildings, unhappy home followers (under 40 happiness), idle/unassigned followers and threatened settled colonies (under 60 integrity or living dinosaurs). Selecting a category focuses its first affected target; colony categories switch the visit view. Selecting a home entity from a colony returns to the home view. Idle is an opportunity, not necessarily a failure condition. The Worldbook pauses simulation while reading; the inspection card itself does not pause time.

## Construction feedback

A selected building shows completion, assigned builders, remaining material costs and stockpile shortfalls, both in its inspection card and a small label above the site. Remaining materials are total cost × unfinished fraction, rounded upward for display. A shortfall compares that remainder to the shared stockpile; it does not reserve materials or promise that competing sites are funded. Assigned builders include manual construction jobs and automatic builders approaching/working at that site. Completion, fire/health and farm moisture/growth are visible; controls switch back to Touch or Rain for intervention.

## Two small wildlife populations

Deer depend on mature, unburned/uncharred trees (size ≥0.4, charred=0), biosphere health and alignment. Waterbirds depend on completed, non-burning wells or farms with at least 40% moisture, global moisture and alignment. Benevolence multiplies habitat capacity by 1.15; dread by 0.55. Drought reduces deer capacity to 40% and bird capacity to 30%. Populations approach capacity gradually (+0.04 or −0.12 animals/sec at most), bounded to eight deer and ten birds. Fractional populations represent recovery toward the next visible animal, not partial buffs.

- Whole waterbirds add 0.001 crop growth/sec each to completed, unburned farms with at least 40% moisture, capped just below harvest without reducing already riper crops.
- Whole deer gently improve happiness near the first occupied healthy-forest anchors: 0.05 happiness/sec per whole deer within 1.8 units. This does not replace Sunlight or other care.

At most 18 low-poly procedural animals render using instanced geometry, without textures, physics, hunting or a food-chain simulation. Deer wander locally around forest anchors, keeping land positions; birds fly near water sites. Motion follows simulation time, so it freezes when paused. Animals do not consume challenge RNG, interfere with hit targets, or appear on colony worlds. Counts are stored in an optional bounded `wildlife` extension; old saves begin with zero and recover naturally.

## Ascension finale

New Ascensions capture a bounded, immutable snapshot: time, home population, harvests, prayers, averted disasters, settled colonies, completed wonders and five recent memories. A paused native-modal celebration introduces the sanctuary, shows those statistics and story moments, then lets play continue without a reset. Reduced-motion users do not receive the entry animation. Escape and the visible Continue control dismiss it. Replay is available in Worldbook → Celestial Ascension, without paying or awarding again. Independent pause ownership keeps a background Worldbook paused after dismissing its nested finale.

Acknowledgement and the snapshot persist in the optional chronicle extension. Older ascended worlds are not automatically interrupted or assigned fabricated historical statistics; replay explicitly labels a current-statistics fallback when no historical snapshot exists. Closing the finale before the next device save may show it again after a reload, rather than silently marking an unseen celebration complete.

## Verification and limits

Model tests cover issue classification, remaining materials/builders, urgent needs/memories, safe selection and world switching, no-cast inspection, save migration, wildlife capacity/recovery/benefits/bounds, immutable finale snapshots, acknowledgement and nested pause ownership. Existing progression and seed tests continue unchanged. Model tests and production builds are not desktop/mobile UI verification. Real hit targets, focus behavior, small-screen layout, native-device performance and long-term balance still require interactive preview/device playtesting.
