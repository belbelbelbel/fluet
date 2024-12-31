import { db } from "./dbConfig"
import { eq, sql, desc } from "drizzle-orm"
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
        // console.log(`[CreateOrUpdateUser] Existing user check result:`, existingUser);-
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
