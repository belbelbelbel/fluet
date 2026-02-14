# Cron Job Setup Guide for Vercel Hobby Plan

## Problem
Vercel Hobby plan only allows cron jobs to run **once per day**, but we need to check for scheduled posts **every minute** for accurate timing.

## Solution
Use a **free external cron service** to call our API endpoint every minute, while keeping Vercel Cron as a daily backup.

---

## Setup Instructions

### Option 1: Use cron-job.org (Recommended - Free)

1. **Sign up** at [https://cron-job.org](https://cron-job.org) (free account)

2. **Create a new cron job:**
   - **Title:** Fluet Scheduled Posts
   - **URL:** `https://your-domain.vercel.app/api/cron/post-scheduled?secret=YOUR_CRON_SECRET`
   - **Schedule:** Every minute (`* * * * *`)
   - **Request Method:** GET
   - **Save**

3. **Get your CRON_SECRET:**
   - Add to your `.env.local` and Vercel environment variables:
     ```
     CRON_SECRET=your-random-secret-string-here
     ```
   - Use a strong random string (e.g., generate with: `openssl rand -hex 32`)

4. **Test the endpoint:**
   - Visit: `https://your-domain.vercel.app/api/cron/post-scheduled?secret=YOUR_CRON_SECRET`
   - Should return JSON with `success: true`

---

### Option 2: Use EasyCron (Free)

1. **Sign up** at [https://www.easycron.com](https://www.easycron.com)

2. **Create cron job:**
   - **Cron Job Name:** Fluet Posts
   - **URL:** `https://your-domain.vercel.app/api/cron/post-scheduled?secret=YOUR_CRON_SECRET`
   - **Schedule:** `* * * * *` (every minute)
   - **HTTP Method:** GET
   - **Save**

---

### Option 3: Use GitHub Actions (Free for public repos)

1. Create `.github/workflows/cron.yml`:
   ```yaml
   name: Scheduled Posts Cron
   on:
     schedule:
       - cron: '* * * * *'  # Every minute
     workflow_dispatch:  # Manual trigger
   
   jobs:
     cron:
       runs-on: ubuntu-latest
       steps:
         - name: Call Cron Endpoint
           run: |
             curl -X GET "https://your-domain.vercel.app/api/cron/post-scheduled?secret=${{ secrets.CRON_SECRET }}"
   ```

2. Add `CRON_SECRET` to GitHub Secrets

---

## Current Configuration

### Vercel Cron (Backup)
- **Schedule:** Daily at midnight (`0 0 * * *`)
- **Purpose:** Backup in case external cron fails
- **File:** `vercel.json`

### External Cron (Primary)
- **Schedule:** Every minute (`* * * * *`)
- **Purpose:** Accurate post timing
- **Service:** Choose one from options above

---

## Security

The endpoint is protected by `CRON_SECRET`. Make sure to:
- ✅ Use a strong, random secret
- ✅ Never commit `CRON_SECRET` to git
- ✅ Add it to Vercel environment variables
- ✅ Use HTTPS only

---

## Testing

1. **Test locally:**
   ```bash
   curl "http://localhost:3000/api/cron/post-scheduled?secret=YOUR_CRON_SECRET"
   ```

2. **Test in production:**
   ```bash
   curl "https://your-domain.vercel.app/api/cron/post-scheduled?secret=YOUR_CRON_SECRET"
   ```

3. **Check logs:**
   - Vercel Dashboard → Functions → `/api/cron/post-scheduled`
   - Look for `[Cron] Starting scheduled posts check...`

---

## Troubleshooting

### Error: "Unauthorized"
- Check that `CRON_SECRET` matches in both:
  - Your `.env.local` / Vercel environment variables
  - The URL parameter in your cron service

### Posts not posting
- Check Vercel function logs
- Verify cron service is actually calling the endpoint
- Check that scheduled posts have `scheduledFor <= now` and `posted = false`

### Upgrade to Pro Plan
If you upgrade to Vercel Pro ($20/month), you can:
- Use Vercel Cron every minute
- Remove external cron service
- Update `vercel.json` to `"schedule": "* * * * *"`

---

## Recommended: cron-job.org

**Why cron-job.org?**
- ✅ Free tier (up to 2 cron jobs)
- ✅ Reliable uptime
- ✅ Easy setup
- ✅ Email notifications on failures
- ✅ No credit card required

**Setup time:** ~5 minutes
