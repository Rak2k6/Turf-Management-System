interface SkeletonCardProps {
  count?: number;
  /**
   * stat       — KPI / stat card (TurfAdminDashboard, ReportsAnalytics)
   * chart      — chart card placeholder (TurfAdminDashboard, ReportsAnalytics)
   * table-row  — bare <tr> rows for use inside an existing <tbody>
   * table      — full self-contained card with header, filter bar, and table rows
   *              (BookingsManagement, CourtsManagement)
   */
  type?: 'stat' | 'chart' | 'table-row' | 'table';
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className || ''}`} />;
}

export function SkeletonCard({ count = 1, type = 'stat' }: SkeletonCardProps) {
  /* ------------------------------------------------------------------ */
  /* stat — matches StatCard layout (label / big number / sub-text / icon) */
  /* ------------------------------------------------------------------ */
  if (type === 'stat') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-8 w-16" />
                <SkeletonPulse className="h-3 w-20" />
              </div>
              <SkeletonPulse className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /* chart — matches chart card (title + tall area/bar chart placeholder) */
  /* ------------------------------------------------------------------ */
  if (type === 'chart') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            <SkeletonPulse className="h-5 w-32 mb-4" />
            <SkeletonPulse className="h-[220px] w-full rounded-lg" />
          </div>
        ))}
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /* table-row — bare <tr> cells for embedding inside an existing <tbody> */
  /* ------------------------------------------------------------------ */
  if (type === 'table-row') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: 6 }).map((_, j) => (
              <td key={j} className="px-3 md:px-6 py-3 md:py-4">
                <SkeletonPulse className="h-4 w-full" />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /* table — full standalone card (header + filter bar + table rows)     */
  /* Mirrors the real card structure in BookingsManagement &             */
  /* CourtsManagement so the skeleton is content-shaped, not a blob.     */
  /* ------------------------------------------------------------------ */
  if (type === 'table') {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Card header row */}
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonPulse className="h-5 w-44" />
            <SkeletonPulse className="h-3 w-32" />
          </div>
          <SkeletonPulse className="h-9 w-28 rounded-lg" />
        </div>
        {/* Filter / search bar */}
        <div className="p-4 md:p-6 border-b border-border flex gap-3">
          <SkeletonPulse className="h-9 flex-1 rounded-lg" />
          <SkeletonPulse className="h-9 w-28 rounded-lg" />
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {Array.from({ length: 6 }).map((_, j) => (
                  <th key={j} className="px-3 md:px-6 py-3 md:py-4">
                    <SkeletonPulse className="h-3 w-full" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: count }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-3 md:px-6 py-4">
                      <SkeletonPulse className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
