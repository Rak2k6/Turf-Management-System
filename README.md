# Turf Management SaaS API

A multi-tenant turf and sports facility management backend built with Django and Django REST Framework. The API supports tenant management, courts, time slots, customer bookings, JWT authentication, availability checks, and owner dashboard analytics.

## Features

- JWT authentication with role-based access for super admins, turf admins, staff, and customers
- Tenant-specific courts, slots, and bookings
- Public court, slot, and availability reads
- Booking creation with duplicate slot/date protection
- Booking confirmation and cancellation for tenant owners
- Dashboard metrics for bookings, revenue, and court usage
- SQLite database for local development
- Postman collection and verification scripts included

## Technology

- Python 3.10+
- Django 5+
- Django REST Framework
- Simple JWT
- `django-filter`
- `drf-nested-routers`
- SQLite

## Project Layout

```text
manage.py                 Django command-line entry point
turf_backend/             Project configuration and URL routing
users/                    Custom user model and authentication
tenants/                  Tenant models and API
bookings/                 Courts, slots, bookings, and analytics
billing/                  Billing app scaffold
seed_data.py              Creates local demo users and a sample tenant/court
verify_api.py             Basic API verification flow
verify_extension.py       Slot, booking, availability, and dashboard checks
verify_production.py      Customer, permissions, and duplicate-booking checks
POSTMAN_GUIDE.md          Postman import and authentication instructions
```

## Local Setup

From the project root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python seed_data.py
python manage.py runserver
```

The API is then available at `http://127.0.0.1:8000/`.

If PowerShell blocks script activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Demo Accounts

The seed script creates these accounts when they do not already exist:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `password123` | Super admin |
| `turfowner` | `ownerpass123` | Turf admin |

Public registration creates customer accounts. The seeded tenant is `Best Turf`, with subdomain `bestturf` and a sample `Court A`.

## Authentication

Login:

```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "turfowner",
  "password": "ownerpass123"
}
```

Use the returned access token on protected requests:

```http
Authorization: Bearer <access-token>
```

Related endpoints:

- `POST /api/auth/register/`
- `POST /api/auth/refresh/`
- `GET/PATCH /api/auth/profile/`

## API Overview

### Tenants

- `GET /api/tenants/`
- `POST /api/tenants/`
- `GET /api/my-tenant/`
- `GET/PATCH/DELETE /api/tenants/{tenant_id}/`

### Courts and Slots

- `GET /api/courts/`
- `POST /api/courts/`
- `GET/PATCH/DELETE /api/courts/{court_id}/`
- `GET /api/tenants/{tenant_id}/courts/`
- `GET /api/slots/`
- `POST /api/slots/`
- `GET/PATCH/DELETE /api/slots/{slot_id}/`
- `GET /api/tenants/{tenant_id}/slots/`

Court and slot writes require tenant-owner permissions. List endpoints support filters such as `tenant`, `sport_type`, `is_active`, and `court` where applicable.

### Availability and Bookings

Check active slots for a court and date:

```http
GET /api/availability/?court=1&date=2026-09-10
```

Booking endpoints:

- `GET/POST /api/bookings/`
- `GET /api/bookings/my-bookings/`
- `GET /api/tenants/{tenant_id}/bookings/`
- `POST /api/bookings/{booking_id}/confirm/`
- `POST /api/bookings/{booking_id}/cancel/`

Bookings require authentication. A slot can only have one non-cancelled booking for a given date; an attempted duplicate returns `400 Bad Request`.

### Dashboard

Dashboard endpoints require the tenant owner role:

- `GET /api/dashboard/today-bookings/`
- `GET /api/dashboard/today-revenue/`
- `GET /api/dashboard/total-bookings/`
- `GET /api/dashboard/court-stats/`

## Testing and Verification

Run the Django test suite:

```powershell
python manage.py test
```

Run the included API verification scripts after seeding data and starting the server as needed:

```powershell
python verify_api.py
python verify_extension.py
python verify_production.py
```

For manual API testing, import `turf_management_postman.json` into Postman. See [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md) for the authentication workflow.

## Django Admin

Create an additional administrator with:

```powershell
python manage.py createsuperuser
```

Then open `http://127.0.0.1:8000/admin/`.

## Production Notes

The current settings are intended for local development. Before deployment:

- Move `SECRET_KEY` to an environment variable and rotate the current development key.
- Set `DEBUG = False` and configure explicit `ALLOWED_HOSTS`.
- Restrict `CORS_ALLOW_ALL_ORIGINS` to trusted frontend origins.
- Use a production database and configure static/media file serving.
- Review throttling, HTTPS, token lifetimes, logging, and deployment settings.

## License

No license is currently specified for this project.