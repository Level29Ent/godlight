# Responsive game controls

The supplied screenshot showed overlapping bottom controls: the power picker was placed independently of Challenges, Worldbook, Guide, Living Cosmos and Eco. Increasing z-index or guessing different bottom offsets would only move the collision to another viewport.

All menu triggers now live in one flow-based footer. Power selection/feedback is a separate row above the menus. Desktop menus wrap as needed; below 640px they use three equal columns with at least 44px trigger height. The Canvas remains full-screen behind the controls. The footer is deliberately not positioned: floating descendants remain anchored to the game shell, not a tiny nav cell.

ResizeObserver measures rendered footer and header heights, including wrap, browser zoom and safe-area padding. Mode changes reattach observations when header/footer elements mount or unmount. Panels use the measured dock height for their bottom boundary and scroll within the remaining play area. The title keeps its own Guide; the active game's Guide joins the dock. Photo mode still hides gameplay controls.

The top HUD uses non-overlapping grid columns and a width-constrained objective trigger. Messages follow the header in flow instead of using a guessed top offset. The power popup, council, inspection, colony panels, tutorial/challenge guidance and storage alerts reserve dock clearance. Save/gift overlays remain above the dock.

At heights of 500px or less, secondary tutorial guidance and idle tool hints are hidden to reduce landscape clutter (guidance remains in Worldbook); challenge progress/return remains scrollably reachable. Mobile shows only the latest toast and uses safe-area padding at all screen edges. This is not a promise that every simultaneous panel combination fits without scrolling.

Regression tests enforce a single measured dock, no independently anchored menu triggers, responsive column/safe-area rules, panel clearance, observer cleanup and challenge-exit accessibility. These are source-structure checks, not rendered browser assertions. Desktop screenshot matching, 320/390px portrait, short landscape, zoom, notches and real touch interactions still require visual/device checks. No simulation, progression, saves or economy rules are changed.
