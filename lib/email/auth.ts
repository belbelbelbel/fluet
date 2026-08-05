import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { GetUserByClerkId } from "@/utils/db/actions";

/**
 * Email API auth: server-to-server callers use x-internal-secret;
 * browser callers may use a valid Clerk session (optional path).
 */
export async function isAuthorizedForEmailApi(req: NextRequest): Promise<boolean> {
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const headerSecret = req.headers.get("x-internal-secret");

  if (internalSecret && headerSecret === internalSecret) {
    return true;
  }

  try {
    const { userId } = await auth();
    if (!userId) return false;
    const user = await GetUserByClerkId(userId);
    return Boolean(user);
  } catch {
    return false;
  }
}

export function getInternalEmailHeaders(): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return {};
  return { "x-internal-secret": secret };
}
