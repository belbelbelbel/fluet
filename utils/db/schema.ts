import { varchar, pgTable, integer, serial, text, timestamp, boolean, jsonb, date } from 'drizzle-orm/pg-core'

export const Users = pgTable('users', {
  id: serial('id').primaryKey(),
  stripecustomerId: text('stripe_customer_Id').unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  points: integer('points').default(50),
  userType: varchar('user_type', { length: 50 }).default('agency'), // agency, team_member
  agencyId: integer('agency_id').references(() => Users.id), // For team members
  timestamp: timestamp('timestamp').defaultNow()
})

export const Subscription = pgTable('subscription', {
  stripesubscripionId: varchar('kora_subscripion_id', { length: 255 }).notNull(),
  userid: integer('user_id').references(() => Users.id).notNull(),
  plan: varchar('plan', { length: 50 }).notNull(),
  startdate: timestamp('start_date').defaultNow(),
  enddate: timestamp('end_date').defaultNow(),
  canceldate: boolean('cancel_date').notNull().default(false)
})

export const GeneratedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  content: text("content").notNull(),
  prompt: text("prompt").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  tone: varchar("tone", { length: 50 }),
  style: varchar("style", { length: 50 }),
  length: varchar("length", { length: 50 }),
  posted: boolean("posted").default(false),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const LinkedAccounts = pgTable("linked_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // twitter, instagram, linkedin, tiktok
  accountId: text("account_id"), // Made optional - can be set later after fetching channel info
  accountUsername: text("account_username"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Multi-Client Management Tables (defined before ScheduledPosts to allow reference)

export const Clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .references(() => Users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  email: varchar("email", { length: 255 }), // Client email for invitations
  status: varchar("status", { length: 50 }).default("pending"), // pending, active, inactive
  paymentStatus: varchar("payment_status", { length: 50 }).default("paid"), // paid, overdue, pending
  paymentDueDate: date("payment_due_date"),
  invitedAt: timestamp("invited_at"),
  activatedAt: timestamp("activated_at"),
  lastLoginAt: timestamp("last_login_at"),
  deactivatedAt: timestamp("deactivated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ScheduledPosts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  clientId: integer("client_id").references(() => Clients.id), // New: Link to client
  contentId: integer("content_id")
    .references(() => GeneratedContent.id),
  platform: varchar("platform", { length: 50 }).notNull(),
  content: text("content").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  posted: boolean("posted").default(false),
  postedAt: timestamp("posted_at"),
  approvalStatus: varchar("approval_status", { length: 50 }).default('pending'), // pending, approved, changes_requested, rejected
  requiresApproval: boolean("requires_approval").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ContentAnalytics = pgTable("content_analytics", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id")
    .references(() => GeneratedContent.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  engagementRate: integer("engagement_rate").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const TeamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  invitedBy: integer("invited_by")
    .references(() => Users.id)
    .notNull(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(), // Unique token for invitation link
  role: varchar("role", { length: 50 }).default("member"), // owner, admin, member
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at"), // Invitation expiration (e.g., 7 days)
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const TeamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  teamOwnerId: integer("team_owner_id")
    .references(() => Users.id)
    .notNull(), // The user who owns/manages this team
  role: varchar("role", { length: 50 }).default("member"), // owner, admin, member
  invitationId: integer("invitation_id")
    .references(() => TeamInvitations.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // team_invitation, team_joined, content_generated, post_scheduled, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // Optional link to related page
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ClientBrandVoice = pgTable("client_brand_voice", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  tone: varchar("tone", { length: 100 }), // formal, casual, funny, professional
  slangLevel: varchar("slang_level", { length: 50 }), // none, light, moderate, heavy
  industry: varchar("industry", { length: 100 }),
  dos: jsonb("dos"), // Array of do's
  donts: jsonb("donts"), // Array of don'ts
  examplePosts: jsonb("example_posts"), // Array of example posts
  preferredHashtags: jsonb("preferred_hashtags"), // Array of hashtags
  bannedWords: jsonb("banned_words"), // Array of banned words
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ClientContentBank = pgTable("client_content_bank", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // slogan, hashtag_set, color, logo, caption, image, video
  content: text("content"),
  metadata: jsonb("metadata"), // For colors, file URLs, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ClientCredits = pgTable("client_credits", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  postsPerMonth: integer("posts_per_month").default(12),
  postsUsed: integer("posts_used").default(0),
  revisionsPerPost: integer("revisions_per_post").default(3),
  rushRequests: integer("rush_requests").default(2),
  rushUsed: integer("rush_used").default(0),
  resetDate: date("reset_date"), // When credits reset
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const PostApprovals = pgTable("post_approvals", {
  id: serial("id").primaryKey(),
  scheduledPostId: integer("scheduled_post_id")
    .references(() => ScheduledPosts.id, { onDelete: "cascade" })
    .notNull(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  approvalToken: varchar("approval_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, changes_requested, rejected
  clientComment: text("client_comment"),
  expiresAt: timestamp("expires_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const Tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  scheduledPostId: integer("scheduled_post_id")
    .references(() => ScheduledPosts.id, { onDelete: "cascade" }),
  assignedTo: integer("assigned_to")
    .references(() => Users.id),
  assignedBy: integer("assigned_by")
    .references(() => Users.id),
  type: varchar("type", { length: 100 }).notNull(), // design_image, write_caption, review_copy, approve
  status: varchar("status", { length: 50 }).default("assigned"), // assigned, in_progress, completed
  dueDate: timestamp("due_date"),
  description: text("description"),
  comments: jsonb("comments"), // Array of comments with user_id, message, timestamp
  attachments: jsonb("attachments"), // Array of file URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const AgencyTeamMembers = pgTable("agency_team_members", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .references(() => Users.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => Users.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 100 }).notNull(), // designer, copywriter, manager, admin
  permissions: jsonb("permissions"), // Permission matrix
  invitedBy: integer("invited_by")
    .references(() => Users.id),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  joinedAt: timestamp("joined_at"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, active, inactive
  createdAt: timestamp("created_at").defaultNow().notNull(), // keep in sync with existing DB column
});

export const ClientReports = pgTable("client_reports", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  agencyId: integer("agency_id")
    .references(() => Users.id, { onDelete: "cascade" })
    .notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  reportData: jsonb("report_data").notNull(), // All metrics stored here
  pdfUrl: text("pdf_url"),
  sentToClient: boolean("sent_to_client").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Accounts - Links Clerk users to roles and clients/agencies
export const UserAccounts = pgTable("user_accounts", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull(), // "agency" | "client"
  clientId: integer("client_id").references(() => Clients.id, { onDelete: "cascade" }),
  agencyId: integer("agency_id").references(() => Users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client Invitations - For inviting clients to create accounts
export const ClientInvitations = pgTable("client_invitations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => Clients.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});