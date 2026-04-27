import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { useDarkMode } from './hooks/useDarkMode';
import { SuperAdminDashboard } from './components/super-admin/SuperAdminDashboard';
import { TurfAdminDashboard } from './components/turf-admin/TurfAdminDashboard';
import { BookingsManagement } from './components/turf-admin/BookingsManagement';
import { WalkInBooking } from './components/turf-admin/WalkInBooking';
import { CourtsManagement } from './components/turf-admin/CourtsManagement';
import { CustomersManagement } from './components/turf-admin/CustomersManagement';
import { PaymentsAnalytics } from './components/turf-admin/PaymentsAnalytics';
import { ReportsAnalytics } from './components/turf-admin/ReportsAnalytics';
import { BrandingCustomization } from './components/turf-admin/BrandingCustomization';
import { CustomerLanding } from './components/customer/CustomerLanding';
import { CustomerBooking } from './components/customer/CustomerBooking';
import { CustomerDashboard } from './components/customer/CustomerDashboard';

type UserRole = 'super-admin' | 'turf-admin' | 'reception' | 'customer';
type ViewMode = 'admin' | 'customer-landing' | 'customer-booking' | 'customer-dashboard';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('turf-admin');
  const [activePage, setActivePage] = useState('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  // Customer views
  if (viewMode === 'customer-landing') {
    return <CustomerLanding />;
  }

  if (viewMode === 'customer-booking') {
    return <CustomerBooking />;
  }

  if (viewMode === 'customer-dashboard') {
    return <CustomerDashboard />;
  }

  // Admin views
  const renderPageContent = () => {
    // Super Admin Pages
    if (userRole === 'super-admin') {
      switch (activePage) {
        case 'dashboard':
          return <SuperAdminDashboard />;
        case 'turfs':
          return <SuperAdminDashboard />;
        case 'billing':
          return (
            <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Billing & Invoices</h2>
              <p className="text-muted-foreground">Billing management interface would go here</p>
            </div>
          );
        default:
          return <SuperAdminDashboard />;
      }
    }

    // Turf Admin & Reception Pages
    switch (activePage) {
      case 'dashboard':
        return <TurfAdminDashboard />;
      case 'bookings':
        return <BookingsManagement />;
      case 'walk-in':
        return <WalkInBooking />;
      case 'courts':
        return <CourtsManagement />;
      case 'customers':
        return <CustomersManagement />;
      case 'payments':
        return <PaymentsAnalytics />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'branding':
        return <BrandingCustomization />;
      case 'settings':
        return <CustomersManagement />;
      default:
        return <TurfAdminDashboard />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'turfs': 'Turf Management',
      'billing': 'Billing & Invoices',
      'bookings': 'Bookings Management',
      'walk-in': 'Walk-in Booking',
      'courts': 'Courts & Grounds',
      'customers': 'Customer Management',
      'payments': 'Payments & Analytics',
      'reports': 'Reports & Analytics',
      'branding': 'Branding & Customization',
      'settings': 'Customer Management',
    };
    return titles[activePage] || 'Dashboard';
  };

  const getPageSubtitle = () => {
    const subtitles: Record<string, string> = {
      'dashboard': 'Overview of your turf management platform',
      'turfs': 'Manage all registered turfs and subscriptions',
      'billing': 'Manage billing and invoices',
      'bookings': 'View and manage all bookings',
      'walk-in': 'Quick booking for walk-in customers',
      'courts': 'Manage your courts and facilities',
      'customers': 'View and manage customer database',
      'payments': 'Revenue tracking and payment analytics',
      'reports': 'Comprehensive insights and reports',
      'branding': 'Customize your turf brand identity',
      'settings': 'View and manage customer database',
    };
    return subtitles[activePage];
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden on mobile, visible on md and above */}
      <div className="hidden md:block">
        <Sidebar
          userRole={userRole}
          activePage={activePage}
          onPageChange={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 md:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          userRole={userRole}
          activePage={activePage}
          onPageChange={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          onBrandingClick={() => setActivePage('branding')}
          onReportsClick={() => setActivePage('reports')}
          onSettingsClick={() => setActivePage('settings')}
          isDark={isDark}
          onToggleDarkMode={toggleDarkMode}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobileMenuOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}