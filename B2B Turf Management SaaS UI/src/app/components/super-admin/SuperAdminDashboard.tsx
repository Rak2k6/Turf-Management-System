import { StatCard } from '../shared/StatCard';
import { Building2, TrendingUp, Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

export function SuperAdminDashboard() {
  const turfs = [
    { id: 1, name: 'Green Valley Sports', domain: 'greenvalley.turfbook.com', status: 'Active', plan: 'Pro', mrr: 299, bookings: 458 },
    { id: 2, name: 'Elite Sports Arena', domain: 'elitesports.turfbook.com', status: 'Active', plan: 'Enterprise', mrr: 599, bookings: 892 },
    { id: 3, name: 'PlayZone Turf', domain: 'playzone.turfbook.com', status: 'Active', plan: 'Pro', mrr: 299, bookings: 312 },
    { id: 4, name: 'Champions Ground', domain: 'champions.turfbook.com', status: 'Trial', plan: 'Trial', mrr: 0, bookings: 124 },
    { id: 5, name: 'Victory Sports Club', domain: 'victory.turfbook.com', status: 'Active', plan: 'Pro', mrr: 299, bookings: 567 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Active Turfs"
          value="48"
          change="+12% from last month"
          changeType="positive"
          icon={Building2}
          iconBgColor="bg-[#10b981]"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value="₹14,352"
          change="+18% from last month"
          changeType="positive"
          icon={DollarSign}
          iconBgColor="bg-[#3b82f6]"
        />
        <StatCard
          title="Total Bookings"
          value="12,847"
          change="+8% from last month"
          changeType="positive"
          icon={Calendar}
          iconBgColor="bg-[#8b5cf6]"
        />
        <StatCard
          title="Growth Rate"
          value="24%"
          change="Year over year"
          changeType="positive"
          icon={TrendingUp}
          iconBgColor="bg-[#f59e0b]"
        />
      </div>

      {/* Turf Management Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Turf Management</h2>
              <p className="text-muted-foreground text-xs md:text-sm mt-1">Manage all registered turfs and their subscriptions</p>
            </div>
            <button className="w-full sm:w-auto px-3 md:px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm md:text-base">
              + Add New Turf
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Turf Name</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Domain</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Status</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Plan</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">MRR</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Bookings</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {turfs.map((turf) => (
                <tr key={turf.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-9 md:w-10 h-9 md:h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 md:w-5 h-4 md:h-5 text-white" />
                      </div>
                      <span className="font-medium text-xs md:text-sm text-foreground truncate">{turf.name}</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground truncate">{turf.domain}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    {turf.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-muted text-[#10b981] rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-muted text-[#f59e0b] rounded-full text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Trial
                      </span>
                    )}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-foreground">{turf.plan}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">₹{turf.mrr}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-foreground">{turf.bookings}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <button className="text-[#3b82f6] hover:text-[#1d4ed8] text-xs md:text-sm font-medium">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}