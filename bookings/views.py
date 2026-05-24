from rest_framework import viewsets, permissions, filters, views, status as http_status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from .models import Court, Booking, Slot
from .serializers import CourtSerializer, BookingSerializer, SlotSerializer
from .permissions import IsTenantOwner, IsStaffOrOwner, IsBookingOwner, IsSuperAdmin
from .mixins import StandardResponseMixin
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Q, Sum, Count
from django_filters.rest_framework import DjangoFilterBackend


def _get_user_tenant(user):
    """Helper to get the tenant for an authenticated user."""
    if user.role == 'SUPER_ADMIN':
        return None  # Super admin can see all
    if hasattr(user, 'owned_tenant'):
        try:
            return user.owned_tenant
        except Exception:
            return None
    return None


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# ──────────────────────────────────────────────────────────────────────
#  Court ViewSet
# ──────────────────────────────────────────────────────────────────────
class CourtViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    serializer_class = CourtSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sport_type', 'is_active', 'status']
    search_fields = ['name']
    ordering_fields = ['name', 'base_price_per_hour']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantOwner()]
        # Read-only actions (list/retrieve) — any authenticated user
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        # Handle Nested Router Case: /api/tenants/{tenant_pk}/courts/
        tenant_pk = self.kwargs.get('tenant_lookup')
        if tenant_pk:
            # Nested route — still enforce ownership for non-super-admins
            if user.role == 'TURF_ADMIN':
                tenant = _get_user_tenant(user)
                if tenant and str(tenant.id) != str(tenant_pk):
                    return Court.objects.none()
            return Court.objects.filter(tenant_id=tenant_pk)

        # Super admin sees everything
        if user.role == 'SUPER_ADMIN':
            return Court.objects.all()

        # Turf admin / staff — see only their own tenant's courts
        if user.role in ('TURF_ADMIN', 'STAFF'):
            tenant = _get_user_tenant(user)
            if tenant:
                return Court.objects.filter(tenant=tenant)
            return Court.objects.none()

        # Customers — see all active courts (read-only, filtered by is_active)
        return Court.objects.filter(is_active=True, status='ACTIVE')

    def perform_create(self, serializer):
        user = self.request.user
        tenant_pk = self.kwargs.get('tenant_lookup')

        if tenant_pk:
            # Verify ownership if nested
            if user.role == 'TURF_ADMIN' and str(user.owned_tenant.id) != tenant_pk:
                raise permissions.PermissionDenied("You do not own this tenant.")
            serializer.save(tenant_id=tenant_pk)
        else:
            # Infer tenant from authenticated user — never trust frontend
            tenant = _get_user_tenant(user)
            if tenant:
                serializer.save(tenant=tenant)
            else:
                raise permissions.PermissionDenied(
                    "No tenant associated with your account. Please contact support."
                )


# ──────────────────────────────────────────────────────────────────────
#  Slot ViewSet
# ──────────────────────────────────────────────────────────────────────
class SlotViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    serializer_class = SlotSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['court', 'is_active']
    ordering_fields = ['start_time']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTenantOwner()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        tenant_pk = self.kwargs.get('tenant_lookup')
        if tenant_pk:
            if user.role == 'TURF_ADMIN':
                tenant = _get_user_tenant(user)
                if tenant and str(tenant.id) != str(tenant_pk):
                    return Slot.objects.none()
            return Slot.objects.filter(court__tenant_id=tenant_pk)

        if user.role == 'SUPER_ADMIN':
            return Slot.objects.all()

        if user.role in ('TURF_ADMIN', 'STAFF'):
            tenant = _get_user_tenant(user)
            if tenant:
                return Slot.objects.filter(court__tenant=tenant)
            return Slot.objects.none()

        # Customers — only active slots on active courts
        return Slot.objects.filter(is_active=True, court__is_active=True, court__status='ACTIVE')


# ──────────────────────────────────────────────────────────────────────
#  Booking ViewSet
# ──────────────────────────────────────────────────────────────────────
class BookingViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['court', 'status', 'payment_status', 'date']
    ordering_fields = ['created_at', 'date', 'start_time']

    def get_permissions(self):
        # Customers can create bookings; only owners/staff can update/delete
        if self.action in ['update', 'partial_update', 'destroy', 'confirm', 'cancel']:
            return [permissions.IsAuthenticated(), IsBookingOwner()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        tenant_pk = self.kwargs.get('tenant_lookup')

        base_queryset = Booking.objects.select_related('court', 'court__tenant', 'slot', 'customer')

        if tenant_pk:
            # Nested route — enforce tenant ownership
            if user.role == 'TURF_ADMIN':
                tenant = _get_user_tenant(user)
                if tenant and str(tenant.id) != str(tenant_pk):
                    return Booking.objects.none()
            base_queryset = base_queryset.filter(court__tenant_id=tenant_pk)

        # Super admin sees everything
        if user.role == 'SUPER_ADMIN':
            return base_queryset.order_by('-created_at')

        # Turf admin sees their own tenant's bookings
        if user.role in ('TURF_ADMIN', 'STAFF'):
            tenant = _get_user_tenant(user)
            if tenant:
                return base_queryset.filter(court__tenant=tenant).order_by('-created_at')
            return Booking.objects.none()

        # Customers see ONLY their own bookings — strict isolation
        return base_queryset.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user

        # For turf admins creating walk-in bookings
        if user.role in ['TURF_ADMIN', 'SUPER_ADMIN', 'STAFF']:
            # Validate the court belongs to the user's tenant
            court = serializer.validated_data.get('court')
            if user.role == 'TURF_ADMIN' and court:
                tenant = _get_user_tenant(user)
                if tenant and court.tenant != tenant:
                    raise permissions.PermissionDenied(
                        "You cannot create bookings for courts outside your organization."
                    )
            serializer.save()
        else:
            # Customer booking — force-set themselves as customer (never trust frontend)
            serializer.save(customer=user)

    @action(detail=False, methods=['get'], url_path='my-bookings')
    def my_bookings(self, request):
        """
        Custom endpoint for users to see their own bookings.
        """
        queryset = Booking.objects.filter(customer=request.user).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None, **kwargs):
        booking = self.get_object()
        if booking.status == 'CANCELLED':
            return Response(
                {"success": False, "message": "Cannot confirm a cancelled booking."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        booking.status = 'CONFIRMED'
        booking.save()
        return Response({"success": True, "message": "Booking confirmed."})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None, **kwargs):
        booking = self.get_object()
        if booking.status == 'CANCELLED':
            return Response(
                {"success": False, "message": "Booking is already cancelled."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        booking.status = 'CANCELLED'
        booking.save()
        return Response({"success": True, "message": "Booking cancelled."})


# ──────────────────────────────────────────────────────────────────────
#  Slot Availability (public-ish)
# ──────────────────────────────────────────────────────────────────────
class SlotAvailabilityView(views.APIView):
    """
    Public-ish endpoint to check slot availability for a court on a date.
    Still requires authentication to ensure tenant context.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        court_id = request.query_params.get('court')
        date_str = request.query_params.get('date')  # YYYY-MM-DD

        if not court_id or not date_str:
            return Response(
                {"success": False, "message": "court and date are required."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        try:
            court = Court.objects.get(id=court_id)
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Court.DoesNotExist:
            return Response(
                {"success": False, "message": "Court not found."},
                status=http_status.HTTP_404_NOT_FOUND,
            )
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid date format. Use YYYY-MM-DD."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Verify the requesting user can access this court
        user = request.user
        if user.role == 'TURF_ADMIN':
            tenant = _get_user_tenant(user)
            if tenant and court.tenant != tenant:
                return Response(
                    {"success": False, "message": "Court not found."},
                    status=http_status.HTTP_404_NOT_FOUND,
                )

        # Fetch defined slots for this court
        slots = Slot.objects.filter(court=court, is_active=True).order_by('start_time')
        
        # Fetch bookings for this court and date (exclude CANCELLED)
        booked_slot_ids = Booking.objects.filter(
            court=court,
            date=target_date,
        ).exclude(status='CANCELLED').values_list('slot_id', flat=True)

        available_slots = []
        for slot in slots:
            available_slots.append({
                "id": slot.id,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "price": slot.price,
                "is_available": slot.id not in booked_slot_ids
            })

        return Response({"success": True, "data": available_slots})


# ──────────────────────────────────────────────────────────────────────
#  Dashboard Analytics
# ──────────────────────────────────────────────────────────────────────
class DashboardAnalyticsView(views.APIView):
    """
    Dashboard analytics — scoped to authenticated user's tenant.
    Only TURF_ADMIN, STAFF, and SUPER_ADMIN can access.
    """
    permission_classes = [permissions.IsAuthenticated, IsStaffOrOwner]

    def get_tenant(self, request):
        user = request.user
        if user.role == 'SUPER_ADMIN':
            # Super admin: optionally filter by tenant_id param, or return all
            from tenants.models import Tenant
            tenant_id = request.query_params.get('tenant_id')
            if tenant_id:
                try:
                    return Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return None
            return None  # Means "all tenants"

        return _get_user_tenant(user)

    def get(self, request, metric=None):
        tenant = self.get_tenant(request)

        # For turf admins, tenant is mandatory
        if request.user.role == 'TURF_ADMIN' and not tenant:
            return Response(
                {"success": False, "message": "No tenant associated with your account."},
                status=http_status.HTTP_404_NOT_FOUND,
            )

        today = timezone.now().date()
        # Strictly exclude CANCELLED from all counts/sums
        base_queryset = Booking.objects.exclude(status='CANCELLED')
        if tenant:
            base_queryset = base_queryset.filter(court__tenant=tenant)

        if metric == 'today-bookings':
            count = base_queryset.filter(date=today).count()
            return Response({"success": True, "data": {"count": count}})

        elif metric == 'today-revenue':
            # Only CONFIRMED counts as revenue in production
            revenue = base_queryset.filter(date=today, status='CONFIRMED').aggregate(total=Sum('total_price'))['total'] or 0
            return Response({"success": True, "data": {"revenue": float(revenue)}})

        elif metric == 'total-bookings':
            count = base_queryset.count()
            return Response({"success": True, "data": {"count": count}})

        elif metric == 'court-stats':
            stats = base_queryset.values('court__name').annotate(count=Count('id')).order_by('-count')
            return Response({"success": True, "data": list(stats)})

        elif metric == 'reports-summary':
            bookings = list(base_queryset.values(
                'date', 'start_time', 'total_price',
                'court__id', 'court__name', 'court__sport_type',
                'customer_phone'
            ))
            
            total_bookings = len(bookings)
            total_revenue = sum(b['total_price'] for b in bookings if b['total_price'])
            unique_customers = len(set(b['customer_phone'] for b in bookings if b['customer_phone']))
            unique_dates = len(set(b['date'] for b in bookings))
            avg_revenue_day = (total_revenue / unique_dates) if unique_dates > 0 else 0
            
            from datetime import timedelta
            seven_days_ago = today - timedelta(days=6)
            weekly_data = []
            
            for i in range(7):
                d = seven_days_ago + timedelta(days=i)
                day_name = d.strftime('%a')
                day_bookings = [b for b in bookings if b['date'] == d]
                weekly_data.append({
                    'day': day_name,
                    'bookings': len(day_bookings),
                    'revenue': float(sum(b['total_price'] for b in day_bookings if b['total_price']))
                })
                
            # Seed ALL courts for the tenant keyed by ID to handle same-name courts
            SPORT_TYPE_LABELS = dict(Court.SPORT_CHOICES)
            court_queryset = Court.objects.filter(tenant=tenant) if tenant else Court.objects.all()
            court_data = {}
            for c in court_queryset:
                sport_label = SPORT_TYPE_LABELS.get(c.sport_type, c.sport_type)
                label = f"{c.name} ({sport_label})" if c.name else f"Court {c.id}"
                court_data[c.id] = {'label': label, 'count': 0}

            for b in bookings:
                cid = b.get('court__id')
                if cid and cid in court_data:
                    court_data[cid]['count'] += 1

            max_court_bookings = max((v['count'] for v in court_data.values()), default=1) or 1
            court_utilization = [
                {'court': v['label'], 'utilization': int((v['count'] / max_court_bookings) * 100)}
                for v in court_data.values()
            ]
            
            hour_data = {}
            for b in bookings:
                if b['start_time']:
                    # Use localized time if possible, or just the DB time
                    h = b['start_time'].hour
                    ampm = "AM" if h < 12 else "PM"
                    hr12 = h if h <= 12 else h - 12
                    if hr12 == 0: hr12 = 12
                    hour_label = f"{hr12} {ampm}"
                    hour_data[hour_label] = hour_data.get(hour_label, 0) + 1
                
            def hour_sort_key(label):
                is_pm = 'PM' in label
                val = int(label.split(' ')[0])
                if val == 12: val = 0
                return val + (12 if is_pm else 0)
                
            peak_hours = [{'hour': k, 'bookings': v} for k, v in sorted(hour_data.items(), key=lambda item: hour_sort_key(item[0]))]

            # --- Performance Summary ---
            # Best performing day from weekly data
            best_day = max(weekly_data, key=lambda d: d['bookings']) if weekly_data else None

            # Most popular court
            most_popular_court = None
            most_popular_court_util = 0
            if court_utilization:
                top_court = max(court_utilization, key=lambda c: c['utilization'])
                most_popular_court = top_court['court']
                most_popular_court_util = top_court['utilization']

            # Peak time (hour with most bookings)
            peak_hour_label = None
            if peak_hours:
                top_hour = max(peak_hours, key=lambda h: h['bookings'])
                peak_hour_label = top_hour['hour']

            # Avg booking duration (end_time - start_time in hours)
            bookings_with_times = list(base_queryset.values('start_time', 'end_time').filter(
                start_time__isnull=False, end_time__isnull=False
            ))
            avg_duration = 0
            if bookings_with_times:
                durations = []
                for b in bookings_with_times:
                    try:
                        diff = b['end_time'] - b['start_time']
                        hours = diff.total_seconds() / 3600
                        if 0 < hours <= 12:
                            durations.append(hours)
                    except Exception:
                        pass
                if durations:
                    avg_duration = round(sum(durations) / len(durations), 1)

            performance_summary = {
                "best_day": {
                    "name": best_day['day'] if best_day else "N/A",
                    "bookings": best_day['bookings'] if best_day else 0,
                    "revenue": best_day['revenue'] if best_day else 0,
                },
                "most_popular_court": {
                    "name": most_popular_court or "N/A",
                    "utilization": most_popular_court_util,
                },
                "peak_time": peak_hour_label or "N/A",
                "avg_duration_hours": avg_duration,
            }

            return Response({
                "success": True,
                "data": {
                    "kpi": {
                        "total_bookings": total_bookings,
                        "total_revenue": float(total_revenue),
                        "unique_customers": unique_customers,
                        "avg_revenue_day": float(round(avg_revenue_day, 2))
                    },
                    "weekly_data": weekly_data,
                    "court_utilization": court_utilization,
                    "peak_hours": peak_hours,
                    "performance_summary": performance_summary,
                }
            })

        return Response(
            {"success": False, "message": "Invalid metric."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )
