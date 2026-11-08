# Godlight web AdSense setup

## Included in this change

- Publisher verification meta tag: `google-adsense-account=ca-pub-8022731487137227`.
- Root seller declaration at `/ads.txt`: `google.com, pub-8022731487137227, DIRECT, f08c47fec0942fa0`.
- The owner-supplied async AdSense verification script is included in the document head. `pauseAdRequests=1` is set before it; do not resume requests until the web CMP and placements are reviewed. The Google script is still a third-party network request. No ad units or automatic ad-request resumption are added. Native AdMob/RevenueCat are unchanged. The existing privacy policy's statement that the website does not show ads remains accurate until ad serving is implemented.

The publisher ID is a public identifier, not a private credential. Never supply account passwords or API credentials in chat or source files.

## Required before ad serving

1. Deploy/merge this PR. In AdSense connect `godlight.app`, choose the **AdSense code snippet** verification method (the matching meta tag is also present), verify and request review. A site must be approved before it can show ads. Verify the root `/ads.txt` declaration after deployment; Google crawling/status updates are not instantaneous.
2. Create a responsive display unit: **Ads → By ad unit → Display ads → Save and get code**. Supply the public display unit code (including `data-ad-slot`) for the controlled web placement. The publisher ID alone does not identify that slot. Auto ads are a different option, but this PR does not enable them or let them inject overlays near gameplay.
3. Configure/publish a Google-certified web CMP and the relevant privacy messages. Google's site-review flow can offer its CMP; its controls are under **Privacy & messaging**. Confirm the actual web consent configuration before loading ads; the existing native AdMob consent flow is not a web CMP. A homegrown accept button or “non-personalized” flag is not a substitute for required cookie consent.
4. Implement and review a clearly separated non-gameplay placement, avoiding the canvas, toolbars, start/reload buttons and touch targets. Update the web advertising/privacy disclosure and consent choices in that same ad-serving change. Never encourage clicks or reward ordinary AdSense display-ad clicks. Do not show live ads on preview deployments or native WebViews.
5. Test layout, consent accept/reject behavior, ad-blocked/offline behavior, native exclusion and resumed games without clicking real ads. Revenue, approval, fill rate and earnings are not guaranteed by adding a publisher ID or ad code.

## References

- https://support.google.com/adsense/answer/7584263 — site connection and meta verification
- https://support.google.com/adsense/answer/12171612 — ads.txt seller declaration
- https://support.google.com/adsense/answer/9274025 — create a display unit
- https://support.google.com/admanager/answer/10076805 — certified CMP requirement (AdSense included)
- https://support.google.com/adsense/answer/10025624 — avoid accidental clicks near games/buttons
