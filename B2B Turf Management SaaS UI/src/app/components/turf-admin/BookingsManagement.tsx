import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, List, CheckCircle, Clock, XCircle, Search, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export function BookingsManagement() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/bookings/');
      const allBookings = response.data.results || response.data;
      
      // Transform API data to match UI expectations
      const transformedBookings = allBookings.map((b: any, index: number) => {
        // Parse start_time and end_time to extract times
        const startTime = new Date(b.start_time);
        const endTime = new Date(b.end_time);
        const startHour = startTime.getHours().toString().padStart(2, '0');
        const startMin = startTime.getMinutes().toString().padStart(2, '0');
        const endHour = endTime.getHours().toString().padStart(2, '0');
        const endMin = endTime.getMinutes().toString().padStart(2, '0');
        
        const now = new Date();
        const isExpired = endTime < now;
        
        return {
          id: b.id || index,
          court: b.court_name || 'N/A',
          customer: b.customer_name || b.customer || 'Walk-in Customer',
          date: b.date,
          time: `${startHour}:${startMin} - ${endHour}:${endMin}`,
          isExpired,
          status: b.status === 'CONFIRMED' ? 'Confirmed' : 
                  b.status === 'PENDING' ? 'Pending' : 
                  b.status === 'CANCELLED' ? 'Cancelled' : 
                  b.status === 'SUBMITTED' ? 'Submitted' : b.status,
          price: parseFloat(b.total_price || 0),
          phone: b.customer_phone || 'N/A'
        };
      });
      
      setBookings(transformedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount and set up auto-refresh
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchBookings]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.court.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (bookingId: string | number, currentStatus: string) => {
    if (currentStatus === 'Pending') {
      // Optimistically update UI
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === bookingId ? { ...b, status: 'Submitted' } : b)
      );
      // Try to update backend if endpoint supports it, ignore errors otherwise
      try { 
        await api.patch(`/bookings/${bookingId}/`, { status: 'SUBMITTED' }); 
        window.dispatchEvent(new Event('bookingStatusUpdated'));
      } catch(e) {}
    }
  };

  const getStatusBadge = (status: string, bookingId?: string | number, isExpired?: boolean) => {
    const styles = {
      Confirmed: 'bg-muted text-[#10b981]',
      Pending: `bg-muted text-[#f59e0b] cursor-pointer hover:bg-[#f59e0b]/20 ${isExpired ? 'animate-[pulse_2s_ease-in-out_infinite] ring-2 ring-[#f59e0b]/50' : ''}`,
      Cancelled: 'bg-muted text-[#ef4444]',
      Submitted: 'bg-muted text-[#3b82f6]'
    };
    const icons = {
      Confirmed: CheckCircle,
      Pending: Clock,
      Cancelled: XCircle,
      Submitted: CheckCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return (
      <span 
        onClick={() => bookingId && status === 'Pending' ? handleStatusChange(bookingId, status) : undefined}
        className={`inline-flex items-center gap-1 px-2.5 py-1 ${styles[status as keyof typeof styles] || styles.Pending} rounded-full text-xs font-medium transition-colors`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">Bookings Management</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">View and manage all bookings</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={fetchBookings}
              disabled={refreshing}
              className="px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs md:text-sm whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden md:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs md:text-sm whitespace-nowrap ${viewMode === 'list' ? 'bg-[#10b981] text-white' : 'bg-muted text-foreground'
                }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs md:text-sm whitespace-nowrap ${viewMode === 'calendar' ? 'bg-[#10b981] text-white' : 'bg-muted text-foreground'
                }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden md:inline">Calendar View</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm flex-shrink-0"
          >
            <option>All</option>
            <option>Confirmed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">ID</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Court</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Customer</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Date</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Time</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Status</th>
                    <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm text-foreground">#{booking.id.toString().padStart(4, '0')}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-foreground">{booking.court}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-foreground truncate">{booking.customer}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground whitespace-nowrap">{booking.time}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4">{getStatusBadge(booking.status, booking.id, booking.isExpired)}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">₹{booking.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-foreground py-2 text-xs md:text-base">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const dayBookings = filteredBookings.filter(b => new Date(b.date).getDate() === (i % 31) + 1);
              return (
                <div key={i} className="border border-border rounded-lg p-2 md:p-3 min-h-[80px] md:min-h-[100px]">
                  <div className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">{(i % 31) + 1}</div>
                  {dayBookings.slice(0, 2).map(booking => (
                    <div key={booking.id} className="text-xs bg-muted text-[#10b981] px-2 py-1 rounded mb-1 truncate">
                      {booking.time.split(' - ')[0]}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{dayBookings.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
