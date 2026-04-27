import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../shared/StatCard';
import { Calendar, DollarSign, Users, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../../services/api';

export function TurfAdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
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
      const response = await api.get('/bookings/');
      const allBookings = response.data.results || response.data;
      setBookings(allBookings);

      // Calculate stats
      const totalRevenue = allBookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_price || 0), 0);
      const uniqueCustomers = new Set(allBookings.map((b: any) => b.customer_name || b.customer).filter(Boolean)).size;
      
      // Calculate dynamic average booking duration
      let totalDurationMins = 0;
      let validDurationsCount = 0;
      
      allBookings.forEach((b: any) => {
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
      const todayBookingsList = allBookings.filter((b: any) => b.date === today);
      setTodayBookings(todayBookingsList.slice(0, 5));

      // Generate weekly data from bookings
      const weeklyStats = generateWeeklyData(allBookings);
      setRevenueData(weeklyStats.revenue);
      setBookingData(weeklyStats.bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      // Fallback to demo data
      setRevenueData(demoRevenueData);
      setBookingData(demoBookingData);
      setTodayBookings(demoTodayBookings);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 10 seconds to pick up new bookings
    const interval = setInterval(fetchData, 10000);
    
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
  const generateWeeklyData = (allBookings: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenue: any[] = [];
    const bookingCounts: any[] = [];

    days.forEach(day => {
      revenue.push({ name: day, revenue: 0 });
      bookingCounts.push({ name: day, bookings: 0 });
    });

    allBookings.forEach((booking: any) => {
      const date = new Date(booking.date);
      // getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
      // But days array has Monday at index 0, so we adjust: Sunday(0)->6, Monday(1)->0, etc.
      const dayIndex = (date.getDay() === 0) ? 6 : date.getDay() - 1;
      const revenuAmount = parseFloat(booking.total_price || 0);
      
      if (revenue[dayIndex]) {
        revenue[dayIndex].revenue += revenuAmount;
        bookingCounts[dayIndex].bookings += 1;
      }
    });

    return { revenue, bookings: bookingCounts };
  };

  // Demo data fallback
  const demoRevenueData = [
    { name: 'Mon', revenue: 2400 },
    { name: 'Tue', revenue: 3200 },
    { name: 'Wed', revenue: 2800 },
    { name: 'Thu', revenue: 3900 },
    { name: 'Fri', revenue: 4200 },
    { name: 'Sat', revenue: 5100 },
    { name: 'Sun', revenue: 4800 },
  ];

  const demoBookingData = [
    { name: 'Mon', bookings: 12 },
    { name: 'Tue', bookings: 16 },
    { name: 'Wed', bookings: 14 },
    { name: 'Thu', bookings: 19 },
    { name: 'Fri', bookings: 22 },
    { name: 'Sat', bookings: 28 },
    { name: 'Sun', bookings: 25 },
  ];

  const demoTodayBookings = [
    { id: 1, court: 'Court A', customer_name: 'John Smith', start_time: '09:00 AM', status: 'CONFIRMED', total_price: 50 },
    { id: 2, court: 'Court B', customer_name: 'Sarah Johnson', start_time: '10:00 AM', status: 'CONFIRMED', total_price: 50 },
    { id: 3, court: 'Court A', customer_name: 'Michael Brown', start_time: '11:00 AM', status: 'PENDING', total_price: 50 },
  ];

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
                  <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-foreground text-xs sm:text-sm">{booking.court?.name || 'Court'}</td>
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
        </div>
      </div>
    </div>
  );
}
