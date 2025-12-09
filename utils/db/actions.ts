import { db } from "./dbConfig"
import { eq, sql, desc, and, gte, lte } from "drizzle-orm"
import { GeneratedContent, Users, Subscription, ScheduledPosts } from "./schema"
import { sendWelcomeEmail } from "./mailtrap"

export const CreateOrUpdateUser = async (stripecustomerId: string, email: string, name: string) => {
    try {
        const [existingUser] = await db
            .select()
            .from(Users)
            .where(eq(Users.stripecustomerId, stripecustomerId))
            .limit(1)
            .execute();
        if (existingUser) {
            const [updatedUser] = await db
                .update(Users)
                .set({ email, name })
                .where(eq(Users.stripecustomerId, stripecustomerId))
                .returning()
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
                .returning()
                .execute();

            console.log(`[CreateOrUpdateUser] Insert operation successful. New user:`, newUser);
            sendWelcomeEmail(email, name);
            console.log(`[CreateOrUpdateUser] Welcome email sent to:`, email);
            return newUser;
        }
    } 

    catch (error) {
        console.error(`[CreateOrUpdateUser] Error encountered:`, error);
        throw new Error("Failed to create or update user");
    }
};

export const GetUserByClerkId = async (clerkUserId: string) => {
    try {
        const [user] = await db
            .select()
            .from(Users)
            .where(eq(Users.stripecustomerId, clerkUserId))
            .limit(1)
            .execute();
        return user;
    } catch (error) {
        console.error(`[GetUserByClerkId] Error encountered:`, error);
        throw new Error("Failed to get user");
    }
};


export const GetUserGeneratedContent = async (userId: number, limit: number = 10) => {
    try {
        const content = await db
            .select()
            .from(GeneratedContent)
            .where(eq(GeneratedContent.userId, userId))
            .orderBy(desc(GeneratedContent.createdAt))
            .limit(limit)
            .execute();
        return content;
    } catch (error) {
        console.error(`[GetUserGeneratedContent] Error encountered:`, error);
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
    length?: string
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
                prompt: truncatedPrompt,
                content: truncatedContent,
                contentType,
                tone: truncatedTone || null,
                style: truncatedStyle || null,
                length: truncatedLength || null,
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

// Scheduled Posts Actions

export const CreateScheduledPost = async (
    userId: number,
    contentId: number | null,
    platform: string,
    content: string,
    scheduledFor: Date
) => {
    try {
        const [scheduledPost] = await db
            .insert(ScheduledPosts)
            .values({
                userId,
                contentId: contentId || null,
                platform,
                content,
                scheduledFor,
                posted: false,
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
