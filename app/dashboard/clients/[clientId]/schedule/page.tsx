import { redirect } from "next/navigation";

interface ClientSchedulePageProps {
  params: Promise<{ clientId: string }>;
}

/** Redirect client hub "Schedule" links to the main schedule page with client pre-selected. */
export default async function ClientSchedulePage({ params }: ClientSchedulePageProps) {
  const { clientId } = await params;
  redirect(`/dashboard/schedule?clientId=${encodeURIComponent(clientId)}`);
}
