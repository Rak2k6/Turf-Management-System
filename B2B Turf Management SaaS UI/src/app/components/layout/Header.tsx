import { Bell, Search, Settings, Moon, Sun, Menu, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBrandingClick?: () => void;
  onReportsClick?: () => void;
  onSettingsClick?: () => void;
  isDark?: boolean;
  onToggleDarkMode?: () => void;
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
  user?: User | null;
}

export function Header({ title, subtitle, onBrandingClick, onReportsClick, onSettingsClick, isDark, onToggleDarkMode, onMenuClick, isMobileMenuOpen, user }: HeaderProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/bookings/');
        const allBookings = response.data.results || response.data;
        const now = new Date();
        const expired = allBookings.filter((b: any) => new Date(b.end_time) < now && b.status === 'PENDING');
        setNotifications(expired);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener('bookingStatusUpdated', fetchNotifications);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('bookingStatusUpdated', fetchNotifications);
    };
  }, []);

  return (
    <div className="relative z-50 bg-card border-b border-border px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6">
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button - Larger touch target */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 sm:p-2.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0 min-h-10 min-w-10"
            title="Toggle menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 sm:w-6 h-5 sm:h-6 text-foreground" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-2xl font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-xs md:text-sm text-muted-foreground mt-1 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
          {/* Search - Hidden on mobile, compact on tablet */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-48 lg:w-80 pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-2 sm:p-2.5 hover:bg-muted rounded-lg transition-colors min-h-10 min-w-10"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 sm:p-2.5 hover:bg-muted rounded-lg transition-colors min-h-10 min-w-10"
              title="Settings menu"
              aria-label="Open settings menu"
            >
              <Settings className="w-5 sm:w-6 h-5 sm:h-6 text-foreground" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    onBrandingClick?.();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-foreground text-sm sm:text-base"
                >
                  Branding
                </button>
                <button
                  onClick={() => {
                    onReportsClick?.();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-foreground text-sm sm:text-base"
                >
                  Reports
                </button>
                <button
                  onClick={() => {
                    onSettingsClick?.();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-foreground text-sm sm:text-base"
                >
                  Customer Management
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (showSettingsMenu) setShowSettingsMenu(false);
              }}
              className="relative p-2 sm:p-2.5 hover:bg-muted rounded-lg transition-colors min-h-10 min-w-10" 
              title="Notifications" 
              aria-label="Notifications"
            >
              <Bell className="w-5 sm:w-6 h-5 sm:h-6 text-foreground" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-card"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-card border border-border rounded-xl shadow-lg py-2 z-50 max-h-[400px] overflow-y-auto">
                <div className="px-4 py-2 border-b border-border mb-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif: any, i: number) => (
                    <div key={i} className="px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0 cursor-pointer">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Court time over</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notif.customer_name || notif.customer || 'Walk-in'} - {notif.court_name || 'Court'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Expired at {new Date(notif.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {/* User Avatar */}
          {user && (
            <div
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0 cursor-default select-none"
              title={user.email || user.username}
              aria-label={`Logged in as ${user.username}`}
            >
              <span className="text-white font-semibold text-xs sm:text-sm">
                {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
