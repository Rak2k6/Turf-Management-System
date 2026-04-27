import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export function CustomerDashboard() {
  const upcomingBookings = [
    { id: 1, court: 'Court A', type: 'Football', date: '2024-12-24', time: '09:00 AM - 10:00 AM', status: 'Confirmed', price: 50 },
    { id: 2, court: 'Court B', type: 'Cricket', date: '2024-12-25', time: '02:00 PM - 03:00 PM', status: 'Confirmed', price: 50 },
  ];

  const pastBookings = [
    { id: 3, court: 'Court A', type: 'Football', date: '2024-12-20', time: '05:00 PM - 06:00 PM', status: 'Completed', price: 80 },
    { id: 4, court: 'Court D', type: 'Badminton', date: '2024-12-18', time: '10:00 AM - 11:00 AM', status: 'Completed', price: 40 },
    { id: 5, court: 'Court B', type: 'Cricket', date: '2024-12-15', time: '03:00 PM - 04:00 PM', status: 'Cancelled', price: 50 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                <span className="text-lg md:text-xl font-bold text-white">GV</span>
              </div>
              <div className="hidden sm:block">
                <h2 className="text-base md:text-lg font-semibold text-foreground">Green Valley Sports</h2>
                <p className="text-xs text-muted-foreground">My Bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="hidden md:flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
              <div className="w-9 md:w-10 h-9 md:h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs md:text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-[#d1fae5] p-3 rounded-lg flex-shrink-0">
                <Calendar className="w-5 md:w-6 h-5 md:h-6 text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-xl md:text-2xl font-semibold text-foreground">24</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-[#dbeafe] p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 md:w-6 h-5 md:h-6 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Upcoming</p>
                <p className="text-xl md:text-2xl font-semibold text-foreground">2</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-[#fef3c7] p-3 rounded-lg flex-shrink-0">
                <Clock className="w-5 md:w-6 h-5 md:h-6 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Hours</p>
                <p className="text-xl md:text-2xl font-semibold text-foreground">36</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-border shadow-sm mb-8">
          <div className="p-4 md:p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground">Upcoming Bookings</h2>
                <p className="text-muted-foreground text-xs md:text-sm mt-1">Your scheduled court reservations</p>
              </div>
              <button className="w-full sm:w-auto px-3 md:px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm md:text-base">
                + New Booking
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-3 md:space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="border border-border rounded-lg p-4 md:p-6 hover:border-[#10b981] transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                  <div className="flex items-start gap-3 md:gap-4 w-full sm:w-auto">
                    <div className="w-14 md:w-16 h-14 md:h-16 bg-gradient-to-br from-[#10b981] to-[#3b82f6] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl md:text-3xl">⚽</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">{booking.court}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2">{booking.type}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 md:w-4 h-3 md:h-4 flex-shrink-0" />
                          <span>{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 md:w-4 h-3 md:h-4 flex-shrink-0" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto mt-3 sm:mt-0">
                    <p className="text-xl md:text-2xl font-bold text-[#10b981] mb-2">₹{booking.price}</p>
                    <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#d1fae5] text-[#059669] rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </span>
                    <div className="flex gap-3 md:gap-2 mt-3">
                      <button className="text-xs md:text-sm text-[#3b82f6] hover:text-[#1d4ed8]">View</button>
                      <button className="text-xs md:text-sm text-[#ef4444] hover:text-[#dc2626]">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Booking History</h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">Your past bookings and activity</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Booking ID</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Court</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Date</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Time</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Status</th>
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pastBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm text-foreground">
                      #{booking.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-foreground">{booking.court}</p>
                        <p className="text-xs text-muted-foreground">{booking.type}</p>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-foreground">
                      {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground">{booking.time}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      {booking.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#d1fae5] text-[#059669] rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#fee2e2] text-[#dc2626] rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">₹{booking.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
