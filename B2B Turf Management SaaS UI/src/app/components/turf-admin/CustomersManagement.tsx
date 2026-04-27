import { useState } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';

export function CustomersManagement() {
  const customers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+1234567890', totalBookings: 24, totalSpent: 1200, joinDate: '2024-01-15' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1234567891', totalBookings: 18, totalSpent: 900, joinDate: '2024-02-20' },
    { id: 3, name: 'Michael Brown', email: 'michael@example.com', phone: '+1234567892', totalBookings: 32, totalSpent: 1600, joinDate: '2024-01-10' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', phone: '+1234567893', totalBookings: 15, totalSpent: 750, joinDate: '2024-03-05' },
    { id: 5, name: 'David Wilson', email: 'david@example.com', phone: '+1234567894', totalBookings: 21, totalSpent: 1050, joinDate: '2024-02-12' },
  ];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 md:gap-0">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Customer Management</h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">View and manage your customer database</p>
          </div>
          <button className="px-3 md:px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2 text-sm md:text-base w-full md:w-auto justify-center md:justify-start">
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#10b981] bg-opacity-10 p-3 rounded-lg">
              <Users className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Total Customers</p>
              <p className="text-xl md:text-2xl font-semibold text-foreground">342</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#3b82f6] bg-opacity-10 p-3 rounded-lg">
              <Users className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">New This Month</p>
              <p className="text-xl md:text-2xl font-semibold text-foreground">28</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#8b5cf6] bg-opacity-10 p-3 rounded-lg">
              <Users className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Active Customers</p>
              <p className="text-xl md:text-2xl font-semibold text-foreground">215</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Customer</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Contact</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Total Bookings</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Total Spent</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Join Date</th>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs md:text-sm font-medium">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-xs md:text-sm text-foreground truncate">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div>
                      <p className="text-xs md:text-sm text-foreground truncate">{customer.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-foreground">{customer.totalBookings}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-[#10b981]">₹{customer.totalSpent}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground">
                    {new Date(customer.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <button className="text-[#3b82f6] hover:text-[#1d4ed8] text-xs md:text-sm font-medium">
                      View Details
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
