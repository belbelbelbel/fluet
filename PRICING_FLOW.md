# Pricing & Checkout Flow

This is the **single flow** used across the app for pricing and upgrades.

---

## Flow diagram

- **Pricing page / landing section:** Plan cards only (name, price, features, **Get Started**). No Stripe or Kora on the cards.
- **Checkout page (separate):** Order summary (plan name, description, total due today) + **Payment method** (Stripe or Kora) and card/billing details. This is where payment provider and all payment details live.

```
Landing / Home          Pricing page              Checkout (separate page)    Payment
     │                       │                        │                        │
     │   "View Pricing"      │   Select plan          │   Sign in (if needed)  │
     │   or Nav "Pricing"    │   Monthly/Yearly       │   Order summary       │
     └──────────────────────►│   [Get Started]         │   Stripe / Kora       │
                            │   (no Stripe/Kora)     │   Card & billing      │
                            └───────────────────────►│   [Complete Purchase] │
                                                     └───────────────────────►│
                                                                              ▼
                                                                     Webhook → Activate plan
```

---

## Entry points

| Where | Action | Destination |
|-------|--------|-------------|
| **Navbar** | "Pricing" | `#pricing` on home, or `/pricing` on other pages |
| **Footer** | "Pricing" | `/pricing` |
| **Home** | "View Pricing" / section | `#pricing` (PricingSection) |
| **Docs / Features** | "View Pricing" | `/pricing` |
| **Checkout** | "Back to pricing" | `/pricing` |

---

## Plans (source of truth: `app/pricing/page.tsx` & `app/checkout/page.tsx`)

| Plan ID      | Name        | Price (monthly) | Stripe priceId                      | Usage limit (see `utils/subscription/limits.ts`) |
|--------------|-------------|------------------|-------------------------------------|--------------------------------------------------|
| `basic`      | Basic plan  | ₦10,000          | price_1PyFKGBibz3ZDixDAaJ3HO74      | 100 posts/month                                  |
| `pro`        | Business    | ₦25,000          | price_1PyFN0Bibz3ZDixDqm9eYL8W      | 500 posts/month                                  |
| `enterprise` | Enterprise  | Custom           | null (contact sales)                | Unlimited                                        |

- **Yearly:** 10 months price (2 months free). Same plan IDs, `billing=yearly` in checkout URL.

---

## Checkout flow

1. **Pricing** (`/pricing`): User picks plan + monthly/yearly → clicks "Get Started".
2. **Redirect:** `router.push(\`/checkout?plan=${planId}&billing=${billingCycle}\`)`
3. **Checkout** (`/checkout`):
   - If not signed in → redirect to sign-in with `redirect_url=/checkout`.
   - User selects **Stripe** or **Kora**.
   - Submits → `POST /api/create-checkout-session` or `POST /api/create-kora-checkout` with `priceId`, `userId`, `planName`, `amount`, `billingCycle`.
   - Stripe: redirect to Stripe Checkout; success/cancel return URLs.
   - Kora: similar server-driven flow.
4. **After payment:** Stripe/Kora webhook (e.g. `app/api/webhooks/stripe/route.ts`) updates subscription in DB. Limits (e.g. `checkUsageLimit` in generate API) use plan from DB.

---

## Where pricing is “considered” in the app

- **Generate:** `checkUsageLimit()` → blocks when over limit; can show upgrade message / link to `/pricing`.
- **Schedule:** Same blocking when payment/credits blocked (AlertBanner); can link to billing/pricing.
- **Dashboard:** AlertBanner for payment overdue / credits; “View” can go to client billing or `/pricing`.
- **Docs / FAQ:** “View Pricing”, “upgrade from Pricing page” → `/pricing`.

Use this flow and these entry points for any new “Upgrade” or “Pricing” links so behaviour stays consistent.
