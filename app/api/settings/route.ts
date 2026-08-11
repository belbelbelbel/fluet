import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetUserByClerkId,
  GetUserSettings,
  UpsertUserSettings,
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

async function resolveClerkUserId(): Promise<string | null> {
  const authResult = await auth();
  let userId: string | null | undefined = authResult?.userId || null;
  if (!userId) {
    try {
      const user = await currentUser();
      userId = user?.id ?? null;
    } catch {
      // ignore
    }
  }
  return userId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const clerkUserId = await resolveClerkUserId();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const requestedUserId = req.nextUrl.searchParams.get("userId");
    if (requestedUserId && requestedUserId !== clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user?.id) {
      return NextResponse.json({
        defaultAIModel: "deepseek-v4-flash",
        autoSave: true,
        notifications: true,
        theme: "light",
        niche: null,
        emailApprovals: true,
        emailTasks: true,
        defaultRequiresApproval: true,
        persisted: false,
      });
    }

    const settings = await GetUserSettings(user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const clerkUserId = await resolveClerkUserId();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { userId: requestedUserId, settings } = await req.json();
    if (requestedUserId && requestedUserId !== clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const saved = await UpsertUserSettings(user.id, {
      defaultAIModel: settings?.defaultAIModel,
      autoSave: settings?.autoSave,
      notifications: settings?.notifications,
      theme: settings?.theme,
      niche: settings?.niche ?? null,
      emailApprovals: settings?.emailApprovals,
      emailTasks: settings?.emailTasks,
      defaultRequiresApproval: settings?.defaultRequiresApproval,
    });

    return NextResponse.json({
      success: true,
      persisted: true,
      settings: {
        defaultAIModel: saved.defaultAIModel,
        autoSave: saved.autoSave,
        notifications: saved.notifications,
        theme: saved.theme,
        niche: saved.niche,
        emailApprovals: saved.emailApprovals,
        emailTasks: saved.emailTasks,
        defaultRequiresApproval: saved.defaultRequiresApproval,
      },
      message: "Settings saved to your account",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

/** PATCH: Update niche (and optional partial fields) */
export async function PATCH(req: NextRequest) {
  try {
    const clerkUserId = await resolveClerkUserId();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const current = await GetUserSettings(user.id);
    const saved = await UpsertUserSettings(user.id, {
      defaultAIModel: current.defaultAIModel,
      autoSave: current.autoSave,
      notifications: current.notifications,
      theme: current.theme,
      niche: body.niche ?? current.niche,
      emailApprovals: current.emailApprovals,
      emailTasks: current.emailTasks,
      defaultRequiresApproval: current.defaultRequiresApproval,
      ...(body.theme != null ? { theme: body.theme } : {}),
      ...(body.defaultAIModel != null
        ? { defaultAIModel: body.defaultAIModel }
        : {}),
    });

    return NextResponse.json({
      success: true,
      persisted: true,
      niche: saved.niche ?? null,
      theme: saved.theme,
    });
  } catch (error) {
    console.error("[Settings PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
