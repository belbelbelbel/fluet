# 🎯 Complete User Flow - Agency & Client Dashboards

## 📊 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENCY USER JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

1. SIGN UP
   ┌──────────────┐
   │ Landing Page │
   │ "Get Started"│
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Clerk Sign Up│
   │ (Email/Pass) │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │  Account Created in Database        │
   │  userType: 'agency'                 │
   │  clients: [] (empty)                │
   └──────┬──────────────────────────────┘
          │
          ▼
2. FIRST LOGIN → ONBOARDING
   ┌─────────────────────────────────────┐
   │  /dashboard (checks clients.length) │
   │  If clients.length === 0            │
   │  → Show Onboarding Flow             │
   └──────┬──────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │  STEP 1: Welcome Screen             │
   │  ┌──────────────────────────────┐   │
   │  │  Welcome to Revvy!           │   │
   │  │                              │   │
   │  │  "Manage multiple clients    │   │
   │  │   in one place"              │   │
   │  │                              │   │
   │  │  [Get Started Button]        │   │
   │  └──────────────────────────────┘   │
   └──────┬──────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │  STEP 2: Create First Client        │
   │  ┌──────────────────────────────┐   │
   │  │  Create Your First Client    │   │
   │  │                              │   │
   │  │  Client Name: [________]     │   │
   │  │  Logo URL:   [________]     │   │
   │  │                              │   │
   │  │  [Create Client Button]      │   │
   │  └──────────────────────────────┘   │
   └──────┬──────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │  STEP 3: Setup Complete             │
   │  ┌──────────────────────────────┐   │
   │  │  ✓ Client Created!           │   │
   │  │                              │   │
   │  │  "You're all set to start    │   │
   │  │   managing content"          │   │
   │  │                              │   │
   │  │  [Go to Dashboard Button]    │   │
   │  └──────────────────────────────┘   │
   └──────┬──────────────────────────────┘
          │
          ▼
3. MAIN AGENCY DASHBOARD (With Sidebar)
   ┌─────────────────────────────────────────────────────┐
   │  SIDEBAR          │  MAIN CONTENT AREA               │
   │                  │                                     │
   │  Dashboard     │  Header: [Client Selector]        │
   │  Content Ideas │                                     │
   │  Post Stack    │  ┌─────────────────────────────┐   │
   │  Generate     │  │  Dashboard Overview          │   │
   │               │  │  - Stats Cards               │   │
   │  AUTOMATION   │  │  - Recent Activity          │   │
   │  Schedule     │  │  - Quick Actions            │   │
   │  History      │  └─────────────────────────────┘   │
   │               │                                     │
   │  INSIGHTS     │                                     │
   │  Analytics    │                                     │
   │               │                                     │
   │  SETTINGS     │                                     │
   │  Team         │                                     │
   │  Settings     │                                     │
   └─────────────────────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │  Agency Can Now:                    │
   │  ✓ Create more clients              │
   │  ✓ Generate content                  │
   │  ✓ Schedule posts                    │
   │  ✓ Invite team members               │
   │  ✓ View analytics                    │
   │  ✓ Manage approvals                  │
   └─────────────────────────────────────┘
```

---

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT USER JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

1. AGENCY CREATES CLIENT
   ┌─────────────────────────────────────┐
   │  Agency creates client in dashboard │
   │  Client record created in DB       │
   └──────┬──────────────────────────────┘
          │
          ▼
2. AGENCY SCHEDULES POST
   ┌─────────────────────────────────────┐
   │  Agency schedules post for client   │
   │  Approval token generated           │
   │  Email sent to client               │
   └──────┬──────────────────────────────┘
          │
          ▼
3. CLIENT RECEIVES EMAIL
   ┌─────────────────────────────────────┐
   │  Email: "Review Your Post"          │
   │  Link: /client-portal/[token]      │
   └──────┬──────────────────────────────┘
          │
          ▼
4. CLIENT CLICKS LINK → APPROVAL PAGE
   ┌─────────────────────────────────────┐
   │  /client-portal/[token]             │
   │  ┌──────────────────────────────┐   │
   │  │  Post for Review            │   │
   │  │                              │   │
   │  │  Platform: Instagram         │   │
   │  │  Scheduled: Jan 15, 2:00 PM │   │
   │  │                              │   │
   │  │  Content:                    │   │
   │  │  [Post preview]              │   │
   │  │                              │   │
   │  │  [Approve] [Request Changes] │   │
   │  └──────────────────────────────┘   │
   └──────┬──────────────────────────────┘
          │
          ▼
5. (OPTIONAL) CLIENT LOGS IN → FULL DASHBOARD
   ┌─────────────────────────────────────┐
   │  /client/[clientId]/dashboard        │
   │  ┌──────────────────────────────┐   │
   │  │  Header (No Sidebar)          │   │
   │  │  [Logo] Client Name [Sign Out]│   │
   │  ├──────────────────────────────┤   │
   │  │                               │   │
   │  │  Overview Cards                │   │
   │  │  - Posts This Month           │   │
   │  │  - Pending Approvals          │   │
   │  │  - Engagement Rate            │   │
   │  │                               │   │
   │  │  Tabs:                        │   │
   │  │  [Posts] [Approvals] [Analytics]│
   │  │                               │   │
   │  │  Scheduled Posts List         │   │
   │  │  - Post 1 (Scheduled)         │   │
   │  │  - Post 2 (Pending Approval)  │   │
   │  │  - Post 3 (Published)         │   │
   │  │                               │   │
   │  └──────────────────────────────┘   │
   └─────────────────────────────────────┘
```

---

## 🏢 Agency Dashboard Structure

### **Layout Components**
```
┌──────────────────────────────────────────────┐
│  SIDEBAR (Fixed, 256px)                     │
│  ┌──────────────────────────────────────┐  │
│  │  Logo                                 │  │
│  ├──────────────────────────────────────┤  │
│  │  Dashboard                            │  │
│  │  Content Ideas                        │  │
│  │  Post Stack                           │  │
│  │  Generate                             │  │
│  ├──────────────────────────────────────┤  │
│  │  AUTOMATION                           │  │
│  │  Schedule                             │  │
│  │  History                              │  │
│  ├──────────────────────────────────────┤  │
│  │  INSIGHTS                             │  │
│  │  Analytics                            │  │
│  ├──────────────────────────────────────┤  │
│  │  SETTINGS                             │  │
│  │  Team                                 │  │
│  │  Settings                             │  │
│  └──────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  HEADER (Sticky)                              │
│  [Client Selector] [Theme Toggle] [Profile]  │
├──────────────────────────────────────────────┤
│  MAIN CONTENT (Dynamic)                      │
│  ┌──────────────────────────────────────┐   │
│  │  Page Content                        │   │
│  │  (Changes based on route)            │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### **Pricing & upgrades**
- **Pricing flow:** See **[PRICING_FLOW.md](./PRICING_FLOW.md)** for the single flow: entry points (Nav, Footer, home section), plan IDs (basic/pro/enterprise), checkout (`/checkout?plan=&billing=`), and where limits are enforced (generate, schedule, banners).
- **Entry:** Navbar "Pricing" → `#pricing` on home, `/pricing` elsewhere; Footer → `/pricing`; "Get Started" on pricing → `/checkout`.

### **Pages & Routes**
- `/dashboard` → Main overview (redirects to first client if only one)
- `/dashboard/clients` → Client list (if multiple)
- `/dashboard/clients/[id]` → Client-specific dashboard
- `/dashboard/content-ideas` → AI content ideas
- `/dashboard/post-stack` → Content library
- `/dashboard/generate` → AI content generator
- `/dashboard/schedule` → Schedule posts
- `/dashboard/history` → Post history
- `/dashboard/analytics` → Analytics
- `/dashboard/team` → Team management
- `/dashboard/settings` → Settings

---

## 👥 Client Dashboard Structure

### **Layout Components**
```
┌──────────────────────────────────────────────┐
│  HEADER (Simple, No Sidebar)                 │
│  [Logo] Client Name [Sign Out]               │
├──────────────────────────────────────────────┤
│  MAIN CONTENT (Full Width)                   │
│  ┌──────────────────────────────────────┐   │
│  │  Overview Cards                       │   │
│  │  ┌────┐ ┌────┐ ┌────┐                 │   │
│  │  │ 12 │ │ 3  │ │4.2%│                 │   │
│  │  │Posts│ │Appr│ │Eng │                 │   │
│  │  └────┘ └────┘ └────┘                 │   │
│  ├──────────────────────────────────────┤   │
│  │  Tabs: [Posts] [Approvals] [Analytics]│   │
│  ├──────────────────────────────────────┤   │
│  │  Content Area                        │   │
│  │  (Scheduled posts, approvals, etc.)  │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### **Pages & Routes**
- `/client/[clientId]/dashboard` → Client overview
- `/client/[clientId]/posts` → Scheduled posts
- `/client/[clientId]/approvals` → Pending approvals
- `/client/[clientId]/analytics` → Performance analytics
- `/client-portal/[token]` → Approval link (token-based)

---

## 🔄 Complete Flow Summary

### **Agency First-Time Experience**
1. **Sign Up** → Account created
2. **First Login** → Onboarding shown
3. **Welcome Screen** → Introduction
4. **Create First Client** → Guided form
5. **Setup Complete** → Redirect to dashboard
6. **Main Dashboard** → Full features available

### **Agency Regular Use**
1. **Login** → Dashboard (with sidebar)
2. **Select Client** → From header dropdown
3. **Generate Content** → AI content creation
4. **Schedule Posts** → Set dates/times
5. **Client Approval** → Email sent automatically
6. **View Analytics** → Performance tracking

### **Client Experience**
1. **Receive Email** → Approval request
2. **Click Link** → Token-based approval page
3. **Review Post** → See content preview
4. **Approve/Request Changes** → Submit feedback
5. **(Optional) Login** → Full dashboard access
6. **View Posts & Analytics** → Monitor performance

---

## ✅ Implementation Status

### **Agency Dashboard**
- ✅ Sidebar navigation
- ✅ Client selector
- ✅ Main dashboard page
- ✅ Client management
- ✅ All feature pages
- ⚠️ Onboarding flow (needs improvement)
- ⚠️ Empty state (needs improvement)

### **Client Dashboard**
- ✅ Approval portal (token-based)
- ❌ Full client dashboard layout (NEW - needs implementation)
- ❌ Client authentication (NEW - needs implementation)
- ❌ Client overview page (NEW - needs implementation)
- ❌ Client posts view (NEW - needs implementation)
- ❌ Client analytics view (NEW - needs implementation)

---

## 🎯 Next Implementation Steps

1. **Improve Agency Onboarding**
   - Better welcome screen
   - Step-by-step guide
   - Progress indicators

2. **Create Client Dashboard**
   - New layout component (no sidebar)
   - Client authentication system
   - Client-specific pages

3. **Update Routing**
   - Clear separation: `/dashboard/*` (agency) vs `/client/*` (client)
   - Proper authentication checks

4. **Enhance Empty States**
   - Better onboarding for first-time users
   - Helpful tooltips and guides
