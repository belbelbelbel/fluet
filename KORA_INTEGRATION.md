# Kora Payment Integration Guide

## Overview

Your Fluet AI app now supports **dual payment processing**:
- **Stripe**: For international customers and card payments globally
- **Kora**: For local African users paying via local banks or mobile money

## What's Been Implemented

### 1. **Pricing Page Updates** (`app/pricing/page.tsx`)
- Added payment method selection UI (Stripe/Kora toggle)
- Updated subscription flow to support both providers
- Dynamic button text showing selected payment provider

### 2. **Kora Checkout API** (`app/api/create-kora-checkout/route.ts`)
- Creates Kora payment sessions
- Handles payment link generation
- Returns redirect URL for user payment

### 3. **Kora Webhook Handler** (`app/api/webhooks/kora/route.ts`)
- Processes Kora payment webhooks
- Activates subscriptions on successful payment
- Updates subscription status in database

## Configuration Required

### Environment Variables

Add these to your `.env.local`:

```env
# Kora Payment Processing
KORA_API_KEY=your_kora_api_key_here
KORA_API_URL=https://api.korapay.com/api/v1/charges
KORA_CURRENCY=NGN  # or your local currency (NGN, KES, GHS, etc.)
KORA_WEBHOOK_SECRET=your_kora_webhook_secret_here
```

### Kora Dashboard Setup

1. **Get API Credentials:**
   - Log in to your Kora dashboard
   - Navigate to API settings
   - Copy your `KORA_API_KEY`

2. **Configure Webhook:**
   - Go to Webhooks section in Kora dashboard
   - Add webhook endpoint: `https://yourdomain.com/api/webhooks/kora`
   - Select events to listen for:
     - `charge.success` or `charge.completed`
     - `charge.failed`
   - Copy the webhook secret to `KORA_WEBHOOK_SECRET`

3. **Set Currency:**
   - Update `KORA_CURRENCY` based on your target market:
     - `NGN` for Nigeria
     - `KES` for Kenya
     - `GHS` for Ghana
     - etc.

## Important Notes

### ⚠️ API Structure Adjustment Needed

The Kora integration uses a **generic payment gateway pattern**. You'll need to adjust the API calls in `app/api/create-kora-checkout/route.ts` based on Kora's actual API documentation:

1. **Check Kora API Documentation** for:
   - Correct endpoint URL
   - Request payload structure
   - Response format
   - Authentication method (Bearer token, API key in header, etc.)

2. **Update the following in `app/api/create-kora-checkout/route.ts`:**
   - `koraApiUrl` - Use Kora's actual API endpoint
   - `koraPayload` - Match Kora's expected request format
   - Response parsing - Extract payment link from Kora's actual response structure

3. **Update Webhook Handler** (`app/api/webhooks/kora/route.ts`):
   - Implement Kora's signature verification method
   - Adjust event names to match Kora's webhook events
   - Parse webhook payload according to Kora's structure

### Currency Conversion

The current implementation converts USD prices to cents. For African currencies:
- **NGN (Nigerian Naira)**: 1 USD ≈ 1,500 NGN (adjust based on current rates)
- **KES (Kenyan Shilling)**: 1 USD ≈ 150 KES
- Update the conversion logic in `app/api/create-kora-checkout/route.ts` if needed

### Testing

1. **Test Stripe Flow:**
   - Select "Stripe" payment method
   - Subscribe to a plan
   - Verify Stripe checkout redirects correctly

2. **Test Kora Flow:**
   - Select "Kora" payment method
   - Subscribe to a plan
   - Verify Kora payment link redirects correctly
   - Complete test payment in Kora sandbox
   - Verify webhook receives and processes payment

## Database Schema

The existing `Subscription` table supports both providers:
- `stripesubscripionId` field stores:
  - Stripe subscription IDs (format: `sub_...`)
  - Kora references (format: `kora_...`)

## User Experience

1. User visits `/pricing`
2. User selects payment method (Stripe or Kora)
3. User clicks "Subscribe with [Provider]"
4. User is redirected to payment provider's checkout
5. After payment, user is redirected back to `/pricing?success=true`
6. Webhook activates subscription in database

## Support

If you encounter issues:
1. Check Kora API documentation for exact endpoint and payload format
2. Verify webhook URL is accessible from Kora's servers
3. Check server logs for webhook processing errors
4. Ensure environment variables are set correctly

