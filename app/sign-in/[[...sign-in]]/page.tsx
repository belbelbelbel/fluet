import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRedirectPath } from "@/lib/auth-redirect";
import { SignInClient } from "./SignInClient";

type SignInPageProps = {
  searchParams: { redirect_url?: string };
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { userId } = await auth();
  const redirectUrl = normalizeRedirectPath(searchParams.redirect_url);

  if (userId) {
    redirect(redirectUrl);
  }

  return <SignInClient />;
}
