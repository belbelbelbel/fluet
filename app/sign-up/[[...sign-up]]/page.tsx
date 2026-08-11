import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeRedirectPath } from "@/lib/auth-redirect";
import { SignUpClient } from "./SignUpClient";

type SignUpPageProps = {
  searchParams: { redirect_url?: string };
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { userId } = await auth();
  const redirectUrl = normalizeRedirectPath(searchParams.redirect_url);

  if (userId) {
    redirect(redirectUrl);
  }

  return <SignUpClient />;
}
