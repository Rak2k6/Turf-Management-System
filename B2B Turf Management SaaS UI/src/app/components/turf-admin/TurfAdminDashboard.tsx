import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../shared/StatCard';
import { SkeletonCard } from '../shared/SkeletonCard';
import { Calendar, DollarSign, Users, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { bookingService } from '../../services/bookingService';
import { extractApiError } from '../../services/api';
import { toast } from 'sonner';
import type { Booking } from '../../types';

interface WeeklyPoint {
  name: string;
  revenue: number;
  bookings: number;
}

export function TurfAdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
  const [bookingData, setBookingData] = useState<{ name: string; bookings: number }[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    avgBookingTime: '0h',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch bookings data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const allBookings = await bookingService.getBookings();
      setBookings(allBookings);

      // Calculate stats
      const totalRevenue = allBookings.reduce((sum, b) => sum + parseFloat(String(b.total_price || 0)), 0);
      const uniqueCustomers = new Set(allBookings.map((b) => b.customer_name || b.customer).filter(Boolean)).size;
      
      // Calculate dynamic average booking duration
      let totalDurationMins = 0;
      let validDurationsCount = 0;
      
      allBookings.forEach((b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
             const diffMins = (end.getTime() - start.getTime()) / (1000 * 60);
             if (diffMins > 0 && diffMins <= 24 * 60) {
               totalDurationMins += diffMins;
               validDurationsCount += 1;
             }
          }
        }
      });
      const avgDurationHours = validDurationsCount > 0 ? (totalDurationMins / validDurationsCount) / 60 : 0;

      setStats({
        totalBookings: allBookings.length,
        totalRevenue: totalRevenue,
        totalCustomers: uniqueCustomers,
        avgBookingTime: avgDurationHours > 0 ? `${avgDurationHours.toFixed(1)}h` : '0h',
      });

      // Get today's bookings
      const today = new Date().toISOString().split('T')[0];
      const todayBookingsList = allBookings.filter((b) => b.date === today);
      setTodayBookings(todayBookingsList.slice(0, 5));

      // Generate weekly data from bookings
      const weeklyStats = generateWeeklyData(allBookings);
      setRevenueData(weeklyStats.map(d => ({ name: d.name, revenue: d.revenue })));
      setBookingData(weeklyStats.map(d => ({ name: d.name, bookings: d.bookings })));
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error(extractApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refetch when component becomes visible (tab/window focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData]);

  // Generate weekly data from bookings
  const generateWeeklyData = (allBookings: Booking[]): WeeklyPoint[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData: WeeklyPoint[] = days.map(name => ({ name, revenue: 0, bookings: 0 }));

    allBookings.forEach((booking) => {
      const date = new Date(booking.date);
      const dayIndex = (date.getDay() === 0) ? 6 : date.getDay() - 1;
      const revenueAmount = parseFloat(String(booking.total_price || 0));
      
      if (weeklyData[dayIndex]) {
        weeklyData[dayIndex].revenue += revenueAmount;
        weeklyData[dayIndex].bookings += 1;
      }
    });

    return weeklyData;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <SkeletonCard count={4} type="stat" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <SkeletonCard count={2} type="chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          change="All time"
          changeType="neutral"
          icon={Calendar}
          iconBgColor="bg-[#10b981]"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toFixed(0)}`}
          change="All time"
          changeType="neutral"
          icon={DollarSign}
          iconBgColor="bg-[#3b82f6]"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          change="Unique customers"
          changeType="neutral"
          icon={Users}
          iconBgColor="bg-[#8b5cf6]"
        />
        <StatCard
          title="Avg. Booking Time"
          value={stats.avgBookingTime}
          change="Per session"
          changeType="neutral"
          icon={Clock}
          iconBgColor="bg-[#f59e0b]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Revenue Chart */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Chart */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Weekly Bookings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Bookings */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Today's Bookings</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Current schedule for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {todayBookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No bookings for today</p>
            </div>
          ) : (
            <table className="w-full text-sm sm:text-base">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground">Court</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground hidden sm:table-cell">Customer</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground">Time</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground">Status</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground hidden md:table-cell">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-foreground text-xs sm:text-sm">{booking.court_name || 'Court'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-foreground hidden sm:table-cell">{booking.customer_name || 'Walk-in'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{new Date(booking.start_time).toLocaleTimeString()}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {booking.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-muted text-[#10b981] rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">Confirmed</span>
                          <span className="sm:hidden">OK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-muted text-[#f59e0b] rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">Pending</span>
                          <span className="sm:hidden">...</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground hidden md:table-cell">₹{booking.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
