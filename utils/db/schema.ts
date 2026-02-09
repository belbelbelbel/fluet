import { varchar, pgTable, integer, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const Users = pgTable('users', {
  id: serial('id').primaryKey(),
  stripecustomerId: text('stripe_customer_Id').unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  points: integer('points').default(50),
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

export const ScheduledPosts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => Users.id)
    .notNull(),
  contentId: integer("content_id")
    .references(() => GeneratedContent.id),
  platform: varchar("platform", { length: 50 }).notNull(),
  content: text("content").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  posted: boolean("posted").default(false),
  postedAt: timestamp("posted_at"),
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