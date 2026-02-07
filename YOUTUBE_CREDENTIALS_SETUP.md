# YouTube API Credentials Setup Guide

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Click on the project dropdown at the top
- Click "New Project" or select an existing project
- Give it a name (e.g., "Flippr YouTube Integration")
- Click "Create"

### 3. Enable YouTube Data API v3
- In the search bar at the top, type "YouTube Data API v3"
- Click on "YouTube Data API v3"
- Click "Enable"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials" (left sidebar)
- Click "+ CREATE CREDENTIALS" at the top
- Select "OAuth client ID"

### 5. Configure OAuth Consent Screen (if not done)
- If prompted, you'll need to configure the OAuth consent screen first:
  - User Type: Choose "External" (unless you have a Google Workspace)
  - App name: "Flippr AI" (or your app name)
  - User support email: Your email
  - Developer contact: Your email
  - Click "Save and Continue"
  - Scopes: Click "Add or Remove Scopes"
    - Search and add:
      - `https://www.googleapis.com/auth/youtube.upload`
      - `https://www.googleapis.com/auth/youtube`
      - `https://www.googleapis.com/auth/youtube.readonly`
    - Click "Update" then "Save and Continue"
  - Test users: Add your Google account email (for testing)
  - Click "Save and Continue" then "Back to Dashboard"

### 6. Create OAuth Client ID
- Application type: Select "Web application"
- Name: "Flippr YouTube Client" (or any name)
- Authorized JavaScript origins:
  - Add: `http://localhost:3000` (for local development)
  - Add: `https://yourdomain.com` (for production)
- Authorized redirect URIs:
  - Add: `http://localhost:3000/oauth2callback` (for local development)
  - Add: `https://yourdomain.com/oauth2callback` (for production)
- Click "Create"

### 7. Copy Your Credentials
After creating, you'll see a popup with:
- **Client ID** (this is your `YOUTUBE_CLIENT_ID`)
- **Client secret** (this is your `YOUTUBE_CLIENT_SECRET`)

**⚠️ IMPORTANT:** Copy these immediately - you won't be able to see the client secret again!

### 8. Add to .env.local File

Create or edit `.env.local` in your project root and add:

```env
# YouTube API Credentials
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

**Replace:**
- `your_client_id_here` with your actual Client ID
- `your_client_secret_here` with your actual Client Secret
- Update `YOUTUBE_REDIRECT_URI` if your app runs on a different port or domain

### 9. Restart Your Development Server
After adding the credentials:
```bash
# Stop your server (Ctrl+C)
# Then restart it
npm run dev
```

## Quick Reference

### Required Environment Variables:
```env
YOUTUBE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

### Where to Find Credentials Later:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Click to view/edit (you can see Client ID, but not the secret)

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in `.env.local` matches exactly what you added in Google Cloud Console
- Check for trailing slashes or http vs https

### Error: "invalid_client"
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces in `.env.local`
- Restart your dev server after adding credentials

### Error: "access_denied"
- Make sure you added the required scopes in OAuth consent screen
- Check that your Google account is added as a test user (if app is in testing mode)

## Production Setup

For production:
1. Update OAuth consent screen to "In production" (requires verification)
2. Add your production domain to authorized origins and redirect URIs
3. Update `.env.local` (or production environment variables) with production redirect URI
