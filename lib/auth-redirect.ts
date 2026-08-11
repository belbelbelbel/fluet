/** Build auth links with a safe path-only return URL (never full http:// URLs). */

export function normalizeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";

  try {
    let value = decodeURIComponent(raw.trim());

    if (value.startsWith("http://") || value.startsWith("https://")) {
      const url = new URL(value);
      value = url.pathname + url.search;
    }

    if (
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("sign-in") &&
      !value.includes("sign-up")
    ) {
      return value;
    }
  } catch {
    /* ignore */
  }

  return "/dashboard";
}

export function authPath(
  mode: "sign-in" | "sign-up",
  returnPath: string
): string {
  const safe = normalizeRedirectPath(returnPath);
  return `/${mode}?redirect_url=${encodeURIComponent(safe)}`;
}

/** @deprecated use normalizeRedirectPath */
export const parseRedirectUrl = normalizeRedirectPath;
