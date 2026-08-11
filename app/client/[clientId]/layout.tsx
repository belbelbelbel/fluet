import { requireClientAccess } from "@/utils/auth/route-guards";
import { ClientDashboardHeader } from "@/components/ClientDashboardHeader";

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }> | { clientId: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const clientId = parseInt(resolvedParams.clientId);

  await requireClientAccess(clientId);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1220] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(56,189,248,0.08),_transparent_45%),linear-gradient(180deg,#0b1220_0%,#111827_100%)]" />
        <div className="absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative z-10">
        <ClientDashboardHeader clientId={clientId} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
