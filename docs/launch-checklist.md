# Launch checklist

Work top to bottom. Most steps take a few minutes. Anything that needs a value pasted goes into `site/lp-assets/config.js`.

## 1. Meta Pixel (dataset)

- [ ] In **Events Manager**, create a web dataset (pixel) for afresh.io, or use the existing one if the Business account already has one.
- [ ] Paste its ID into `metaPixelId` in `site/lp-assets/config.js`. The pages load the pixel themselves; no snippet needs adding anywhere else.
- [ ] In **Business Settings > Brand safety > Domains**, verify `afresh.io`.
- [ ] After deploy, open `https://afresh.io/full-power/?utm_source=test` with the **Meta Pixel Helper** Chrome extension (or Events Manager > Test events) and confirm you see these events:

| Event | Type | Fires when | Use |
|---|---|---|---|
| PageView | standard | page load | audiences |
| ViewContent | standard | page load, with `cell` | retargeting visitors |
| AssessmentStart, AssessmentComplete, ResultsView | custom | quiz steps | funnel diagnosis |
| ResetStart, ResetComplete, RecipeBuilt | custom | tool use | funnel diagnosis |
| **Lead** | standard | email submitted, with a unique `eventID` | **campaign optimization** |
| BookingClick | custom | booking button tapped | funnel diagnosis |
| **Schedule** | standard | Calendly booking completed in the popup | booked-call reporting, later optimization |

- [ ] Phase 2 (optional): send Lead server-side through the Conversions API (a Vercel function, Zapier's Meta Conversions API action, or HubSpot's Meta integration). Every lead already carries `event_id`, so browser and server events deduplicate.
- [ ] After launch, and again on day 3, check Events Manager for any **health and wellness data restriction** notice. See the risk table in the campaign plan.

## 2. HubSpot (where leads land)

Portal `247393378` (Afresh) is already in the config.

- [ ] Create these **contact properties** (single-line text unless noted). Prefix them so they are easy to find:

| Property (internal name) | From the page | Example |
|---|---|---|
| `afresh_lead_magnet` | `leadMagnet` | full_power_check |
| `afresh_cell` | `cell` | OWN-POWER |
| `afresh_role` | `role` | I own a business with a team |
| `afresh_team_size` | `teamSize` | 6 to 20 |
| `afresh_score` (number) | `score` | 42 |
| `afresh_resistor` | `resistor` | fear |
| `afresh_putting_off` (multi-line) | `avoiding` | Raising prices on our biggest account |
| `afresh_career_weakest` | `weakest` | network |
| `afresh_career_level` | `level` | Director |
| `afresh_career_situation` | `situation` | Between roles |
| `afresh_career_target` | `targetRole` | Director of Product |
| `afresh_recipe` (multi-line) | `recipe` | After I pour my first coffee... |
| `utm_source`, `utm_campaign`, `utm_term`, `utm_content` | same | facebook, R1_OWN-POWER, ... |

- [ ] Create a **form** (a non-HubSpot/"collected" form works too) with email, first name and every property above as a hidden field.
- [ ] Paste the form's GUID into `hubspot.formGuid`.
- [ ] Extend `hubspot.fieldMap` so each lead key maps to its property, for example:

```js
fieldMap: {
  email: 'email',
  firstName: 'firstname',
  leadMagnet: 'afresh_lead_magnet',
  cell: 'afresh_cell',
  role: 'afresh_role',
  teamSize: 'afresh_team_size',
  score: 'afresh_score',
  resistor: 'afresh_resistor',
  avoiding: 'afresh_putting_off',
  weakest: 'afresh_career_weakest',
  level: 'afresh_career_level',
  situation: 'afresh_career_situation',
  targetRole: 'afresh_career_target',
  recipe: 'afresh_recipe',
  utm_source: 'utm_source',
  utm_campaign: 'utm_campaign',
  utm_term: 'utm_term',
  utm_content: 'utm_content',
},
```

   Only mapped keys are sent, because HubSpot rejects a whole submission that names a property it does not know. Add properties first, then map them.
- [ ] Submit one real test lead and confirm the contact shows up with the properties filled in. The pages post to `https://api.hsforms.com/submissions/v3/integration/submit/247393378/<formGuid>`. The Afresh portal is hosted on HubSpot's `na2` data centre; if the test lead does not arrive, check the form's embed code for the host HubSpot expects and update `hubspot.endpoint`.
- [ ] Build an **active list per cell** (`afresh_cell` is ...) and a **Qualified** list (role is owner-with-team or founder, or career level Manager and above). These are the CPQL denominators.
- [ ] Set up the email series from [program-and-nurture.md](program-and-nurture.md) as workflows triggered by `afresh_lead_magnet`. If the HubSpot plan does not include marketing automation, point `webhookUrl` at the email tool that will send them (Kit, Mailchimp, Zapier, or a small `/api` route using the Resend setup already in the afresh.io repo).
- [ ] Optional: `webhookUrl` also works as a second copy of every lead (for example a Google Sheet via Zapier) while the HubSpot mapping settles.

## 3. Calendly (the free session)

- [ ] Create a dedicated 30-minute event type, for example **"Unblock Session (free)"**, so ad bookings can be counted separately from other meetings. Keep the first question as a free-text "Anything that will help prepare?": the pages prefill it with the person's result and what they are putting off (`a1`).
- [ ] Paste its link into `bookingUrl` (today it is the existing `calendly.com/douglas-stevenson/meeting`).
- [ ] Calendly records `utm_*` on each booking automatically, so bookings can be traced to the ad.
- [ ] Optional: connect Calendly to HubSpot so bookings update the contact.

## 4. Deploy the pages to afresh.io

The pages are plain static files with no build step. The simplest home is the existing afresh.io app (`Afreshio/founder-assessment-tool`):

- [ ] Copy the **contents** of `site/` into that repo's `public/` folder, so the result is `public/full-power/index.html`, `public/lp-assets/...` and so on. Vite copies `public/` into the build unchanged.
- [ ] In its `vercel.json`, add these **above** the final catch-all rewrite so paths without a trailing slash still work:

```json
{ "source": "/full-power", "destination": "/full-power/index.html" },
{ "source": "/reset", "destination": "/reset/index.html" },
{ "source": "/tiny-habits", "destination": "/tiny-habits/index.html" },
{ "source": "/career-move", "destination": "/career-move/index.html" },
{ "source": "/privacy", "destination": "/privacy/index.html" }
```

- [ ] Deploy, then open each URL on a phone.

Alternative: deploy `site/` as its own Vercel project on a subdomain (for example `go.afresh.io`). If you do, update the `canonical` and `og:` URLs in each page and the landing page URLs in `ads/ads.json`.

## 5. Build the campaign in Ads Manager

`ads/ads-sheet.csv` has one row per ad with every field. Images are in `ads/out/` (`_feed.png` is 4:5, `_story.png` is 9:16).

- [ ] Campaign `R1_OwnerAngles_Leads`: Leads objective, website conversion location, **Lead** event. Advantage campaign budget **off**.
- [ ] Four ad sets named exactly as in the sheet (`R1_OWN-POWER`, `R1_OWN-CALM`, `R1_OWN-HABIT`, `R1_CAREER`), $25 a day each, settings from the campaign plan.
- [ ] Three ads per ad set, named exactly as `Ad name` in the sheet. Upload the feed image and assign the story image to Stories and Reels placements.
- [ ] Paste the URL parameters from the sheet into each ad's **URL parameters** field. Meta fills in the campaign, ad set and ad names, which is how HubSpot knows which ad produced each lead.
- [ ] Turn **off** Advantage+ creative enhancements that rewrite text or add music for round 1, so each ad is tested as written.
- [ ] Preview every ad on mobile feed, Stories and Reels.
- [ ] Publish. Expect Meta's review to take anywhere from minutes to a day.

## 6. Pre-flight QA (15 minutes)

- [ ] `npm run check` passes (copy lint, unit tests, browser tests).
- [ ] On a real phone, for each page: tap through the whole flow, submit with a real address, confirm the HubSpot contact, the email series and the Calendly prefill.
- [ ] Lead events appear in Events Manager with `cell` set.
- [ ] Doug has blocked time for sessions in the Unblock Session event type.
- [ ] Doug knows the 24-hour personal follow-up routine.

## 7. Daily, 10 minutes

- [ ] Ads Manager: spend, link CTR, cost per lead by ad set; apply the kill rules.
- [ ] HubSpot: new leads by cell, qualified share, Doug's follow-ups sent.
- [ ] Calendly: bookings and their `utm_content`.
- [ ] Fill in `ads/results-template.csv` so the day-14 decision is a lookup, not a debate.
