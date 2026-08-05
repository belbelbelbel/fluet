import { db } from "./dbConfig"
import { eq, sql, desc, and, gte, lte, or } from "drizzle-orm"
import { 
    GeneratedContent, 
    Users, 
    Subscription, 
    ScheduledPosts, 
    LinkedAccounts, 
    Notifications,
    Clients,
    ClientBrandVoice,
    ClientContentBank,
    ClientCredits,
    PostApprovals,
    Tasks,
    AgencyTeamMembers,
    ClientReports,
    TeamInvitations,
    IdeasCache,
    ClientIdeaRefreshes,
} from "./schema"
import { sendWelcomeEmail } from "./mailtrap"

export const CreateOrUpdateUser = async (stripecustomerId: string, email: string, name: string) => {
    try {
        const [existingUser] = await db
            .select({
                id: Users.id,
                stripecustomerId: Users.stripecustomerId,
                email: Users.email,
                name: Users.name,
                points: Users.points,
                timestamp: Users.timestamp,
            })
            .from(Users)
            .where(eq(Users.stripecustomerId, stripecustomerId))
            .limit(1)
            .execute();
        if (existingUser) {
            const [updatedUser] = await db
                .update(Users)
                .set({ email, name })
                .where(eq(Users.stripecustomerId, stripecustomerId))
                .returning({
                    id: Users.id,
                    stripecustomerId: Users.stripecustomerId,
                    email: Users.email,
                    name: Users.name,
                    points: Users.points,
                    timestamp: Users.timestamp,
                })
                .execute();
            console.log(`[CreateOrUpdateUser] User updated successfully:`, updatedUser);
            return updatedUser;
        } else {
            console.log(`[CreateOrUpdateUser] User not found, creating new one...`);
            const [newUser] = await db
                .insert(Users)
                .values({
                    email,
                    stripecustomerId,
                    name
                })
                .returning({
                    id: Users.id,
                    stripecustomerId: Users.stripecustomerId,
                    email: Users.email,
                    name: Users.name,
                    points: Users.points,
                    timestamp: Users.timestamp,
                })
                .execute();

            console.log(`[CreateOrUpdateUser] Insert operation successful. New user:`, newUser);
            sendWelcomeEmail(email, name);
            console.log(`[CreateOrUpdateUser] Welcome email sent to:`, email);
            return newUser;
        }
    } 

    catch (error: any) {
        console.error(`[CreateOrUpdateUser] Error encountered:`, error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
            console.error(`[CreateOrUpdateUser] Error message: ${error.message}`);
            console.error(`[CreateOrUpdateUser] Error stack: ${error.stack}`);
            
            // Check for specific database errors
            if (error.message.includes('relation "users" does not exist') || 
                error.message.includes('does not exist')) {
                throw new Error("users table does not exist. Please run: npx drizzle-kit push");
            }
            if (error.message.includes('violates') || error.message.includes('constraint')) {
                throw new Error(`Database constraint violation: ${error.message}`);
            }
            if (error.message.includes('connection') || error.message.includes('timeout')) {
                throw new Error(`Database connection error: ${error.message}`);
            }
            
            throw new Error(`Failed to create or update user: ${error.message}`);
        }
        
        throw new Error(`Failed to create or update user: ${String(error)}`);
    }
};

export const GetUserByClerkId = async (clerkUserId: string) => {
    try {
        const [user] = await db
            .select({
                id: Users.id,
                stripecustomerId: Users.stripecustomerId,
                email: Users.email,
                name: Users.name,
                points: Users.points,
                timestamp: Users.timestamp,
            })
            .from(Users)
            .where(eq(Users.stripecustomerId, clerkUserId))
            .limit(1)
            .execute();
        return user || null;
    } catch (error) {
        console.error(`[GetUserByClerkId] Error encountered:`, error);
        // Return null instead of throwing so calling code can handle user creation
        return null;
    }
};

export const GetUserByEmail = async (email: string) => {
    try {
        const [user] = await db
            .select({
                id: Users.id,
                stripecustomerId: Users.stripecustomerId,
                email: Users.email,
                name: Users.name,
                points: Users.points,
                timestamp: Users.timestamp,
            })
            .from(Users)
            .where(eq(Users.email, email))
            .limit(1)
            .execute();
        return user;
    } catch (error) {
        console.error(`[GetUserByEmail] Error encountered:`, error);
        throw new Error("Failed to get user by email");
    }
};

export const GetUserGeneratedContent = async (userId: number, limit: number = 10, clientId?: number | null) => {
    try {
        const conditions = clientId != null
            ? and(eq(GeneratedContent.userId, userId), eq(GeneratedContent.clientId, clientId))
            : eq(GeneratedContent.userId, userId);
        const content = await db
            .select()
            .from(GeneratedContent)
            .where(conditions)
            .orderBy(desc(GeneratedContent.createdAt))
            .limit(limit)
            .execute();
        if (content.length > 0 && process.env.NODE_ENV === "development") {
            console.log(`[GetUserGeneratedContent] Found ${content.length} items for user ${userId}${clientId != null ? `, client ${clientId}` : ""}`);
        }
        return content;
    } catch (error) {
        console.error(`[GetUserGeneratedContent] Error encountered:`, error);
        if (error instanceof Error) {
            console.error(`[GetUserGeneratedContent] Error message: ${error.message}`);
        }
        throw new Error("Failed to get generated content");
    }
};

export const SaveGeneratedContent = async (
    userId: number,
    prompt: string,
    content: string,
    contentType: string,
    tone?: string,
    style?: string,
    length?: string,
    clientId?: number | null,
    aiTokensUsed?: number,
    aiCostUsd?: number
) => {
    try {
        // Validate inputs
        if (!userId || typeof userId !== 'number') {
            throw new Error(`Invalid userId: ${userId}`);
        }
        if (!prompt || !prompt.trim()) {
            throw new Error("Prompt is required");
        }
        if (!content || !content.trim()) {
            throw new Error("Content is required");
        }
        if (!contentType) {
            throw new Error("Content type is required");
        }

        // Truncate if too long (database constraints)
        const truncatedPrompt = prompt.length > 10000 ? prompt.substring(0, 10000) : prompt;
        const truncatedContent = content.length > 50000 ? content.substring(0, 50000) : content;
        const truncatedTone = tone && tone.length > 50 ? tone.substring(0, 50) : tone;
        const truncatedStyle = style && style.length > 50 ? style.substring(0, 50) : style;
        const truncatedLength = length && length.length > 50 ? length.substring(0, 50) : length;

        console.log(`[SaveGeneratedContent] Saving content for user ${userId}, contentType: ${contentType}`);
        
        const [savedContent] = await db
            .insert(GeneratedContent)
            .values({
                userId,
                clientId: clientId ?? null,
                prompt: truncatedPrompt,
                content: truncatedContent,
                contentType,
                tone: truncatedTone || null,
                style: truncatedStyle || null,
                length: truncatedLength || null,
                aiTokensUsed: aiTokensUsed ?? null,
                aiCostUsd: aiCostUsd != null ? aiCostUsd : null,
            })
            .returning()
            .execute();
        
        if (!savedContent) {
            throw new Error("Insert returned no result");
        }
        
        console.log(`[SaveGeneratedContent] Successfully saved content with ID: ${savedContent.id}`);
        return savedContent;
    } catch (error) {
        console.error(`[SaveGeneratedContent] Error encountered:`, error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
            console.error(`[SaveGeneratedContent] Error message: ${error.message}`);
            console.error(`[SaveGeneratedContent] Error stack: ${error.stack}`);
            
            // Check for specific database errors
            if (error.message.includes('foreign key')) {
                throw new Error(`User with ID ${userId} does not exist in database`);
            }
            if (error.message.includes('violates')) {
                throw new Error(`Database constraint violation: ${error.message}`);
            }
            if (error.message.includes('connection') || error.message.includes('timeout')) {
                throw new Error(`Database connection error: ${error.message}`);
            }
            
            throw new Error(`Failed to save generated content: ${error.message}`);
        }
        
        throw new Error(`Failed to save generated content: ${String(error)}`);
    }
};

export const GetUserSubscription = async (userId: number) => {
    try {
        const [subscription] = await db
            .select()
            .from(Subscription)
            .where(
                and(
                    eq(Subscription.userid, userId),
                    eq(Subscription.canceldate, false)
                )
            )
            .orderBy(desc(Subscription.startdate))
            .limit(1)
            .execute();
        return subscription || null;
    } catch (error) {
        console.error(`[GetUserSubscription] Error encountered:`, error);
        return null;
    }
};

/** While Stripe/Kora are not configured, seed a local Pro subscription so limits/UI work. */
export const EnsureLocalSubscription = async (userId: number) => {
    if (isPaymentProviderConfigured()) {
        return null;
    }

    const existing = await GetUserSubscription(userId);
    if (existing) {
        return existing;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    try {
        const [subscription] = await db
            .insert(Subscription)
            .values({
                stripesubscripionId: `local_${userId}_${Date.now()}`,
                userid: userId,
                plan: "pro",
                startdate: startDate,
                enddate: endDate,
                canceldate: false,
            })
            .returning()
            .execute();

        console.log(`[EnsureLocalSubscription] Created local Pro subscription for user ${userId}`);
        return subscription;
    } catch (error) {
        console.error("[EnsureLocalSubscription] Error:", error);
        return null;
    }
};

function isPaymentProviderConfigured(): boolean {
    return !!(
        process.env.STRIPE_SECRET_KEY?.trim() ||
        process.env.KORA_API_KEY?.trim()
    );
}

/** @deprecated Use EnsureLocalSubscription */
export const EnsureDevSubscription = EnsureLocalSubscription;

export const GetUserUsageCount = async (userId: number) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(GeneratedContent)
            .where(
                and(
                    eq(GeneratedContent.userId, userId),
                    gte(GeneratedContent.createdAt, startOfMonth)
                )
            )
            .execute();
        return Number(result[0]?.count) || 0;
    } catch (error) {
        console.error(`[GetUserUsageCount] Error encountered:`, error);
        return 0;
    }
};

/**
 * Get AI cost for an agency (userId = agency owner) over a period
 */
export const GetAgencyAICostForPeriod = async (
    userId: number,
    startDate: Date,
    endDate?: Date
): Promise<{ totalCostUsd: number; totalTokens: number; count: number }> => {
    try {
        const conditions = [
            eq(GeneratedContent.userId, userId),
            gte(GeneratedContent.createdAt, startDate),
        ];
        if (endDate) {
            conditions.push(lte(GeneratedContent.createdAt, endDate));
        }
        const result = await db
            .select({
                totalCost: sql<number>`COALESCE(SUM(${GeneratedContent.aiCostUsd}), 0)::real`,
                totalTokens: sql<number>`COALESCE(SUM(${GeneratedContent.aiTokensUsed}), 0)::int`,
                count: sql<number>`count(*)::int`,
            })
            .from(GeneratedContent)
            .where(and(...conditions))
            .execute();
        const row = result[0];
        return {
            totalCostUsd: Number(row?.totalCost) || 0,
            totalTokens: Number(row?.totalTokens) || 0,
            count: Number(row?.count) || 0,
        };
    } catch (error) {
        console.error(`[GetAgencyAICostForPeriod] Error:`, error);
        return { totalCostUsd: 0, totalTokens: 0, count: 0 };
    }
};

// Scheduled Posts Actions

export const CreateScheduledPost = async (
    userId: number,
    contentId: number | null,
    platform: string,
    content: string,
    scheduledFor: Date,
    clientId?: number | null,
    requiresApproval?: boolean
) => {
    try {
        const [scheduledPost] = await db
            .insert(ScheduledPosts)
            .values({
                userId,
                clientId: clientId || null,
                contentId: contentId || null,
                platform,
                content,
                scheduledFor,
                posted: false,
                approvalStatus: requiresApproval ? "pending" : "approved",
                requiresApproval: requiresApproval ?? (clientId ? true : false),
            })
            .returning()
            .execute();
        return scheduledPost;
    } catch (error) {
        console.error(`[CreateScheduledPost] Error encountered:`, error);
        throw new Error("Failed to create scheduled post");
    }
};

export const GetUserScheduledPosts = async (userId: number) => {
    try {
        const posts = await db
            .select()
            .from(ScheduledPosts)
            .where(eq(ScheduledPosts.userId, userId))
            .orderBy(desc(ScheduledPosts.scheduledFor))
            .execute();
        return posts;
    } catch (error) {
        console.error(`[GetUserScheduledPosts] Error encountered:`, error);
        throw new Error("Failed to get scheduled posts");
    }
};

export const DeleteScheduledPost = async (postId: number, userId: number) => {
    try {
        await db
            .delete(ScheduledPosts)
            .where(
                and(
                    eq(ScheduledPosts.id, postId),
                    eq(ScheduledPosts.userId, userId)
                )
            )
            .execute();
        return true;
    } catch (error) {
        console.error(`[DeleteScheduledPost] Error encountered:`, error);
        throw new Error("Failed to delete scheduled post");
    }
};

export const UpdateScheduledPost = async (
    postId: number,
    userId: number,
    updates: {
        content?: string;
        scheduledFor?: Date;
        platform?: string;
    }
) => {
    try {
        const [updatedPost] = await db
            .update(ScheduledPosts)
            .set(updates)
            .where(
                and(
                    eq(ScheduledPosts.id, postId),
                    eq(ScheduledPosts.userId, userId)
                )
            )
            .returning()
            .execute();
        return updatedPost;
    } catch (error) {
        console.error(`[UpdateScheduledPost] Error encountered:`, error);
        throw new Error("Failed to update scheduled post");
    }
};

// Linked Accounts Actions (for YouTube, Twitter, etc.)

export const SaveOrUpdateLinkedAccount = async (data: {
    userId: number;
    platform: string;
    accountId?: string;
    accountUsername?: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
    isActive?: boolean;
}) => {
    try {
        // Check if account already exists
        const [existing] = await db
            .select()
            .from(LinkedAccounts)
            .where(
                and(
                    eq(LinkedAccounts.userId, data.userId),
                    eq(LinkedAccounts.platform, data.platform)
                )
            )
            .limit(1)
            .execute();

        if (existing) {
            // Update existing account
            const [updated] = await db
                .update(LinkedAccounts)
                .set({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    tokenExpiresAt: data.tokenExpiresAt,
                    isActive: data.isActive ?? true,
                    ...(data.accountId && { accountId: data.accountId }),
                    ...(data.accountUsername && { accountUsername: data.accountUsername }),
                })
                .where(eq(LinkedAccounts.id, existing.id))
                .returning()
                .execute();
            return updated;
        } else {
            // Create new account
            const [created] = await db
                .insert(LinkedAccounts)
                .values({
                    userId: data.userId,
                    platform: data.platform,
                    accountId: data.accountId || null,
                    accountUsername: data.accountUsername || null,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    tokenExpiresAt: data.tokenExpiresAt,
                    isActive: data.isActive ?? true,
                })
                .returning()
                .execute();
            return created;
        }
    } catch (error: any) {
        console.error(`[SaveOrUpdateLinkedAccount] Error encountered:`, error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
            console.error(`[SaveOrUpdateLinkedAccount] Error message: ${error.message}`);
            console.error(`[SaveOrUpdateLinkedAccount] Error stack: ${error.stack}`);
            
            // Check for specific database errors
            if (error.message.includes('relation "linked_accounts" does not exist') || 
                error.message.includes('does not exist')) {
                throw new Error("linked_accounts table does not exist. Please run: npx drizzle-kit push");
            }
            if (error.message.includes('foreign key')) {
                throw new Error(`User with ID ${data.userId} does not exist in database`);
            }
            if (error.message.includes('violates') || error.message.includes('constraint')) {
                throw new Error(`Database constraint violation: ${error.message}`);
            }
            if (error.message.includes('connection') || error.message.includes('timeout')) {
                throw new Error(`Database connection error: ${error.message}`);
            }
            
            throw new Error(`Failed to save linked account: ${error.message}`);
        }
        
        throw new Error(`Failed to save linked account: ${String(error)}`);
    }
};

export const GetLinkedAccount = async (userId: number, platform: string) => {
    try {
        const [account] = await db
            .select()
            .from(LinkedAccounts)
            .where(
                and(
                    eq(LinkedAccounts.userId, userId),
                    eq(LinkedAccounts.platform, platform),
                    eq(LinkedAccounts.isActive, true)
                )
            )
            .limit(1)
            .execute();
        return account || null;
    } catch (error) {
        console.error(`[GetLinkedAccount] Error encountered:`, error);
        return null;
    }
};

export const UpdateLinkedAccountToken = async (
    userId: number,
    platform: string,
    accessToken: string,
    tokenExpiresAt: Date
) => {
    try {
        const [updated] = await db
            .update(LinkedAccounts)
            .set({
                accessToken,
                tokenExpiresAt,
            })
            .where(
                and(
                    eq(LinkedAccounts.userId, userId),
                    eq(LinkedAccounts.platform, platform)
                )
            )
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[UpdateLinkedAccountToken] Error encountered:`, error);
        throw new Error("Failed to update token");
    }
};

export const DisconnectLinkedAccount = async (
    userId: number,
    platform: string
) => {
    try {
        // Just deactivate the account instead of deleting tokens
        // This allows reconnection without losing the account reference
        const [updated] = await db
            .update(LinkedAccounts)
            .set({
                isActive: false,
            })
            .where(
                and(
                    eq(LinkedAccounts.userId, userId),
                    eq(LinkedAccounts.platform, platform)
                )
            )
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[DisconnectLinkedAccount] Error encountered:`, error);
        throw new Error("Failed to disconnect account");
    }
};

// Scheduled Posts Actions

/**
 * Get all scheduled posts that are due to be posted
 * (scheduledFor <= now AND posted = false AND (no approval required OR approved))
 */
export const GetPendingScheduledPosts = async () => {
    try {
        const now = new Date();
        const posts = await db
            .select()
            .from(ScheduledPosts)
            .where(
                and(
                    lte(ScheduledPosts.scheduledFor, now),
                    eq(ScheduledPosts.posted, false),
                    or(
                        eq(ScheduledPosts.requiresApproval, false),
                        eq(ScheduledPosts.approvalStatus, "approved")
                    )
                )
            )
            .orderBy(ScheduledPosts.scheduledFor)
            .execute();
        return posts;
    } catch (error) {
        console.error(`[GetPendingScheduledPosts] Error encountered:`, error);
        throw new Error("Failed to get pending scheduled posts");
    }
};

/**
 * Mark a scheduled post as posted
 */
export const MarkScheduledPostAsPosted = async (postId: number) => {
    try {
        const [updated] = await db
            .update(ScheduledPosts)
            .set({
                posted: true,
                postedAt: new Date(),
            })
            .where(eq(ScheduledPosts.id, postId))
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[MarkScheduledPostAsPosted] Error encountered:`, error);
        throw new Error("Failed to mark post as posted");
    }
};

// Notification Actions

/**
 * Create a notification for a user
 */
export const CreateNotification = async (
    userId: number,
    type: string,
    title: string,
    message: string,
    link?: string
) => {
    try {
        const [notification] = await db
            .insert(Notifications)
            .values({
                userId,
                type,
                title,
                message,
                link: link || null,
                read: false,
            })
            .returning()
            .execute();
        return notification;
    } catch (error) {
        console.error(`[CreateNotification] Error encountered:`, error);
        throw new Error("Failed to create notification");
    }
};

/**
 * Get all notifications for a user
 */
export const GetUserNotifications = async (userId: number, unreadOnly: boolean = false) => {
    try {
        const conditions = [eq(Notifications.userId, userId)];
        if (unreadOnly) {
            conditions.push(eq(Notifications.read, false));
        }
        
        const notifications = await db
            .select()
            .from(Notifications)
            .where(and(...conditions))
            .orderBy(desc(Notifications.createdAt))
            .execute();
        return notifications;
    } catch (error) {
        console.error(`[GetUserNotifications] Error encountered:`, error);
        throw new Error("Failed to get notifications");
    }
};

/**
 * Mark a notification as read
 */
export const MarkNotificationAsRead = async (notificationId: number) => {
    try {
        const [updated] = await db
            .update(Notifications)
            .set({
                read: true,
                readAt: new Date(),
            })
            .where(eq(Notifications.id, notificationId))
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[MarkNotificationAsRead] Error encountered:`, error);
        throw new Error("Failed to mark notification as read");
    }
};

/**
 * Get pending posts that need manual posting reminders
 * (posts that are due but can't be auto-posted)
 */
export const GetPostsNeedingReminders = async () => {
    try {
        const now = new Date();
        const posts = await db
            .select()
            .from(ScheduledPosts)
            .where(
                and(
                    lte(ScheduledPosts.scheduledFor, now),
                    eq(ScheduledPosts.posted, false)
                )
            )
            .orderBy(ScheduledPosts.scheduledFor)
            .execute();
        
        // Filter posts that need reminders (platforms that can't auto-post)
        const postsNeedingReminders = posts.filter(post => {
            const platform = post.platform.toLowerCase();
            // Platforms that need manual posting:
            // - linkedin (requires Company Page)
            // - tiktok (no reliable API)
            // - twitter (if no account connected)
            // - instagram (if no account connected or no image)
            return ["linkedin", "tiktok"].includes(platform);
        });
        
        return postsNeedingReminders;
    } catch (error) {
        console.error(`[GetPostsNeedingReminders] Error encountered:`, error);
        throw new Error("Failed to get posts needing reminders");
    }
};

// ==================== CLIENT MANAGEMENT ====================

/**
 * Create a new client for an agency
 */
export const CreateClient = async (data: {
    agencyId: number;
    name: string;
    logoUrl?: string;
    email?: string;
    status?: string;
    paymentStatus?: string;
    paymentDueDate?: Date;
}) => {
    try {
        console.log(`[CreateClient] Creating client for agency ${data.agencyId} with name: ${data.name}`);
        
        const [client] = await db
            .insert(Clients)
            .values({
                agencyId: data.agencyId,
                name: data.name,
                logoUrl: data.logoUrl,
                email: data.email,
                status: data.status || "active",
                paymentStatus: data.paymentStatus || "paid",
                paymentDueDate: data.paymentDueDate
                    ? data.paymentDueDate.toISOString().slice(0, 10)
                    : undefined,
                updatedAt: new Date(),
            })
            .returning()
            .execute();

        if (!client || !client.id) {
            throw new Error("Client creation returned null or client without id");
        }

        console.log(`[CreateClient] Client created with ID: ${client.id}`);

        // Create default credits for client
        try {
            await db
                .insert(ClientCredits)
                .values({
                    clientId: client.id,
                    postsPerMonth: 12,
                    postsUsed: 0,
                    revisionsPerPost: 3,
                    rushRequests: 2,
                    rushUsed: 0,
                    resetDate: (() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + 1);
                        return d.toISOString().slice(0, 10);
                    })(),
                    updatedAt: new Date(),
                })
                .execute();
            console.log(`[CreateClient] Default credits created for client ${client.id}`);
        } catch (creditsError) {
            console.error(`[CreateClient] Error creating default credits:`, creditsError);
            // Don't fail the whole operation if credits creation fails
            // The client was created successfully
        }

        return client;
    } catch (error: any) {
        console.error(`[CreateClient] Error encountered:`, error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
            console.error(`[CreateClient] Error message: ${error.message}`);
            console.error(`[CreateClient] Error stack: ${error.stack}`);
            
            // Check for specific database errors
            if (error.message.includes('relation "clients" does not exist') || 
                error.message.includes('does not exist')) {
                throw new Error("clients table does not exist. Please run: npx drizzle-kit push");
            }
            if (error.message.includes('foreign key')) {
                throw new Error(`Agency with ID ${data.agencyId} does not exist in database`);
            }
            if (error.message.includes('violates') || error.message.includes('constraint')) {
                throw new Error(`Database constraint violation: ${error.message}`);
            }
            if (error.message.includes('connection') || error.message.includes('timeout')) {
                throw new Error(`Database connection error: ${error.message}`);
            }
            
            throw new Error(`Failed to create client: ${error.message}`);
        }
        
        throw new Error(`Failed to create client: ${String(error)}`);
    }
};

/**
 * Get all clients for an agency
 */
export const GetClientsByAgency = async (agencyId: number) => {
    try {
        const clients = await db
            .select()
            .from(Clients)
            .where(eq(Clients.agencyId, agencyId))
            .orderBy(desc(Clients.createdAt))
            .execute();
        return clients;
    } catch (error) {
        console.error(`[GetClientsByAgency] Error encountered:`, error);
        throw new Error("Failed to get clients");
    }
};

/**
 * Get a single client by ID (with agency verification)
 */
export const GetClientById = async (clientId: number, agencyId: number) => {
    try {
        const [client] = await db
            .select()
            .from(Clients)
            .where(
                and(
                    eq(Clients.id, clientId),
                    eq(Clients.agencyId, agencyId)
                )
            )
            .limit(1)
            .execute();
        return client;
    } catch (error) {
        console.error(`[GetClientById] Error encountered:`, error);
        throw new Error("Failed to get client");
    }
};

/**
 * Update a client
 */
export const UpdateClient = async (
    clientId: number,
    agencyId: number,
    data: {
        name?: string;
        email?: string | null;
        logoUrl?: string | null;
        status?: string;
        paymentStatus?: string;
        paymentDueDate?: Date | string | null;
    }
) => {
    try {
        const { paymentDueDate, ...clientFields } = data;
        const [updated] = await db
            .update(Clients)
            .set({
                ...clientFields,
                ...(paymentDueDate !== undefined && {
                    paymentDueDate:
                        paymentDueDate === null
                            ? null
                            : paymentDueDate instanceof Date
                              ? paymentDueDate.toISOString().slice(0, 10)
                              : paymentDueDate,
                }),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(Clients.id, clientId),
                    eq(Clients.agencyId, agencyId)
                )
            )
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[UpdateClient] Error encountered:`, error);
        throw new Error("Failed to update client");
    }
};

/**
 * Delete a client (soft delete by setting status to 'deleted')
 */
export const DeleteClient = async (clientId: number, agencyId: number) => {
    try {
        const [deleted] = await db
            .update(Clients)
            .set({
                status: "deleted",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(Clients.id, clientId),
                    eq(Clients.agencyId, agencyId)
                )
            )
            .returning()
            .execute();
        return deleted;
    } catch (error) {
        console.error(`[DeleteClient] Error encountered:`, error);
        throw new Error("Failed to delete client");
    }
};

// ==================== CLIENT BRAND VOICE ====================

/**
 * Create or update client brand voice
 */
export const SaveClientBrandVoice = async (data: {
    clientId: number;
    brandDescription?: string;
    targetAudience?: string;
    niche?: string;
    primaryIndustry?: string;
    nicheDescription?: string;
    tone?: string;
    slangLevel?: string;
    industry?: string;
    dos?: string[];
    donts?: string[];
    examplePosts?: string[];
    preferredHashtags?: string[];
    bannedWords?: string[];
}) => {
    try {
        // Check if brand voice exists
        const [existing] = await db
            .select()
            .from(ClientBrandVoice)
            .where(eq(ClientBrandVoice.clientId, data.clientId))
            .limit(1)
            .execute();

        if (existing) {
            // Update existing
            const [updated] = await db
                .update(ClientBrandVoice)
                .set({
                    brandDescription: data.brandDescription,
                    targetAudience: data.targetAudience,
                    niche: data.niche,
                    primaryIndustry: data.primaryIndustry,
                    nicheDescription: data.nicheDescription,
                    tone: data.tone,
                    slangLevel: data.slangLevel,
                    industry: data.industry,
                    dos: data.dos as any,
                    donts: data.donts as any,
                    examplePosts: data.examplePosts as any,
                    preferredHashtags: data.preferredHashtags as any,
                    bannedWords: data.bannedWords as any,
                    updatedAt: new Date(),
                })
                .where(eq(ClientBrandVoice.clientId, data.clientId))
                .returning()
                .execute();
            return updated;
        } else {
            // Create new
            const [created] = await db
                .insert(ClientBrandVoice)
                .values({
                    clientId: data.clientId,
                    brandDescription: data.brandDescription,
                    targetAudience: data.targetAudience,
                    niche: data.niche,
                    primaryIndustry: data.primaryIndustry,
                    nicheDescription: data.nicheDescription,
                    tone: data.tone,
                    slangLevel: data.slangLevel,
                    industry: data.industry,
                    dos: data.dos as any,
                    donts: data.donts as any,
                    examplePosts: data.examplePosts as any,
                    preferredHashtags: data.preferredHashtags as any,
                    bannedWords: data.bannedWords as any,
                    updatedAt: new Date(),
                })
                .returning()
                .execute();
            return created;
        }
    } catch (error) {
        console.error(`[SaveClientBrandVoice] Error encountered:`, error);
        throw new Error("Failed to save brand voice");
    }
};

/**
 * Get client brand voice
 */
export const GetClientBrandVoice = async (clientId: number) => {
    try {
        const [brandVoice] = await db
            .select()
            .from(ClientBrandVoice)
            .where(eq(ClientBrandVoice.clientId, clientId))
            .limit(1)
            .execute();
        return brandVoice;
    } catch (error) {
        console.error(`[GetClientBrandVoice] Error encountered:`, error);
        throw new Error("Failed to get brand voice");
    }
};

// ==================== IDEAS CACHE ====================

export const GetIdeasFromCache = async (nicheString: string) => {
    try {
        const normalized = nicheString.toLowerCase().trim().replace(/\s+/g, " ");
        const [row] = await db
            .select()
            .from(IdeasCache)
            .where(eq(IdeasCache.nicheString, normalized))
            .limit(1)
            .execute();
        return row?.ideas as Record<string, unknown>[] | null ?? null;
    } catch (error) {
        console.error(`[GetIdeasFromCache] Error:`, error);
        return null;
    }
};

export const UpsertIdeasCache = async (
    nicheString: string,
    ideas: Record<string, unknown>[],
) => {
    try {
        const normalized = nicheString.toLowerCase().trim().replace(/\s+/g, " ");
        const [existing] = await db
            .select({ id: IdeasCache.id })
            .from(IdeasCache)
            .where(eq(IdeasCache.nicheString, normalized))
            .limit(1)
            .execute();

        if (existing) {
            const ideasWithIds = ideas.map((idea, i) => ({
                ...idea,
                id: `cache_${existing.id}_${i}`,
            }));
            await db
                .update(IdeasCache)
                .set({
                    ideas: ideasWithIds as any,
                    createdAt: new Date(),
                })
                .where(eq(IdeasCache.id, existing.id))
                .execute();
            return existing.id;
        } else {
            const tempIdeas = ideas.map((idea, i) => ({ ...idea, id: `temp_${i}` }));
            const [inserted] = await db
                .insert(IdeasCache)
                .values({
                    nicheString: normalized,
                    ideas: tempIdeas as any,
                })
                .returning({ id: IdeasCache.id })
                .execute();
            const id = inserted?.id;
            if (id) {
                const ideasWithProperIds = ideas.map((idea, i) => ({
                    ...idea,
                    id: `cache_${id}_${i}`,
                }));
                await db
                    .update(IdeasCache)
                    .set({ ideas: ideasWithProperIds as any })
                    .where(eq(IdeasCache.id, id))
                    .execute();
            }
            return id ?? 0;
        }
    } catch (error) {
        console.error(`[UpsertIdeasCache] Error:`, error);
        throw new Error("Failed to cache ideas");
    }
};

export const GetCachedIdeaById = async (ideaId: string) => {
    const match = ideaId.match(/^cache_(\d+)_(\d+)$/);
    if (!match) return null;
    const [, cacheIdStr, indexStr] = match;
    const cacheId = parseInt(cacheIdStr!, 10);
    const index = parseInt(indexStr!, 10);
    if (isNaN(cacheId) || isNaN(index)) return null;
    try {
        const [row] = await db
            .select({ ideas: IdeasCache.ideas })
            .from(IdeasCache)
            .where(eq(IdeasCache.id, cacheId))
            .limit(1)
            .execute();
        const ideas = row?.ideas as Record<string, unknown>[] | null;
        if (!Array.isArray(ideas) || index < 0 || index >= ideas.length) return null;
        return ideas[index];
    } catch {
        return null;
    }
};

export const GetClientIdeaRefreshCountThisMonth = async (clientId: number) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(ClientIdeaRefreshes)
            .where(
                and(
                    eq(ClientIdeaRefreshes.clientId, clientId),
                    gte(ClientIdeaRefreshes.refreshedAt, startOfMonth)
                )
            )
            .execute();
        return result[0]?.count ?? 0;
    } catch (error) {
        console.error(`[GetClientIdeaRefreshCount] Error:`, error);
        return 0;
    }
};

export const RecordClientIdeaRefresh = async (
    clientId: number,
    nicheString?: string
) => {
    try {
        await db
            .insert(ClientIdeaRefreshes)
            .values({
                clientId,
                nicheString: nicheString ?? null,
            })
            .execute();
    } catch (error) {
        console.error(`[RecordClientIdeaRefresh] Error:`, error);
    }
};

// ==================== CLIENT CREDITS ====================

/**
 * Get client credits
 */
export const GetClientCredits = async (clientId: number) => {
    try {
        const [credits] = await db
            .select()
            .from(ClientCredits)
            .where(eq(ClientCredits.clientId, clientId))
            .limit(1)
            .execute();
        return credits;
    } catch (error) {
        console.error(`[GetClientCredits] Error encountered:`, error);
        throw new Error("Failed to get client credits");
    }
};

/**
 * Update client credits (increment posts used, etc.)
 */
export const UpdateClientCredits = async (
    clientId: number,
    updates: {
        postsUsed?: number;
        rushUsed?: number;
        postsPerMonth?: number;
        revisionsPerPost?: number;
        rushRequests?: number;
    }
) => {
    try {
        const [updated] = await db
            .update(ClientCredits)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(ClientCredits.clientId, clientId))
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[UpdateClientCredits] Error encountered:`, error);
        throw new Error("Failed to update client credits");
    }
};

// ==================== CLIENT REPORTS ====================

export type ReportData = {
    postsScheduled: number;
    postsPublished: number;
    contentGenerated: number;
    tasksCompleted: number;
    tasksTotal: number;
    byPlatform?: Record<string, { scheduled: number; published: number }>;
};

/**
 * Create a client report for a given period (aggregates scheduled posts, content, tasks)
 */
export const CreateClientReport = async (
    agencyId: number,
    clientId: number,
    periodStart: Date,
    periodEnd: Date
) => {
    try {
        const periodStartStr = periodStart.toISOString();
        const periodEndStr = periodEnd.toISOString();

        const [scheduledCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(ScheduledPosts)
            .where(
                and(
                    eq(ScheduledPosts.clientId, clientId),
                    gte(ScheduledPosts.scheduledFor, periodStart),
                    lte(ScheduledPosts.scheduledFor, periodEnd)
                )
            )
            .execute();
        const postsScheduled = Number(scheduledCount?.count) || 0;

        const [publishedCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(ScheduledPosts)
            .where(
                and(
                    eq(ScheduledPosts.clientId, clientId),
                    eq(ScheduledPosts.posted, true),
                    gte(ScheduledPosts.scheduledFor, periodStart),
                    lte(ScheduledPosts.scheduledFor, periodEnd)
                )
            )
            .execute();
        const postsPublished = Number(publishedCount?.count) || 0;

        const [contentCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(GeneratedContent)
            .where(
                and(
                    eq(GeneratedContent.clientId, clientId),
                    gte(GeneratedContent.createdAt, periodStart),
                    lte(GeneratedContent.createdAt, periodEnd)
                )
            )
            .execute();
        const contentGenerated = Number(contentCount?.count) || 0;

        const [tasksTotalRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Tasks)
            .where(
                and(
                    eq(Tasks.clientId, clientId),
                    gte(Tasks.createdAt, periodStart),
                    lte(Tasks.createdAt, periodEnd)
                )
            )
            .execute();
        const tasksTotal = Number(tasksTotalRow?.count) || 0;

        const [tasksCompletedRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Tasks)
            .where(
                and(
                    eq(Tasks.clientId, clientId),
                    eq(Tasks.status, "completed"),
                    gte(Tasks.createdAt, periodStart),
                    lte(Tasks.createdAt, periodEnd)
                )
            )
            .execute();
        const tasksCompleted = Number(tasksCompletedRow?.count) || 0;

        const reportData: ReportData = {
            postsScheduled,
            postsPublished,
            contentGenerated,
            tasksCompleted,
            tasksTotal,
        };

        const periodStartDate = periodStartStr.slice(0, 10);
        const periodEndDate = periodEndStr.slice(0, 10);
        const [report] = await db
            .insert(ClientReports)
            .values({
                clientId,
                agencyId,
                periodStart: periodStartDate,
                periodEnd: periodEndDate,
                reportData,
                sentToClient: false,
            })
            .returning()
            .execute();
        return report;
    } catch (error) {
        console.error(`[CreateClientReport] Error:`, error);
        throw new Error("Failed to create report");
    }
};

/**
 * List reports for an agency, optionally filtered by client
 */
export const GetClientReportsForAgency = async (
    agencyId: number,
    clientId?: number | null,
    limit: number = 50
) => {
    try {
        const conditions = [eq(ClientReports.agencyId, agencyId)];
        if (clientId != null) {
            conditions.push(eq(ClientReports.clientId, clientId));
        }
        const reports = await db
            .select()
            .from(ClientReports)
            .where(and(...conditions))
            .orderBy(desc(ClientReports.createdAt))
            .limit(limit)
            .execute();
        return reports;
    } catch (error) {
        console.error(`[GetClientReportsForAgency] Error:`, error);
        throw new Error("Failed to get reports");
    }
};

// ==================== POST APPROVALS ====================

/**
 * Create approval record for a scheduled post
 */
export const CreatePostApproval = async (data: {
    scheduledPostId: number;
    clientId: number;
    approvalToken: string;
    expiresAt: Date;
}) => {
    try {
        const [approval] = await db
            .insert(PostApprovals)
            .values({
                scheduledPostId: data.scheduledPostId,
                clientId: data.clientId,
                approvalToken: data.approvalToken,
                expiresAt: data.expiresAt,
                status: "pending",
                updatedAt: new Date(),
            })
            .returning()
            .execute();
        return approval;
    } catch (error) {
        console.error(`[CreatePostApproval] Error encountered:`, error);
        throw new Error("Failed to create approval");
    }
};

/**
 * Get approval by token
 */
export const GetApprovalByToken = async (token: string) => {
    try {
        const [approval] = await db
            .select()
            .from(PostApprovals)
            .where(eq(PostApprovals.approvalToken, token))
            .limit(1)
            .execute();
        return approval;
    } catch (error) {
        console.error(`[GetApprovalByToken] Error encountered:`, error);
        throw new Error("Failed to get approval");
    }
};

/**
 * Update approval status
 */
export const UpdateApprovalStatus = async (
    approvalId: number,
    status: string,
    clientComment?: string
) => {
    try {
        const [updated] = await db
            .update(PostApprovals)
            .set({
                status,
                clientComment,
                approvedAt: status === "approved" ? new Date() : undefined,
                updatedAt: new Date(),
            })
            .where(eq(PostApprovals.id, approvalId))
            .returning()
            .execute();
        return updated;
    } catch (error) {
        console.error(`[UpdateApprovalStatus] Error encountered:`, error);
        throw new Error("Failed to update approval");
    }
};

/**
 * Get scheduled posts for a client (for client dashboard view)
 */
export const GetScheduledPostsByClientId = async (clientId: number) => {
    try {
        const posts = await db
            .select()
            .from(ScheduledPosts)
            .where(eq(ScheduledPosts.clientId, clientId))
            .orderBy(desc(ScheduledPosts.scheduledFor))
            .execute();
        return posts;
    } catch (error) {
        console.error(`[GetScheduledPostsByClientId] Error:`, error);
        throw new Error("Failed to get scheduled posts");
    }
};

/**
 * Get pending approvals for a client
 */
export const GetPendingApprovalsForClient = async (clientId: number) => {
    try {
        const approvals = await db
            .select()
            .from(PostApprovals)
            .where(
                and(
                    eq(PostApprovals.clientId, clientId),
                    eq(PostApprovals.status, "pending")
                )
            )
            .orderBy(desc(PostApprovals.createdAt))
            .execute();
        return approvals;
    } catch (error) {
        console.error(`[GetPendingApprovalsForClient] Error encountered:`, error);
        throw new Error("Failed to get pending approvals");
    }
};

// ============================================
// TEAM INVITATIONS
// ============================================

export const CreateTeamInvitation = async (
    invitedBy: number,
    email: string,
    role: string = "member"
) => {
    try {
        // Generate a unique token for the invitation
        const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        const [invitation] = await db
            .insert(TeamInvitations)
            .values({
                invitedBy,
                email: email.toLowerCase().trim(),
                token,
                role,
                status: "pending",
                expiresAt,
            })
            .returning()
            .execute();
        
        console.log(`[CreateTeamInvitation] Invitation created:`, invitation);
        return invitation;
    } catch (error) {
        console.error(`[CreateTeamInvitation] Error encountered:`, error);
        throw new Error("Failed to create team invitation");
    }
};

export const GetTeamInvitationsByEmail = async (email: string) => {
    try {
        const invitations = await db
            .select()
            .from(TeamInvitations)
            .where(
                and(
                    eq(TeamInvitations.email, email.toLowerCase().trim()),
                    eq(TeamInvitations.status, "pending")
                )
            )
            .orderBy(desc(TeamInvitations.createdAt))
            .execute();
        return invitations;
    } catch (error) {
        console.error(`[GetTeamInvitationsByEmail] Error encountered:`, error);
        throw new Error("Failed to get team invitations");
    }
};

export const GetTeamInvitationsByInviter = async (invitedBy: number) => {
    try {
        const invitations = await db
            .select()
            .from(TeamInvitations)
            .where(eq(TeamInvitations.invitedBy, invitedBy))
            .orderBy(desc(TeamInvitations.createdAt))
            .execute();
        return invitations;
    } catch (error) {
        console.error(`[GetTeamInvitationsByInviter] Error encountered:`, error);
        throw new Error("Failed to get team invitations");
    }
};
