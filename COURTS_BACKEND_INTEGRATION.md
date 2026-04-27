# Courts Management - Backend Integration

## What Was Updated

### Backend (Django)
1. **Court Model** - Added new fields:
   - `size` (CharField) - Court dimensions
   - `peak_hour_price` (DecimalField) - Peak hour pricing
   - `status` (CharField with choices) - Active/Maintenance/Inactive
   - `created_at` & `updated_at` (DateTimeField) - Timestamps
   - Extended `sport_type` choices to include Basketball, Volleyball & Squash

2. **Court Serializer** - Updated serializers.py:
   - Added new fields to serialization
   - Added display methods for readable choices (sport_type_display, status_display)
   - Fields properly marked as read_only where needed

3. **Database Migration** - Created migration 0005:
   - Applied successfully to the database
   - All existing courts preserved

### Frontend (React/TypeScript)
1. **CourtsManagement Component** - Complete redesign:
   - ✅ Fetches courts from backend API (`GET /api/bookings/courts/`)
   - ✅ Creates new courts via API (`POST /api/bookings/courts/`)
   - ✅ Edits courts via API (`PATCH /api/bookings/courts/{id}/`)
   - ✅ Deletes courts via API (`DELETE /api/bookings/courts/{id}/`)
   - ✅ Loading states and error handling
   - ✅ Fallback to local data if API unavailable
   - ✅ Mobile-optimized responsive design
   - ✅ Proper TypeScript typing with Court interface

## API Endpoints Used

```
GET    /api/bookings/courts/           # List all courts
POST   /api/bookings/courts/           # Create new court
GET    /api/bookings/courts/{id}/      # Get court details
PATCH  /api/bookings/courts/{id}/      # Update court
DELETE /api/bookings/courts/{id}/      # Delete court
```

## Field Mapping

### Frontend Form Field → Backend API Field
- `name` → `name`
- `sport_type` → `sport_type` (FOOTBALL, CRICKET, BADMINTON, TENNIS, BASKETBALL, VOLLEYBALL, SQUASH, OTHER)
- `size` → `size`
- `base_price_per_hour` → `base_price_per_hour`
- `peak_hour_price` → `peak_hour_price`
- `status` → `status` (default: ACTIVE)

## Features

### Add Court
- Opens modal with form
- All fields required validation
- Creates court in backend
- Returns to list on success
- Shows error message on failure

### Edit Court
- Click edit icon on any court card
- Modal opens with pre-filled data
- Updates court in backend
- Refreshes list on success

### Delete Court
- Click trash icon on any court card
- Confirmation dialog
- Deletes from backend
- Removes from list

### Error Handling
- Network errors display as banner
- Fallback to local demo data if API fails
- Loading spinners during operations
- Disabled buttons during submission

## Testing the Integration

1. **Start both servers**:
   ```bash
   # Backend
   cd d:\turf\turf_backend
   python manage.py runserver
   
   # Frontend
   cd "D:\turf\B2B Turf Management SaaS UI"
   npm run dev
   ```

2. **Navigate to Courts & Grounds**
   - Frontend loads courts from backend
   - Add a new court and verify it saves to database
   - Edit a court and refresh - changes persist
   - Delete a court and refresh - deletion persists

3. **Check backend database**:
   ```bash
   python manage.py shell
   >>> from bookings.models import Court
   >>> Court.objects.all()
   ```

## Notes

- CORS is enabled on backend (`CORS_ALLOW_ALL_ORIGINS = True`)
- API base URL configured in frontend `.env`: `VITE_API_BASE_URL=http://localhost:8000/api/`
- Authentication not yet implemented (open endpoints)
- Tenant association will be handled once user auth is added
