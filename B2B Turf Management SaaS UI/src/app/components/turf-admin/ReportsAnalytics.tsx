import { Calendar, DollarSign, Users, TrendingUp, Download } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { SkeletonCard } from '../shared/SkeletonCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'sonner';

export function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/dashboard/reports-summary/');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch reports analytics', error);
        toast.error('Failed to load reports. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI skeleton row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <SkeletonCard type="stat" count={4} />
        </div>
        {/* Charts skeleton row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SkeletonCard type="chart" count={2} />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center mt-10">Failed to load reports</div>;
  }

  const { kpi, weekly_data, court_utilization, peak_hours, performance_summary } = data;

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Reports & Analytics</h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <button className="px-3 md:px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center md:justify-start gap-2 text-sm md:text-base">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button className="px-3 md:px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center md:justify-start gap-2 text-sm md:text-base">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Bookings"
          value={kpi?.total_bookings?.toString() || "0"}
          change="Updated live"
          changeType="positive"
          icon={Calendar}
          iconBgColor="bg-[#10b981]"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${kpi?.total_revenue?.toLocaleString() || "0"}`}
          change="Updated live"
          changeType="positive"
          icon={DollarSign}
          iconBgColor="bg-[#3b82f6]"
        />
        <StatCard
          title="Unique Customers"
          value={kpi?.unique_customers?.toString() || "0"}
          change="Updated live"
          changeType="positive"
          icon={Users}
          iconBgColor="bg-[#8b5cf6]"
        />
        <StatCard
          title="Avg. Revenue/Day"
          value={`₹${kpi?.avg_revenue_day?.toLocaleString() || "0"}`}
          change="Updated live"
          changeType="positive"
          icon={TrendingUp}
          iconBgColor="bg-[#f59e0b]"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Weekly Performance */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Weekly Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weekly_data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Court Utilization */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Court Utilization Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={court_utilization} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis dataKey="court" type="category" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)'
                }}
              />
              <Bar dataKey="utilization" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours Analysis */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Peak Hours Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={peak_hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)'
                }}
              />
              <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-[#d1fae5] rounded-lg">
              <p className="text-sm text-[#059669] mb-1">Best Performing Day</p>
              <p className="text-xl font-semibold text-[#059669]">{performance_summary?.best_day?.name || 'N/A'}</p>
              <p className="text-sm text-[#059669] mt-1">
                {performance_summary?.best_day?.bookings ?? 0} bookings, ₹{performance_summary?.best_day?.revenue?.toLocaleString() ?? 0} revenue
              </p>
            </div>
            <div className="p-4 bg-[#dbeafe] rounded-lg">
              <p className="text-sm text-[#1d4ed8] mb-1">Most Popular Court</p>
              <p className="text-xl font-semibold text-[#1d4ed8]">{performance_summary?.most_popular_court?.name || 'N/A'}</p>
              <p className="text-sm text-[#1d4ed8] mt-1">{performance_summary?.most_popular_court?.utilization ?? 0}% utilization rate</p>
            </div>
            <div className="p-4 bg-[#ede9fe] rounded-lg">
              <p className="text-sm text-[#6d28d9] mb-1">Peak Time</p>
              <p className="text-xl font-semibold text-[#6d28d9]">{performance_summary?.peak_time || 'N/A'}</p>
              <p className="text-sm text-[#6d28d9] mt-1">Highest booking activity</p>
            </div>
            <div className="p-4 bg-[#fef3c7] rounded-lg">
              <p className="text-sm text-[#d97706] mb-1">Avg. Booking Duration</p>
              <p className="text-xl font-semibold text-[#d97706]">{performance_summary?.avg_duration_hours ?? 0} hours</p>
              <p className="text-sm text-[#d97706] mt-1">Per session average</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
