# Living wildlife

The home planet has a bounded, procedural sanctuary: at most 48 ambient animals, the existing eight habitat deer and ten habitat waterbirds, and two rare visitors. No new resource, dependency or save field is required. Catalogs, habitats and behavior use deterministic terrain samples and simulation time, never gameplay RNG. Pausing (including Worldbook and photo mode) freezes visits, poses and sound scheduling.

## Habitats and behavior

- **Dense forest:** up to six separated healthy tree clusters, each with at least six mature, unburned, uncharred trees within 0.25 direction units. Fern-like ground cover marks them. Ambient deer shelter here.
- **Flower meadow:** up to six open, low-elevation land samples, away from buildings and dense tree cover. Requires at least 25% global moisture and no drought. Flower tufts attract grazing ambient deer.
- **Wetland:** up to six completed water-site or low coastal-land anchors, with reed-like vegetation. Requires at least 40% global moisture and no drought. Ambient birds rest by water for ten seconds, take off, fly locally, and return in a 28-second cycle.
- **Coast:** fish swim in small schools sharing a path with individual offsets. They never move onto land. Up to six coastal anchors are listed internally; fish use the fixed ocean samples.

The existing habitat populations still recover gradually and retain their original forest/farm/well requirements and modest happiness/crop benefits. Ambient populations respond to biosphere health and available natural habitats but provide no direct bonus. Deer spend part of each 28-second cycle lowering their heads to graze; legs stop striding during grazing. Animal poses and coastal movement are bounded, not a navigation, hunting or food-chain simulation.

Habitat vegetation refreshes every half simulation second. Flower and reed patches disappear in drought or insufficient moisture; dense forest cover disappears if its trees are damaged. Rain and protecting mature trees improve the conditions through existing game systems. Habitat patches are not new placeable buildings.

## Inspection

Tap an animal's visible body to enter the existing no-cast inspection mode. One invisible, generous pick volume per animal maps to a stable ID, avoiding raycasts against every decorative body part. The card shows species, current activity, habitat needs and its actual contribution. Backside animals cannot be picked through the planet. Worldbook → World health → Find & inspect wildlife offers the same animals as keyboard-accessible buttons, with camera focus. Exit, Escape, choosing a power, resetting or loading behaves like other inspections. If an animal leaves or loses its habitat, selection clears safely. No animal selection is saved.

## Rare visitors

At 85% biosphere, 45% moisture, +25 alignment and clear weather, a **white stag** with pale fur and branching antlers visits a dense forest, and a **luminous fish** visits coastal water when wetland habitat exists. Visits last from 30 to 90 seconds in each 180-second simulation-time cycle. Both are cosmetic indicators with no extra buff or resource reward. Their conditions are shown in Worldbook. The fish's bright material participates in existing bloom; battery saver omits bloom but preserves its pale color.

## Nature audio

Short synthesized birdsong, splashes and rustling use the existing SFX bus after user audio unlock. The nearest visible animal determines the cue; sound fades with camera distance and is silent on the far side or when zoomed far out. At most one cue is scheduled per four simulation seconds, with no separate timers or persistent nodes. Existing SFX mute, ad mute, background visibility and pause rules apply. Already-started cues naturally finish within a fraction of a second when paused.

## Validation

Behavioral tests cover habitat loss/recovery, rare conditions and visit windows, finite surface-safe poses, grazing, bird landing/flight, schooling, deterministic RNG/save independence, inspection safety/reset/despawn, pause freezing and sound attenuation. Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Real-device performance and subjective audio quality still need device playtesting.
