import {
  GetLinkedAccount,
  UpdateLinkedAccountToken,
} from "@/utils/db/actions";
import { getTwitterConfig, refreshTwitterToken } from "@/utils/twitter/oauth";

/**
 * Return a usable Twitter access token, refreshing when expired.
 */
export async function ensureTwitterAccessToken(
  userId: number
): Promise<{ accessToken: string } | { error: string }> {
  const account = await GetLinkedAccount(userId, "twitter");
  if (!account?.accessToken || account.isActive === false) {
    return { error: "Twitter account not connected" };
  }

  const expiresAt = account.tokenExpiresAt
    ? new Date(account.tokenExpiresAt)
    : null;
  const needsRefresh =
    !expiresAt || expiresAt.getTime() <= Date.now() + 60_000; // refresh 1 min early

  if (!needsRefresh) {
    return { accessToken: account.accessToken };
  }

  if (!account.refreshToken) {
    return {
      error: "Twitter token expired. Reconnect Twitter in Settings",
    };
  }

  try {
    const config = getTwitterConfig();
    const tokens = await refreshTwitterToken(account.refreshToken, config);
    const newExpires = new Date(Date.now() + tokens.expires_in * 1000);
    await UpdateLinkedAccountToken(
      userId,
      "twitter",
      tokens.access_token,
      newExpires
    );
    return { accessToken: tokens.access_token };
  } catch (e) {
    console.error("[Twitter] Token refresh failed:", e);
    return {
      error: "Couldn’t refresh Twitter token. Reconnect in Settings",
    };
  }
}
