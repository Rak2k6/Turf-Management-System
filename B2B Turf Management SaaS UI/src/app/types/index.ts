// ============================================
// Shared TypeScript interfaces for the Turf
// Management SaaS application
// ============================================

// --- Auth ---

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone_number: string | null;
  tenant_id: number | null;
  tenant_name: string | null;
}

export type UserRole = 'SUPER_ADMIN' | 'TURF_ADMIN' | 'STAFF' | 'CUSTOMER';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  phone_number?: string;
  business_name?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// --- Tenant ---

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  owner: number;
  owner_username: string;
  is_active: boolean;
  logo: string | null;
  primary_color: string;
  secondary_color: string;
  description: string;
  created_at: string;
}

// --- Court ---

export interface Court {
  id: number;
  tenant: number;
  tenant_name: string;
  name: string;
  sport_type: SportType;
  sport_type_display: string;
  size: string;
  base_price_per_hour: number | string;
  peak_hour_price: number | string | null;
  status: CourtStatus;
  status_display: string;
  opening_time: string;
  closing_time: string;
  operating_hours: OperatingShift[];
  slot_duration_mins: number;
  is_active: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export type SportType = 'CRICKET' | 'FOOTBALL' | 'BADMINTON' | 'TENNIS' | 'BASKETBALL' | 'VOLLEYBALL' | 'SQUASH' | 'OTHER';
export type CourtStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface OperatingShift {
  start: string;
  end: string;
}

export interface CourtCreateRequest {
  name: string;
  sport_type: SportType;
  size: string;
  base_price_per_hour: string;
  peak_hour_price: string;
  opening_time?: string;
  closing_time?: string;
  operating_hours?: OperatingShift[];
  status?: CourtStatus;
}

// --- Slot ---

export interface Slot {
  id: number;
  court: number;
  start_time: string;
  end_time: string;
  price: number | string;
  is_active: boolean;
}

export interface SlotAvailability {
  id: number;
  start_time: string;
  end_time: string;
  price: number | string;
  is_available: boolean;
}

// --- Booking ---

export interface Booking {
  id: number;
  court: number;
  court_name: string;
  slot: number | null;
  slot_details: Slot | null;
  customer: number | null;
  customer_username: string | null;
  customer_name: string;
  customer_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number | string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'SUBMITTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE';

export interface BookingCreateRequest {
  court: number;
  slot?: number;
  customer_name?: string;
  customer_phone?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price?: number;
  status?: BookingStatus;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
}

// --- Billing ---

export interface Customer {
  id: number;
  tenant: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  user: number | null;
  created_at: string;
  updated_at: string;
}

export interface Revenue {
  id: number;
  tenant: number;
  booking: number | null;
  amount: number | string;
  date: string;
  description: string;
  payment_method: PaymentMethod | 'OTHER';
  created_at: string;
}

export interface Expense {
  id: number;
  tenant: number;
  category: ExpenseCategory;
  amount: number | string;
  date: string;
  description: string;
  created_at: string;
}

export type ExpenseCategory = 'MAINTENANCE' | 'UTILITIES' | 'SALARIES' | 'EQUIPMENT' | 'RENT' | 'MARKETING' | 'OTHER';

// --- Dashboard ---

export interface DashboardKPI {
  total_bookings: number;
  total_revenue: number;
  unique_customers: number;
  avg_revenue_day: number;
}

export interface WeeklyDataPoint {
  day: string;
  bookings: number;
  revenue: number;
}

export interface CourtUtilization {
  court: string;
  utilization: number;
}

export interface PeakHour {
  hour: string;
  bookings: number;
}

export interface PerformanceSummary {
  best_day: { name: string; bookings: number; revenue: number };
  most_popular_court: { name: string; utilization: number };
  peak_time: string;
  avg_duration_hours: number;
}

export interface ReportsSummary {
  kpi: DashboardKPI;
  weekly_data: WeeklyDataPoint[];
  court_utilization: CourtUtilization[];
  peak_hours: PeakHour[];
  performance_summary: PerformanceSummary;
}

// --- API Response ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
