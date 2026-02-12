# Google Calendar Integration Setup Guide

## Overview

Google Calendar integration allows users to receive email and push reminders for posts that need manual posting (LinkedIn, TikTok, or when accounts aren't connected).

## How It Works

1. **User connects Google Calendar** in Settings
2. **User schedules a post** for LinkedIn or TikTok
3. **Cron job runs** every 1 minute
4. **If post is due and needs manual posting:**
   - Creates Google Calendar event
   - User receives email/push reminder at scheduled time
   - User clicks reminder → Opens app → Copies content → Posts manually

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALENDAR_REDIRECT_URI=https://yourdomain.com/api/google-calendar/callback
```

## Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "Fluet Calendar Integration"
5. Authorized redirect URIs:
   - `http://localhost:3000/api/google-calendar/callback` (for local dev)
   - `https://yourdomain.com/api/google-calendar/callback` (for production)

### Step 3: Get Credentials

1. Copy **Client ID** → Set as `GOOGLE_CLIENT_ID`
2. Copy **Client Secret** → Set as `GOOGLE_CLIENT_SECRET`
3. Set redirect URI in environment variables

## Scopes Required

The integration uses these Google Calendar scopes:
- `https://www.googleapis.com/auth/calendar.events` - Create calendar events
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar (for verification)

## Features

### ✅ What It Does

- Creates Google Calendar events for LinkedIn/TikTok posts
- Sends email reminders 30 minutes, 15 minutes, and 5 minutes before posting time
- Sends push notifications (if user has Google Calendar app)
- Includes post content and link to app in event description
- Uses Nigerian timezone (Africa/Lagos)

### ✅ What It Doesn't Do

- Doesn't auto-post through Google Calendar (that's not possible)
- Doesn't replace in-app notifications (works alongside them)
- Doesn't require Google Calendar app (works with email reminders too)

## User Flow

1. **Connect**: User goes to Settings → Connects Google Calendar
2. **Schedule**: User schedules LinkedIn/TikTok post
3. **Reminder**: Google Calendar sends reminder at scheduled time
4. **Post**: User clicks reminder → Opens app → Copies content → Posts manually

## Testing

### Local Testing

1. Set up OAuth credentials in Google Cloud Console
2. Add redirect URI: `http://localhost:3000/api/google-calendar/callback`
3. Set environment variables in `.env.local`
4. Test connection in Settings page
5. Schedule a LinkedIn/TikTok post
6. Check Google Calendar for event creation

### Production Testing

1. Update redirect URI in Google Cloud Console to production URL
2. Set environment variables in Vercel
3. Test full flow: Connect → Schedule → Receive reminder

## Troubleshooting

### "Failed to create calendar event"

- Check if access token is valid
- Verify Google Calendar API is enabled
- Check token expiration and refresh logic

### "OAuth error"

- Verify redirect URI matches exactly in Google Cloud Console
- Check client ID and secret are correct
- Ensure OAuth consent screen is configured

### "Token expired"

- Refresh token should automatically refresh access token
- Check refresh token is stored in database
- Verify token refresh logic in status endpoint

## Code Structure

```
utils/google-calendar/
  ├── oauth.ts          # OAuth flow & token management
  └── events.ts         # Calendar event creation

app/api/google-calendar/
  ├── auth/route.ts     # Initiate OAuth flow
  ├── callback/route.ts # Handle OAuth callback
  ├── status/route.ts   # Check connection status
  └── disconnect/route.ts # Disconnect account
```

## Next Steps

1. Set up Google Cloud project
2. Create OAuth credentials
3. Add environment variables
4. Test connection flow
5. Schedule test post
6. Verify calendar event creation

---

**Note**: This integration works alongside the existing in-app notification system. Users get both Google Calendar reminders AND in-app notifications for maximum reliability.
