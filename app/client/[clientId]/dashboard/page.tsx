import { requireClientAccess } from "@/utils/auth/route-guards";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ clientId: string }> | { clientId: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const clientId = parseInt(resolvedParams.clientId);
  
  await requireClientAccess(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome to your content dashboard
        </p>
      </div>

      {/* Overview Cards - Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-purple-600">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Posts This Month
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-yellow-600">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pending Approvals
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-green-600">0%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Engagement Rate
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Your agency hasn't scheduled any posts yet.
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You'll receive approval notifications when needed.
        </p>
      </div>
    </div>
  );
}
