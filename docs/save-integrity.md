# Save-integrity fixes

The audit reproduced three failures before fixing them: malformed direct saves were accepted and could replace the running world, follower injuries/fires disappeared during save/load, and device recovery accepted prototype/inherited tool names rather than selecting a valid recovery copy.

## Validation before mutation

A shared structural preflight now serves direct slot imports and device primary/backup reads. It requires version 1 and object-entry collections, checks optional rock collections, bounds collection sizes, rejects unknown/inherited tool names and non-finite or negative core economy/time values. Missing legacy optional fields remain migratable. Invalid snapshots return false before resetting state, releasing photo pause, moving the camera or consuming/resetting a challenge RNG stream. Invalid primaries can therefore fall back to a structurally valid same-bank backup.

Optional runtime values are normalized: finite unit directions, bounded follower happiness/speed/health, farm moisture/growth and fire/fear state. This is application data validation, not anti-cheat or a complete schema for every future feature.

## Preserve consequences across load

New optional fields retain follower health, heat, burning duration, fear/source and lost status; building burning duration; tree fire/heat; and the world's fear timer. Previously loading healed followers to full health and extinguished everything, which resumed burning-site upgrades without Rain. Now such work stays fire-paused after loading. Sites/people explicitly saved at zero health are not resurrected. Old saves without these fields keep their former healthy/non-burning defaults; already-lost historical state cannot be reconstructed.

Original save version, upgrade levels/timers, save-bank keys and challenge RNG checkpoints are unchanged. This does not add full serialization of transient attacks, UFOs, particles or every AI timer; it is not a deterministic replay system.

## Game-over controls

The game-over layer now sits above the responsive dock/HUD and scrolls in short viewports, so background controls do not cover restart/load controls. Save dialogs retain their higher overlay layer.

Tests cover invalid imports without live-state mutation, primary/backup tool validation, legacy defaults, finite normalization, retained fire/injury/lost state, fire-paused upgrade timers, RNG/photo-pause preservation, oversized collections and zero-health resurrection. Actual desktop/mobile rendering, physical-device recovery and full gameplay balance remain separate browser/device checks.
