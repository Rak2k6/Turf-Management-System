import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, RefreshCw, Clock } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../services/api';

export function PaymentsAnalytics() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    outstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch payment data from bookings API
  const fetchPaymentData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/bookings/');
      const allBookings = response.data.results || response.data;
      setBookings(allBookings);

      // Calculate statistics
      const totalRevenue = allBookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_price || 0), 0);
      const totalTransactions = allBookings.length;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const outstanding = allBookings.filter((b: any) => b.payment_status === 'PENDING').length;

      setStats({
        totalRevenue: totalRevenue,
        totalTransactions: totalTransactions,
        avgTransaction: avgTransaction,
        outstanding: outstanding,
      });

      // Calculate payment method distribution
      const methodCounts: Record<string, number> = { Cash: 0, Card: 0, UPI: 0, Online: 0 };
      allBookings.forEach((b: any) => {
        // Default to Cash if payment_method not specified
        const method = b.payment_method || 'CASH';
        if (method === 'CASH' || method === 'Cash') methodCounts['Cash']++;
        else if (method === 'CARD' || method === 'Card') methodCounts['Card']++;
        else if (method === 'UPI' || method === 'Upi') methodCounts['UPI']++;
        else if (method === 'ONLINE' || method === 'Online') methodCounts['Online']++;
      });

      const total = Object.values(methodCounts).reduce((a, b) => a + b, 0) || 1;
      const methods = [
        { name: 'Cash', value: Math.round((methodCounts['Cash'] / total) * 100), color: '#10b981' },
        { name: 'Card', value: Math.round((methodCounts['Card'] / total) * 100), color: '#3b82f6' },
        { name: 'UPI', value: Math.round((methodCounts['UPI'] / total) * 100), color: '#8b5cf6' },
        { name: 'Online', value: Math.round((methodCounts['Online'] / total) * 100), color: '#f59e0b' },
      ];
      setPaymentMethods(methods);

      // Generate monthly revenue data
      const monthlyData: Record<string, number> = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      allBookings.forEach((b: any) => {
        const date = new Date(b.date);
        const monthKey = monthNames[date.getMonth()];
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(b.total_price || 0);
      });

      const monthlyRevChart = monthNames.map(month => ({
        month: month,
        revenue: monthlyData[month] || 0,
      })).slice(0, 6);
      setMonthlyRevenue(monthlyRevChart);

      // Get recent transactions (limit to 5, sorted by date desc)
      const recent = allBookings
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((b: any, index: number) => {
          const startTime = new Date(b.start_time);
          const startHour = startTime.getHours().toString().padStart(2, '0');
          const startMin = startTime.getMinutes().toString().padStart(2, '0');
          
          return {
            id: b.id || index,
            customer: b.customer_name || b.customer || 'Walk-in',
            amount: parseFloat(b.total_price || 0),
            method: b.payment_method || 'CASH',
            date: b.date,
            time: `${startHour}:${startMin}`,
            status: b.payment_status === 'PENDING' ? 'Pending' : 'Completed',
          };
        });
      setRecentTransactions(recent);
    } catch (err) {
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount and set up auto-refresh
  useEffect(() => {
    fetchPaymentData();
    const interval = setInterval(fetchPaymentData, 10000);
    return () => clearInterval(interval);
  }, [fetchPaymentData]);

  // Refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPaymentData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchPaymentData]);

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <button
          onClick={fetchPaymentData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toFixed(0)}`}
          change="All transactions"
          changeType="neutral"
          icon={DollarSign}
          iconBgColor="bg-[#10b981]"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions.toString()}
          change="Total bookings"
          changeType="neutral"
          icon={TrendingUp}
          iconBgColor="bg-[#3b82f6]"
        />
        <StatCard
          title="Avg. Transaction"
          value={`₹${stats.avgTransaction.toFixed(2)}`}
          change="Per booking"
          changeType="neutral"
          icon={CreditCard}
          iconBgColor="bg-[#8b5cf6]"
        />
        <StatCard
          title="Outstanding"
          value={`₹${(stats.outstanding * 50).toFixed(0)}`}
          change={`${stats.outstanding} pending payments`}
          changeType="neutral"
          icon={Wallet}
          iconBgColor="bg-[#f59e0b]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)'
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }}></div>
                  <span className="text-sm text-foreground">{method.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{method.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-4 md:p-6 border-b border-border">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Recent Transactions</h2>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Latest payment activities</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Loading transactions...</p>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Transaction ID</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Customer</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Amount</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Method</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Date & Time</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm text-foreground">
                      #TXN{transaction.id.toString().padStart(6, '0')}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-foreground">{transaction.customer}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-[#10b981]">₹{transaction.amount.toFixed(2)}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-muted text-foreground rounded-full text-xs font-medium">
                        {transaction.method}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {transaction.time}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-[#10b981] rounded-full text-xs font-medium">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-[#f59e0b] rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
