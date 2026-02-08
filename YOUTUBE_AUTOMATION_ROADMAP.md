# YouTube Automation - Implementation Roadmap

## ✅ What's Currently Implemented

### 1. OAuth Connection ✅
- **Status**: Fully working
- **What it does**: Users can connect their YouTube account
- **Files**: 
  - `utils/youtube/oauth.ts` - OAuth flow
  - `app/api/youtube/auth/route.ts` - Auth initiation
  - `app/api/youtube/callback/route.ts` - Token exchange
  - `app/api/youtube/status/route.ts` - Connection status check

### 2. Token Management ✅
- **Status**: Fully working
- **What it does**: Automatically refreshes expired tokens
- **Files**: 
  - `utils/youtube/token-manager.ts` - Token refresh logic
  - `utils/youtube/upload-service.ts` - Token validation

### 3. Content Ideas Database ✅
- **Status**: Ready
- **What it does**: Provides YouTube-specific content ideas
- **Files**: 
  - `lib/youtube-content-ideas.ts` - Content ideas database

### 4. Metadata Generation ✅
- **Status**: Ready
- **What it does**: Generates titles, descriptions, tags
- **Files**: 
  - `utils/youtube/metadata-generator.ts` - SEO metadata generation

### 5. Asset Management ✅
- **Status**: Structure ready (needs actual assets)
- **What it does**: Manages audio/visual asset selection
- **Files**: 
  - `utils/youtube/asset-manager.ts` - Asset selection logic

---

## ❌ What's Missing (Blocking Auto-Posting)

### 1. Video File Generation 🔴 CRITICAL
**Status**: Not implemented
**What's needed**:
- FFmpeg integration to merge audio + visuals
- Video rendering pipeline
- File system handling for temporary videos

**Required**:
- Install FFmpeg: `npm install fluent-ffmpeg @types/fluent-ffmpeg`
- Create video generation service
- Handle file I/O (reading/writing video files)

### 2. Complete Upload Service 🔴 CRITICAL
**Status**: Partial (structure exists, file handling missing)
**What's needed**:
- Read actual video files from disk/storage
- Upload video file bytes to YouTube API
- Handle large file uploads (chunked/resumable)

**Current issue**: Line 117 in `upload-service.ts` shows `// body: videoFileBuffer` - this needs actual file data

### 3. Automation Worker/Queue System 🔴 CRITICAL
**Status**: Not implemented
**What's needed**:
- Background job system (BullMQ or similar)
- Queue for scheduled video generation
- Queue for scheduled video uploads
- Retry logic for failed uploads

**Required**:
- Install queue library: `npm install bullmq ioredis`
- Set up Redis (for queue storage)
- Create worker processes

### 4. Video Storage System 🔴 CRITICAL
**Status**: Not implemented
**What's needed**:
- Temporary storage for generated videos
- File cleanup after upload
- Storage quota management

**Options**:
- Local filesystem (simple, for MVP)
- Cloud storage (S3, Cloudinary) - better for production

### 5. Video Generation Service 🔴 CRITICAL
**Status**: Not implemented
**What's needed**:
- Service to combine audio + visual assets
- Video rendering with FFmpeg
- Quality/format conversion

---

## 📋 Step-by-Step Implementation Plan

### Phase 1: Video Generation (Week 1)

#### Step 1.1: Install Dependencies
```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg
npm install @ffmpeg-installer/ffmpeg
```

#### Step 1.2: Create Video Generation Service
**File**: `utils/youtube/video-generator.ts`
**What it does**:
- Takes audio + visual assets
- Uses FFmpeg to merge them
- Outputs MP4 file
- Handles looping for long videos

#### Step 1.3: Set Up Asset Storage
**What you need**:
- Create `/public/assets/audio/` directory
- Create `/public/assets/visuals/` directory
- Add actual audio files (rain sounds, ambient, etc.)
- Add actual video files (background visuals)

**Asset Sources**:
- Free: Pexels Videos, Pixabay, Unsplash
- Paid: Envato Elements, Storyblocks
- AI-generated: RunwayML, Pika Labs

### Phase 2: Upload Service Completion (Week 1-2)

#### Step 2.1: Complete File Reading
**Update**: `utils/youtube/upload-service.ts`
- Read video file from disk
- Convert to buffer
- Handle file size limits

#### Step 2.2: Implement Resumable Upload
- Handle large file uploads
- Implement chunked upload
- Add progress tracking

### Phase 3: Automation Queue (Week 2)

#### Step 3.1: Install Queue System
```bash
npm install bullmq ioredis
```

#### Step 3.2: Set Up Redis
**Options**:
- Local: `docker run -d -p 6379:6379 redis`
- Cloud: Upstash Redis (free tier available)

#### Step 3.3: Create Queue Workers
**Files to create**:
- `workers/youtube-video-generator.ts` - Generates videos
- `workers/youtube-uploader.ts` - Uploads videos
- `app/api/youtube/queue/route.ts` - Queue management API

### Phase 4: Integration (Week 2-3)

#### Step 4.1: Connect to Schedule System
- Link YouTube posts to schedule page
- Auto-generate videos when scheduled
- Auto-upload at scheduled time

#### Step 4.2: Error Handling
- Retry failed uploads
- Notify users of failures
- Log errors for debugging

---

## 🎯 What YOU Need to Do

### Immediate Actions (This Week)

1. **Get YouTube Credentials** ✅ (Already done - you have them in `.env.local`)

2. **Collect Video Assets**
   - Download or create audio files (rain, ambient, white noise)
   - Download or create video backgrounds (rain visuals, nature, abstract)
   - Store them in `/public/assets/audio/` and `/public/assets/visuals/`
   - **Recommended**: Start with 5-10 assets per category

3. **Install FFmpeg**
   ```bash
   # macOS
   brew install ffmpeg
   
   # Or use npm package
   npm install @ffmpeg-installer/ffmpeg
   ```

4. **Set Up Redis** (for queue system)
   ```bash
   # Using Docker (easiest)
   docker run -d -p 6379:6379 --name redis redis
   
   # Or use Upstash (cloud, free tier)
   # Sign up at upstash.com
   ```

### Next Steps (After Assets Ready)

1. **I'll implement video generation service**
   - FFmpeg integration
   - Audio + visual merging
   - Video file creation

2. **I'll complete upload service**
   - File reading
   - Actual video upload
   - Error handling

3. **I'll set up automation queue**
   - Background workers
   - Scheduled generation
   - Scheduled uploads

---

## 📦 Required Packages

```bash
# Video processing
npm install fluent-ffmpeg @types/fluent-ffmpeg @ffmpeg-installer/ffmpeg

# Queue system
npm install bullmq ioredis

# File handling (if needed)
npm install fs-extra @types/fs-extra
```

---

## 🔧 Environment Variables Needed

Add to `.env.local`:
```env
# YouTube (already have these)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback

# Redis (for queue)
REDIS_URL=redis://localhost:6379
# OR for Upstash:
# REDIS_URL=redis://default:password@host:port

# Storage (optional, for cloud storage)
# AWS_S3_BUCKET=your-bucket
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
```

---

## 🎬 Video Generation Workflow

1. **User schedules YouTube post** → Creates entry in schedule table
2. **Queue worker picks up job** → Generates video from assets
3. **Video generated** → Saved to temporary storage
4. **Upload worker picks up job** → Uploads to YouTube
5. **Upload complete** → Video published/scheduled on YouTube
6. **Cleanup** → Temporary file deleted

---

## 💡 Quick Start Checklist

- [ ] YouTube credentials in `.env.local` ✅ (You have this)
- [ ] Collect 5-10 audio assets (rain, ambient, white noise)
- [ ] Collect 5-10 video backgrounds (rain, nature, abstract)
- [ ] Install FFmpeg on your system
- [ ] Set up Redis (Docker or Upstash)
- [ ] Install required npm packages
- [ ] Let me know when assets are ready → I'll implement the rest!

---

## 🚀 Estimated Timeline

- **Week 1**: Video generation + upload service
- **Week 2**: Queue system + automation
- **Week 3**: Testing + polish

**Total**: ~2-3 weeks for full automation

---

## ❓ Questions?

**Q: Do I need to buy assets?**
A: No! Start with free assets from Pexels/Pixabay. You can upgrade later.

**Q: Can I use AI-generated videos?**
A: Yes! Tools like RunwayML, Pika Labs can generate backgrounds.

**Q: How much storage do I need?**
A: For MVP, local storage is fine. Each video ~50-100MB. Clean up after upload.

**Q: Do I need Redis immediately?**
A: For MVP testing, you can skip queue and do direct uploads. But for production, you need it.

---

**Next Action**: Collect your video assets, then I'll implement the video generation and upload services! 🎬
