# Turf Management SaaS - Feature Documentation

The Turf Management platform is a comprehensive B2B SaaS solution designed to streamline the operations of sports facility (turf) businesses. It provides a robust backend to handle multiple turf operators as independent tenants, along with dedicated portals for Turf Administrators, Customers, and Super Administrators.

Here is a complete list of the project's features categorized by module.

## 1. Multi-Tenant Architecture (SaaS Core)
*   **Data Isolation:** Secure data partitioning ensuring each turf business (tenant) only accesses its own courts, bookings, and customer data.
*   **Tenant Onboarding:** Capability to register new turf operators as independent tenants on the platform.
*   **White-labeling / Branding Customization:** Turf admins can customize the branding of their specific portal (logo, colors, etc.) for their customers.

## 2. Authentication & Authorization
*   **JWT Based Auth:** Secure token-based authentication (access and refresh tokens).
*   **Role-Based Access Control (RBAC):** Distinct roles and permissions for:
    *   **Super Admin:** Manages the entire SaaS platform and all tenants.
    *   **Turf Admin (Tenant Owner/Manager):** Manages a specific turf facility, courts, and walk-in bookings.
    *   **Customer:** End-users who browse availability and book courts online.
*   **Profile Management:** Password change and user profile updates.

## 3. Turf Admin Portal (Facility Management)
*   **Turf Admin Dashboard:** A high-level overview of key performance indicators, including today's bookings, revenue, and active courts.
*   **Courts Management:** 
    *   Add, edit, and delete court resources (e.g., 5v5 Football, 7v7, Cricket).
    *   Define court-specific pricing, dimensions, and operating hours.
*   **Bookings Management:**
    *   View all upcoming and past reservations.
    *   Manage statuses (confirm, cancel, complete).
*   **Walk-in Booking (Point of Sale):** A streamlined interface designed for on-site staff to quickly book a court for walk-in customers and collect payment manually.
*   **Customers Management (CRM):** A directory of all customers who have interacted with the facility, tracking their booking history and contact details.
*   **Payments & Analytics:** Track revenue, manage offline/online payments, and view payment statuses.
*   **Reports & Analytics:** Granular insights into court utilization, peak booking hours, and financial performance over time.

## 4. Customer Portal (End-User Experience)
*   **Customer Landing Page:** A public-facing or user-specific page to view the turf facility's details and available courts.
*   **Online Booking Flow:** 
    *   Interactive calendar to browse real-time slot availability.
    *   Select multiple slots and reserve courts directly through the web interface.
*   **Customer Dashboard:** A personalized view for users to track their upcoming and past bookings.

## 5. Super Admin Portal (Platform Management)
*   **Super Admin Dashboard:** A centralized view to monitor the health of the entire SaaS platform, track total tenants, global revenue, and platform-wide metrics.

## 6. Backend Engine Capabilities (Django REST Framework)
*   **Automated Slot Generation:** Dynamically generates bookable time slots based on the operating hours of a specific court.
*   **Conflict Prevention Engine:** Robust validation to prevent double-booking or overlapping reservations on the same court.
*   **Billing & Expense Tracking:** Dedicated endpoints to record and analyze revenue streams and operational expenses for each tenant.
*   **RESTful APIs:** Fully documented and structured API endpoints supporting the complete lifecycle of tenants, users, courts, and bookings.
