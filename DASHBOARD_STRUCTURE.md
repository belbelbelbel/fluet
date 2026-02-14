# 🏗️ Dashboard Structure & User Flow

## Overview
Revvy has **two distinct dashboard types**:
1. **Agency Dashboard** - Full-featured with sidebar navigation
2. **Client Dashboard** - Simplified, focused view without sidebar

---

## 🎯 Agency Dashboard Flow

### **First-Time User Experience (Onboarding)**

#### Step 1: Sign Up
- User signs up via Clerk authentication
- Account created in database with `userType: 'agency'`

#### Step 2: First Login → Onboarding
- User lands on `/dashboard`
- System checks: `clients.length === 0`
- **Shows onboarding flow** instead of empty dashboard

#### Step 3: Onboarding Steps
1. **Welcome Screen**
   - "Welcome to Revvy!"
   - Brief explanation of what they can do
   - "Get Started" button

2. **Create First Client**
   - Guided form to create first client
   - Client name, logo (optional)
   - "Create Client" button

3. **Setup Complete**
   - "You're all set!"
   - "Go to Dashboard" button
   - Redirects to main dashboard

#### Step 4: Main Dashboard (After Onboarding)
- Full dashboard with sidebar
- Client selector in header
- All features available

---

## 🏢 Agency Dashboard Structure

### **Layout**
```
┌─────────────────────────────────────────┐
│  Sidebar (Fixed)  │  Main Content      │
│                    │                    │
│  - Dashboard       │  Header            │
│  - Content Ideas   │  (Client Selector) │
│  - Post Stack      │                    │
│  - Generate        │  Content Area     │
│                    │  (Dynamic)        │
│  AUTOMATION        │                    │
│  - Schedule        │                    │
│  - History         │                    │
│                    │                    │
│  INSIGHTS          │                    │
│  - Analytics       │                    │
│                    │                    │
│  SETTINGS          │                    │
│  - Team            │                    │
│  - Settings        │                    │
└─────────────────────────────────────────┘
```

### **Pages**
- `/dashboard` - Main overview (redirects to first client if only one)
- `/dashboard/clients` - Client list (if multiple clients)
- `/dashboard/clients/[id]` - Client-specific dashboard
- `/dashboard/content-ideas` - AI content ideas
- `/dashboard/post-stack` - Content library
- `/dashboard/generate` - AI content generator
- `/dashboard/schedule` - Schedule posts
- `/dashboard/history` - Post history
- `/dashboard/analytics` - Analytics
- `/dashboard/team` - Team management
- `/dashboard/settings` - Settings

### **Features**
- ✅ Sidebar navigation
- ✅ Client selector in header
- ✅ Full feature set
- ✅ Multi-client management
- ✅ Team collaboration

---

## 👥 Client Dashboard Structure

### **Layout**
```
┌─────────────────────────────────────────┐
│  Header (Simple)                        │
│  - Logo                                 │
│  - Client Name                          │
│  - Sign Out                             │
├─────────────────────────────────────────┤
│                                         │
│  Main Content (Full Width)              │
│                                         │
│  - Overview Cards                       │
│  - Scheduled Posts                      │
│  - Pending Approvals                    │
│  - Analytics                            │
│                                         │
└─────────────────────────────────────────┘
```

### **Pages**
- `/client/[clientId]/dashboard` - Client overview
- `/client/[clientId]/posts` - Scheduled posts
- `/client/[clientId]/approvals` - Pending approvals
- `/client/[clientId]/analytics` - Performance analytics
- `/client-portal/[token]` - Approval link (existing)

### **Features**
- ❌ No sidebar (cleaner, focused)
- ✅ Simple header navigation
- ✅ View-only access (no editing)
- ✅ Approval workflow
- ✅ Analytics view
- ✅ Brand voice preferences

### **Access**
- Clients get unique login credentials OR
- Access via secure token links (for approvals)
- Separate authentication from agency

---

## 🔄 Complete User Flow

### **Agency Flow**
```
1. Sign Up
   ↓
2. First Login → Onboarding
   ↓
3. Create First Client
   ↓
4. Main Dashboard (with sidebar)
   ↓
5. Manage Multiple Clients
   ↓
6. Generate Content
   ↓
7. Schedule Posts
   ↓
8. Client Approvals
   ↓
9. Analytics & Reports
```

### **Client Flow**
```
1. Receive Approval Link (Email)
   ↓
2. Click Link → Approval Page
   ↓
3. Review Post
   ↓
4. Approve/Request Changes
   ↓
5. (Optional) Login to Full Dashboard
   ↓
6. View Scheduled Posts
   ↓
7. View Analytics
   ↓
8. Manage Preferences
```

---

## 📋 Implementation Checklist

### **Agency Dashboard**
- [x] Sidebar navigation
- [x] Client selector
- [x] Main dashboard page
- [x] Client management
- [ ] Onboarding flow (NEW)
- [ ] Empty state improvements

### **Client Dashboard**
- [x] Approval portal (token-based)
- [ ] Full client dashboard layout (NEW)
- [ ] Client authentication (NEW)
- [ ] Client overview page (NEW)
- [ ] Client posts view (NEW)
- [ ] Client analytics view (NEW)

---

## 🎨 Design Principles

### **Agency Dashboard**
- **Complexity**: High (many features)
- **Navigation**: Sidebar for quick access
- **Purpose**: Manage multiple clients efficiently
- **Users**: Social media managers, agencies

### **Client Dashboard**
- **Complexity**: Low (focused features)
- **Navigation**: Simple header tabs
- **Purpose**: Review and approve content
- **Users**: Business owners, clients

---

## 🚀 Next Steps

1. **Create Agency Onboarding**
   - Welcome screen
   - Guided client creation
   - Setup completion

2. **Create Client Dashboard**
   - New layout (no sidebar)
   - Client authentication
   - Client-specific pages

3. **Update Routing**
   - Separate routes for client dashboard
   - Clear separation of concerns

4. **Update Documentation**
   - User guides
   - API documentation
