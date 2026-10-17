# Godlight — Store Submission Kit

Copy-paste text and answers for App Store Connect and Google Play Console.

## Shared details

| Field | Value |
| --- | --- |
| App name | Godlight |
| Developer / seller | Level 29 Entertainment |
| Bundle ID / package name | `app.vercel.godfinger` (permanent after first upload — change before uploading if you want `com.level29ent.godlight`) |
| Version | 1.0 (build 1) |
| Category | Games → Simulation (secondary: Strategy) |
| Support URL | https://godfinger.vercel.app/support |
| Marketing / website URL | https://level29ent.com |
| Privacy policy URL | https://godfinger.vercel.app/privacy |
| Support email | info@level29ent.com |
| Price | Free, with in-app purchase |
| In-app product | Supporter Pack, non-consumable, $3.99, product ID `supporter_pack` |

## Listing text

**Subtitle (Apple, max 30 chars)**
Tend a tiny world of followers

**Short description (Google, max 80 chars)**
Be a gentle god. Bless your followers, grow their village, shape a tiny planet.

**Promotional text (Apple, max 170 chars)**
Shine sunlight, summon rain, and guide your followers from the first hut to a thriving civilization on a tiny 3D planet you can spin in your hand.

**Full description (both stores)**

Become the god of a tiny world.

Godlight is a relaxing god game set on a small 3D planet that you can spin with your finger. Your followers build, farm and pray, and their faith gives you the power to shape their world.

BLESS YOUR PEOPLE
• Shine sunlight to help crops grow and lift spirits
• Summon rain to water farms and forests
• Gently touch followers to inspire them

SHAPE THE WORLD
• Place houses, farms and temples to grow your village
• Guide your civilization through new ages
• Complete objectives to unlock new powers

UNLEASH YOUR WRATH
• Call down lightning, earthquakes and meteors when the mood strikes, but a feared god is not always a loved one

PLAY YOUR WAY
• Spin, zoom and explore your planet
• Cloud saves keep your world safe across devices
• Optional gifts: watch a short ad for bonus faith, only when you choose to
• Supporter Pack: claim every gift without ads, and your followers get golden halos

No forced ads. No timers that stop you playing. Just you and your tiny world.

**Keywords (Apple, max 100 chars, comma-separated, no spaces)**
god,sim,simulation,planet,village,civilization,builder,sandbox,relaxing,idle,followers,world,casual

**What's new (1.0)**
The first release of Godlight. Thanks for playing!

## In-app purchase listing

- Reference name: Supporter Pack
- Product ID: `supporter_pack` (Google requires lowercase)
- Type: Non-consumable (Apple) / One-time product (Google)
- Price: $3.99 (Apple Tier 4)
- Display name: Supporter Pack
- Description: Claim every heavenly gift without ads, and give your followers golden halos.
- Apple review screenshot: a screenshot of the Heavenly Gifts panel

## App Store Connect answers

**Age rating questionnaire**
- Cartoon or fantasy violence: Infrequent/Mild (lightning, meteors)
- Everything else (realistic violence, sexual content, profanity, drugs, gambling, horror, mature themes): None
- Unrestricted web access: No
- Expected rating: 9+

**App Privacy ("nutrition label")**
- Contact info → Email address: App functionality. Linked to user. Not used for tracking.
- Identifiers → User ID: App functionality. Linked to user. Not used for tracking.
- Identifiers → Device ID (advertising ID): Third-party advertising. Not linked to user. Used for tracking (only if the player allows it).
- Usage data → Advertising data: Third-party advertising. Not linked to user. Used for tracking.
- Purchases → Purchase history: App functionality. Linked to user. Not used for tracking.
- Diagnostics: Not collected.

**Other**
- Export compliance (encryption): uses only standard HTTPS, so answer "No" to non-exempt encryption.
- Content rights: does not contain third-party content.
- Advertising identifier (IDFA): Yes, for showing ads.
- Sign-in required for review: No. Players can start as a guest. Optionally provide a demo account.

**Review notes**
Godlight is a god simulation game. Players can start instantly as a guest; an account is optional and only needed for cloud saves. Ads are opt-in rewarded ads in the Gifts menu (top right). The Supporter Pack is in the same menu, alongside "Restore purchases". Account deletion: Saves menu → Delete account.

## Google Play Console answers

**Content rating (IARC questionnaire)**
- Category: Game
- Violence: Yes, fantasy/cartoon violence toward non-realistic characters; no blood
- Sexual content, language, controlled substances, gambling: No
- User interaction: No chat or user-to-user communication
- Shares location: No
- Digital purchases: Yes
- Expected rating: PEGI 7 / ESRB Everyone 10+

**Data safety**
- Data collected: Email address (account management), User IDs (app functionality), Device or other IDs (advertising), App interactions (advertising, analytics by AdMob), Purchase history (app functionality)
- Shared with third parties: Device IDs and app interactions with Google AdMob for advertising
- Encrypted in transit: Yes
- Players can request deletion: Yes, in the app (Saves → Delete account) or by emailing info@level29ent.com
- Account deletion URL: https://godfinger.vercel.app/support

**Other declarations**
- Contains ads: Yes
- Target audience: 13 and over (avoids Families policy requirements for ads)
- Advertising ID: Yes, used for advertising
- App access: All features available without special access
- Government / financial / health app: No

## Graphics checklist

**Apple**
- iPhone 6.9" screenshots (1320 × 2868), 3 to 10 images, required
- iPad 13" screenshots (2064 × 2752), required if the app runs on iPad
- App icon 1024 × 1024, no transparency (from `resources/icon.png`)

**Google**
- App icon 512 × 512 PNG
- Feature graphic 1024 × 500
- Phone screenshots, 2 to 8 images (at least 1080px on the short side)

Suggested screenshot captions:
1. Tend a tiny world
2. Bless your followers with sunlight and rain
3. Build a village that grows through the ages
4. Unleash lightning and meteors
5. Spin your planet in the palm of your hand

## Before you upload

1. Replace the AdMob sample IDs in `ios/App/App/Info.plist` and `android/app/src/main/AndroidManifest.xml` with your real app IDs, and set the `NEXT_PUBLIC_ADMOB_REWARDED_IOS`, `NEXT_PUBLIC_ADMOB_REWARDED_ANDROID`, `NEXT_PUBLIC_REVENUECAT_IOS_KEY` and `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY` project variables.
2. Create the `supporter_pack` product in both stores. In RevenueCat, attach it to the `supporter` entitlement and add it as a package in the offering marked "Current", because the app buys whatever package that offering contains.
3. iOS: open `ios/App/App.xcworkspace` in Xcode, set your team under Signing, then Product → Archive → Distribute App → App Store Connect.
4. Android: in Android Studio, Build → Generate Signed App Bundle (.aab), keep the keystore safe, and upload it to an internal testing track first.
5. Google Play: new personal developer accounts must run a closed test with at least 12 testers for 14 days before production access.
