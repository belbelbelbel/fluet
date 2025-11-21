# Fluet AI - TODO List

## 🔴 CRITICAL (Must Have)

### 1. **AI Integration** ⚠️ HIGHEST PRIORITY
- [ ] Integrate OpenAI, Anthropic, or another AI service
- [ ] Replace placeholder `generateAIContent` function in `app/api/generate/route.ts`
- [ ] Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Implement proper prompts for each content type (Twitter, Instagram, LinkedIn)
- [ ] Add error handling for AI API failures

**Files to update:**
- `app/api/generate/route.ts` - Replace `generateAIContent` function

---

### 2. **Stripe Webhook Handler** ⚠️ CRITICAL
- [ ] Create `app/api/webhooks/stripe/route.ts`
- [ ] Handle subscription events:
  - `checkout.session.completed` - Activate subscription
  - `customer.subscription.updated` - Update subscription
  - `customer.subscription.deleted` - Cancel subscription
- [ ] Update user subscription status in database
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`

**Why needed:** Without this, subscriptions won't activate after payment!

---

### 3. **Subscription & Usage Limits** ⚠️ CRITICAL
- [ ] Check user subscription before generating content
- [ ] Enforce plan limits:
  - Basic: 100 posts/month
  - Pro: 500 posts/month
  - Enterprise: Unlimited
- [ ] Track usage count per user
- [ ] Show usage stats to user
- [ ] Block generation if limit reached

**Files to create/update:**
- `utils/db/actions.ts` - Add subscription check functions
- `app/api/generate/route.ts` - Add usage limit check

---

## 🟡 IMPORTANT (Should Have)

### 4. **Content History Dashboard**
- [ ] Create page to view past generated content
- [ ] Show content list with filters (by type, date)
- [ ] Allow viewing, copying, deleting old content
- [ ] Add pagination for large lists

**Files to create:**
- `app/history/page.tsx` - Content history page
- `app/api/content/route.ts` - API to fetch user's content

---

### 5. **User Dashboard/Profile**
- [ ] Create dashboard showing:
  - Subscription status
  - Usage stats (posts generated this month)
  - Points balance
  - Recent activity
- [ ] Link from navbar "Dashboard" button

**Files to create:**
- `app/dashboard/page.tsx` - User dashboard

---

### 6. **Points System Implementation**
- [ ] Deduct points when generating content
- [ ] Award points for actions (referrals, etc.)
- [ ] Show points balance in UI
- [ ] Allow using points instead of subscription

**Files to update:**
- `app/api/generate/route.ts` - Deduct points
- `utils/db/actions.ts` - Points management functions

---

## 🟢 NICE TO HAVE

### 7. **Docs Page**
- [ ] Create `/docs` page (referenced in navbar)
- [ ] Add API documentation
- [ ] Usage guides
- [ ] FAQ section

**Files to create:**
- `app/docs/page.tsx`

---

### 8. **Content Export Features**
- [ ] Export content as text file
- [ ] Export as PDF
- [ ] Share content via link
- [ ] Direct post to social media (future)

---

### 9. **Analytics**
- [ ] Track content generation metrics
- [ ] Show analytics dashboard
- [ ] Content performance tracking

---

### 10. **Improvements**
- [ ] Better error messages
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Content templates/presets
- [ ] Bulk generation
- [ ] Content scheduling (future)

---

## 🔧 TECHNICAL DEBT

### 11. **Code Cleanup**
- [ ] Remove `localStorage` usage in server component (`app/page.tsx` line 20)
- [ ] Fix commented-out code in homepage
- [ ] Add proper TypeScript types everywhere
- [ ] Add input validation/sanitization
- [ ] Add rate limiting to API routes

---

### 12. **Environment Variables**
- [ ] Document all required env vars in README
- [ ] Add validation for missing env vars on startup
- [ ] Create `.env.example` with all variables (already done ✅)

---

### 13. **Testing**
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add E2E tests

---

### 14. **Deployment**
- [ ] Set up production database
- [ ] Configure production environment variables
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring/logging
- [ ] Set up error tracking (Sentry, etc.)

---

## 📋 QUICK START CHECKLIST

Before launching, ensure:
- [ ] AI integration is working
- [ ] Stripe webhook is configured and tested
- [ ] Subscription limits are enforced
- [ ] Users can generate and save content
- [ ] Content history is accessible
- [ ] All environment variables are set
- [ ] Database is migrated
- [ ] Error handling is robust
- [ ] Basic analytics are working

---

## 🎯 RECOMMENDED ORDER

1. **AI Integration** (1-2 hours)
2. **Stripe Webhook** (2-3 hours)
3. **Subscription Limits** (2-3 hours)
4. **Content History** (2-3 hours)
5. **User Dashboard** (2-3 hours)
6. **Points System** (1-2 hours)
7. **Polish & Improvements** (ongoing)

**Total estimated time: 12-18 hours for MVP completion**

