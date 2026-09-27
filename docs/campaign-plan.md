# Facebook ad test plan: finding the cohort and message that books coaching clients

**Recommendation in one line:** start with **business owners** (owner-operators and founders with a team), lead with the **resistance** idea (fear, resentment and anger burning off an owner's drive), and use the stress, sleep, breathing and habit material as proof and program content rather than the headline. Run it as a two-week, four-cell test (about $1,400) against a challenger cohort (**career changers**), and pick the winner on cost per *qualified* lead, confirmed by booked calls.

Everything needed to run the test is in this repo: four landing pages (`site/`), twelve ads with rendered images (`ads/`), tracking, a copy linter, and tests. Setup steps are in [launch-checklist.md](launch-checklist.md); the program and email content is in [program-and-nurture.md](program-and-nurture.md); every ad is in [ads.md](ads.md).

---

## 1. Which cohort

Scored 1 to 5 (5 is best) on what matters for Facebook specifically:

| | Business owners | Career changers | Founders (startup) | Engineers | Product managers |
|---|---|---|---|---|---|
| Reachable on Facebook | 5: small business owners live on Facebook and Instagram | 5: broad, mid-career, heavy mobile use | 2: small, better on LinkedIn and X | 2: job-title targeting is thin; better on LinkedIn and Reddit | 2: same |
| Pain urgency | 4: the business depends on them, and they feel it daily | 5: acute when a move is forced | 4 | 3 | 3 |
| Pays out of their own pocket | 5: buyer, decision maker and beneficiary are the same person | 3: cash-constrained if between roles | 4 if funded | 3: often waits for employer budget | 3 |
| Fit with Doug's proof | 5: 23 years as a founder and CEO; owner testimonials already on afresh.io/business-growth | 4: Career Transition OS, Career Map tool, Working Genius | 5 | 4: Rippling testimonial | 4: PM diagnostics |
| Ad policy friction | 4: low if framed as business performance | 4: career coaching is not Meta's Employment special category (job ads are) | 4 | 4 | 4 |
| **Total** | **23** | **21** | 19 | 16 | 16 |

**Why owners over the others:**

1. **Creative is the targeting now.** Meta removed detailed-targeting exclusions in 2025 and has narrowed interest targeting; audience inputs are mostly suggestions to Advantage+. You cannot reliably target "product managers" on Facebook any more. You *can* write an ad that only an owner would stop for. Owners are also the group Facebook reaches best.
2. **Same wallet.** An owner who wants coaching can say yes on the first call. An employee often needs budget approval.
3. **The metaphor lands hardest for them.** An owner's fear, resentment and anger show up directly as revenue: the price not raised, the partner not confronted, the team afraid to bring bad news. That makes inner work a business purchase, which is easier to justify and pays better than "life coaching".
4. **Founders are folded in.** The owner creative says "owners and founders"; a separate founder cell would be too small to read on this budget.
5. **Engineers and PMs belong on LinkedIn.** Doug's diagnostics for PMs and engineers are strong. Run them as a separate LinkedIn test later, not on Facebook.

**Why career changers are the challenger:** it is the second-best fit, it uses the tools already built (Career Map, Career Transition OS), and it is the most likely to produce volume. The test will show whether volume turns into paid clients.

## 2. Life coaching or business coaching?

**Sell a business outcome; deliver the inner work.** People with money buy "stop losing power to the things you avoid". Breathing, mantra meditation, sleep and Tiny Habits are *how* the program delivers that.

Three reasons not to lead with stress or wellness:

- **Meta's health and wellness restrictions.** Since early 2025, Meta blocks lower-funnel conversion events (including Lead) for advertisers and domains it classifies as health and wellness. A site full of stress, sleep and meditation pages risks that label, and it would apply to every campaign on afresh.io. Leading with business performance protects the Lead event the whole test depends on.
- **Meta's personal attributes policy.** Ads cannot assert or imply the viewer has a health condition. "Stressed?" or "Can't sleep?" gets rejected. The copy linter (`npm run lint:ads`) enforces this.
- **Buyer quality.** Stress relief attracts people who want free relief. The Calm cell tests this directly: if it books calls as well as the others, the concern is wrong and it scales.

So the stress, breathing, mantra and sleep material is in the test as a cell (OWN-CALM), in every result page (the 60-second reset), and in the program. It is not the brand's front door until the data says it should be.

## 3. The core idea: owners as a circuit

> **P = V² ÷ R.** A bulb only gets the power that makes it past the resistance. The rest turns into heat.

- **V (voltage):** the owner's drive. Energy, sleep, focus, the reason they started.
- **R (resistance):** fear, resentment, anger.
- **P (power):** what actually reaches the business. Decisions made, calls taken, growth.

When results stall, owners push more voltage: more hours, more willpower. You can only push so hard for so long. Clearing resistance lets the same effort deliver more. That is a message an owner can hear without feeling judged ("it is a circuit problem, not a character flaw"), and it maps onto everything the program teaches:

| Lever | What it looks like in a business | Program tools |
|---|---|---|
| Fear | The call not made, the price not raised, the hire or firing that keeps slipping | Avoidance list, sizing the fear, tiny first moves, rehearsing the conversation |
| Resentment | The partner not pulling weight, the client who took advantage, the employee quietly given up on | Unspoken-expectations inventory, clearing conversations |
| Anger | The sharp email, the meeting that goes quiet, the team that stops bringing bad news | Trigger map, the one-breath gap (a "pearl habit"), the 24-hour rule |
| Voltage | Short nights, no recovery, no reset button | 4-7-8 breathing, mantra meditation, sleep settings, shutdown ritual |

The **Full Power check** (`site/full-power/`) turns this into a 3-minute, 14-question assessment. It returns a score (18% to 100%), the biggest resistor, how much clearing it would lift the score, and a Tiny Habits recipe to start. It is a reflection tool, not a psychological instrument, and the page says so.

## 4. The funnel

```
Facebook / Instagram ad  (one of 12, in 4 cells)
        |
Landing page with an instant, useful tool
   Full Power check | 60-second reset | Tiny Habits builder | Career Campaign Scorecard
        |
Lead: name, email, and one qualifying answer  -> Meta Pixel "Lead" + HubSpot
        |
Result on screen + 3 to 5 day email series
        |
Free 30-minute session with Doug (Calendly, prefilled with their result)  -> Pixel "Schedule"
        |
Full Power program (paid)
```

Doug's personal follow-up is the highest-leverage step after the ad itself: a short, personal email to every qualified lead within 24 hours that mentions their result. The template is in [program-and-nurture.md](program-and-nurture.md#personal-follow-up-within-24-hours).

## 5. The test

### Structure

One campaign, **Sales or Leads objective, optimizing for the website Lead event**, with **ad set budgets** (not campaign budget) so each cell gets equal spend and a clean read.

| Ad set | Audience | Angle | Landing page | Ads |
|---|---|---|---|---|
| `R1_OWN-POWER` | Owners and founders | Resistance: P = V² ÷ R | `/full-power/` | circuit, equation, bulb |
| `R1_OWN-CALM` | Owners and founders | 60-second reset before hard calls | `/reset/` | 4-7-8, pre-game, mantra |
| `R1_OWN-HABIT` | Owners and founders | Stop running on willpower (Tiny Habits) | `/tiny-habits/` | recipe, willpower, B = MAP |
| `R1_CAREER` | Experienced professionals | A career move is a campaign | `/career-move/` | campaign, title, conversations |

Three static ads per cell, all starting together. Add Doug-to-camera video ads (scripts in the program doc) in week 2 or round 2. Video usually beats static for coaches, but statics are enough to find the angle.

### Settings

- **Location:** United States. (Canada, the UK and Australia are cheaper, but add them in round 2 so round 1 reads cleanly. EU traffic would need a cookie consent banner.)
- **Age:** minimum 28. Advantage+ audience on, with suggestions of age 32 to 60 and interests such as small business, entrepreneurship and business books for the owner cells. Leave the career cell broad with an age suggestion of 30 to 55. The creative does the real targeting.
- **Placements:** Advantage+ placements, but exclude **Audience Network** (it tends to produce low-quality leads).
- **Budget:** $25 a day per ad set, $100 a day total, 14 days: **about $1,400**. A leaner version (drop OWN-HABIT, 10 days) costs about $750.
- **Attribution:** default (7-day click, 1-day view). When comparing cells, look at the 7-day click column.
- **Don't touch anything for 72 hours** except to fix a broken ad. Edits restart learning.

### What we measure

The pages attach the cell and ad to every lead (`utm_term` is the ad set, `utm_content` is the ad), so HubSpot can report every step by cell, not just what Meta reports.

| Metric | Where | Why |
|---|---|---|
| Link CTR, CPC | Ads Manager | Is the hook working? |
| Landing page view to lead rate | Ads Manager + HubSpot | Is the page working? |
| **Cost per qualified lead (CPQL)** | HubSpot | **Primary metric.** Comparable across cells because every form asks the same qualifier |
| Lead to booked call rate | Calendly (utm) + Pixel Schedule | Is it the right person? |
| Cost per booked call | Both | The real answer, but thin data at this budget |

**Qualified** means: owner cells, "I own a business with a team" or "I am a startup founder"; career cell, level Manager, Director or VP and above. Adjust if Doug's best clients look different.

### Planning numbers (assumptions to replace with actuals on day 4)

| Per cell, $350 | Cautious | Middle | Good |
|---|---|---|---|
| CPM | $30 | $20 | $14 |
| Link CTR | 0.6% | 1.0% | 1.5% |
| Clicks | 70 | 175 | 375 |
| Landing page to lead | 12% | 20% | 30% |
| Leads | 8 | 35 | 112 |
| Cost per lead | $42 | $10 | $3 |
| Qualified share | 30% | 45% | 55% |
| Lead to booked call | 5% | 8% | 12% |
| Booked calls | 0 to 1 | about 3 | about 13 |

These are planning assumptions, not benchmarks. What they show: at this budget, **leads and lead quality are readable per cell, and bookings are directional.** Round 1 picks the angle; round 2 concentrates money to prove bookings.

### What a lead is worth

```
max cost per lead = (program price x share you'll spend to win a client) x close rate x booking rate
```

Example only (the price is Doug's decision): a $3,000 program, spending up to 30% ($900) to win a client, closing 25% of calls, with 10% of leads booking: $900 x 0.25 x 0.10 = **$22.50 maximum cost per lead**. Recompute with real numbers after the first calls.

### Decision rules

- **Kill an ad** that spends $60 with no leads, or has link CTR under 0.5% after 2,000 impressions. Leave the ad set running on its other ads.
- **Day 4:** first read. Kill clear losers only. Check that Lead events are arriving in Events Manager with the right cell.
- **Day 7:** if one cell has a CPQL more than twice the best cell with 10 or more leads each, move its budget to the best cell.
- **Day 14, pick the winner:** lowest CPQL, provided at least 40% of its leads qualify. If another cell has booked 2 or more calls and the "winner" none, prefer the booker unless its CPQL is more than twice as high.

### Round 2 (weeks 3 to 6)

- About 70% of budget on the winning cell: 3 to 5 new ads iterating on its best hook, plus 2 Doug-to-camera videos.
- About 20% on the runner-up.
- About 10% on retargeting: landing page visitors who did not become leads (show the testimonial or the 60-second reset), and leads who did not book (show Doug on video inviting them to the session).
- Test the soft gate (`?gate=soft` shows the result before asking for email) against the default hard gate on the winning page.
- Once there are 30 or more bookings, consider optimizing for Schedule instead of Lead.

## 6. Guardrails built into the kit

- **Copy linter** (`npm run lint:ads`) fails on second-person sensitive attributes ("Are you stressed about payroll?"), bad CTA values, em dashes (afresh house style), missing pages and unknown creatives. It warns on health-adjacent words, results claims and long headlines. Today it passes with two expected warnings on the Calm cell.
- **No health claims** on the pages. The reset page carries a safety note (lightheadedness), the footers say coaching is not therapy, and the Full Power check says it is a reflection tool.
- **Tiny Habits** is credited to BJ Fogg. Doug's certification is stated as it is on afresh.io.
- **Testimonials** are quoted from the ones already published on afresh.io. Ask the clients before running them in ads.
- **Privacy page** (`/privacy/`) covers the pixel, HubSpot and Calendly. Doug should review it.

## 7. Risks and what to do about them

| Risk | Sign | Response |
|---|---|---|
| Meta classifies afresh.io as health and wellness | Events Manager shows a data restriction notice, or Lead becomes unavailable as an optimization event | Pause OWN-CALM, take `/reset/` down, request a review. Keep the breathing content inside results pages and emails only |
| An ad is rejected | Ads Manager "Rejected" | Run `npm run lint:ads`, rephrase so the copy describes the topic rather than the viewer, request a review |
| Leads but no bookings | Lead to booking under 3% after 20 or more leads | Check Doug's 24-hour follow-up is happening; test the soft gate; move the booking offer higher on the result page |
| Too few leads to read | Under 10 leads per cell by day 7 | Consolidate to the two best cells rather than extending all four |
| New pixel, no history | Ad sets stuck in "Learning limited" | Expected at $25 a day. Judge by CPQL, not by Meta's learning status |
