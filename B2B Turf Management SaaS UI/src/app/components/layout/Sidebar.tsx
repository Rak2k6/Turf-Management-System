import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Building2,
  UserPlus,
  LogOut,
} from 'lucide-react';
import type { User } from '../../types';

interface SidebarProps {
  userRole: 'super-admin' | 'turf-admin' | 'reception' | 'customer';
  activePage: string;
  onPageChange: (page: string) => void;
  user?: User | null;
  onLogout?: () => void;
}

export function Sidebar({ userRole, activePage, onPageChange, user, onLogout }: SidebarProps) {
  const superAdminLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'turfs', label: 'Turf Management', icon: Building2 },
    { id: 'billing', label: 'Billing & Invoices', icon: FileText },
  ];

  const turfAdminLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'walk-in', label: 'Walk-in Booking', icon: UserPlus },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'courts', label: 'Courts & Grounds', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: DollarSign },
  ];

  const receptionLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'walk-in', label: 'Walk-in Booking', icon: UserPlus },
  ];

  const links =
    userRole === 'super-admin' ? superAdminLinks :
      userRole === 'turf-admin' ? turfAdminLinks :
        receptionLinks;

  // Generate initials from username
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U';

  const displayName = user?.username || 'User';
  const displayEmail = user?.email || '';

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
      <div className="p-4 sm:p-5 md:p-6 border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base text-foreground truncate">
              {user?.tenant_name || 'TurfManager'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {userRole === 'super-admin' ? 'Super Admin' :
                userRole === 'turf-admin' ? 'Turf Admin' : 'Reception'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activePage === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onPageChange(link.id)}
              className={`
                w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors min-h-10
                ${isActive
                  ? 'bg-[#10b981] text-white'
                  : 'text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base truncate">{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm sm:text-base">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}