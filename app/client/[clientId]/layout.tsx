import { requireClientAccess } from "@/utils/auth/route-guards";
import { ClientDashboardHeader } from "@/components/ClientDashboardHeader";

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }> | { clientId: string };
}) {
  // Handle both async and sync params
  const resolvedParams = params instanceof Promise ? await params : params;
  const clientId = parseInt(resolvedParams.clientId);
  
  // Verify client access
  const { clerkUserId } = await requireClientAccess(clientId);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <ClientDashboardHeader clientId={clientId} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
