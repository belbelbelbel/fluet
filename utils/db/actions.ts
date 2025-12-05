import { db } from "./dbConfig"
import { eq, sql, desc, and, gte, lte } from "drizzle-orm"
import { GeneratedContent, Users, Subscription } from "./schema"
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
        const [savedContent] = await db
            .insert(GeneratedContent)
            .values({
                userId,
                prompt,
                content,
                contentType,
                tone: tone || null,
                style: style || null,
                length: length || null,
            })
            .returning()
            .execute();
        return savedContent;
    } catch (error) {
        console.error(`[SaveGeneratedContent] Error encountered:`, error);
        throw new Error("Failed to save generated content");
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
