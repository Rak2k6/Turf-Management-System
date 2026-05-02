from rest_framework import viewsets, permissions, filters, views, status as http_status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from .models import Court, Booking, Slot
from .serializers import CourtSerializer, BookingSerializer, SlotSerializer
from .permissions import IsTenantOwner, IsStaffOrOwner, IsBookingOwner
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Q, Sum, Count
from django_filters.rest_framework import DjangoFilterBackend

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CourtViewSet(viewsets.ModelViewSet):
    serializer_class = CourtSerializer
    queryset = Court.objects.all()
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tenant', 'sport_type', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'base_price_per_hour']

    def get_permissions(self):
        # For development/testing: allow all users to manage courts
        # TODO: In production, change back to [IsTenantOwner()] for write operations
        return [permissions.AllowAny()]

    def get_queryset(self):
        # Handle Nested Router Case: /api/tenants/{tenant_pk}/courts/
        tenant_pk = self.kwargs.get('tenant_lookup') # from NestedSimpleRouter lookup='tenant'
        if tenant_pk:
            return Court.objects.filter(tenant_id=tenant_pk)
            
        queryset = Court.objects.all()
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        return queryset

    def perform_create(self, serializer):
        tenant_pk = self.kwargs.get('tenant_lookup')
        if tenant_pk:
            # Verify ownership if nested
            if self.request.user.is_authenticated and hasattr(self.request.user, 'role'):
                if self.request.user.role == 'TURF_ADMIN' and str(self.request.user.owned_tenant.id) != tenant_pk:
                    raise permissions.PermissionDenied("You do not own this tenant.")
            serializer.save(tenant_id=tenant_pk)
        else:
            # For development/testing: allow creating courts with default tenant
            # TODO: In production, require authenticated user with owned_tenant
            if self.request.user.is_authenticated and hasattr(self.request.user, 'owned_tenant'):
                serializer.save(tenant=self.request.user.owned_tenant)
            else:
                # Use first tenant or require tenant_id parameter
                from tenants.models import Tenant
                default_tenant = Tenant.objects.first()
                if default_tenant:
                    serializer.save(tenant=default_tenant)
                else:
                    raise permissions.PermissionDenied("No tenant available. Please create a tenant first.")

class SlotViewSet(viewsets.ModelViewSet):
    serializer_class = SlotSerializer
    queryset = Slot.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['court', 'is_active']
    ordering_fields = ['start_time']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTenantOwner()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        tenant_pk = self.kwargs.get('tenant_lookup')
        if tenant_pk:
            return Slot.objects.filter(court__tenant_id=tenant_pk)
            
        queryset = Slot.objects.all()
        court_id = self.request.query_params.get('court')
        if court_id:
            queryset = queryset.filter(court_id=court_id)
        return queryset

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['court', 'status', 'payment_status', 'date']
    ordering_fields = ['created_at', 'date', 'start_time']

    def get_permissions(self):
        # For development/testing: allow all users to view and create bookings
        # Walk-in bookings must be creatable by anonymous users
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        tenant_pk = self.kwargs.get('tenant_lookup')
        
        base_queryset = Booking.objects.all()
        if tenant_pk:
            base_queryset = base_queryset.filter(court__tenant_id=tenant_pk)

        # For development/testing: allow anonymous users to see all bookings
        # This allows dashboard to display walk-in bookings created by anonymous users
        # TODO: In production, restrict based on user role
        if not user.is_authenticated:
            # For development: return all bookings for anonymous users
            # (anonymous users can see what bookings exist)
            return base_queryset.order_by('-created_at')
        
        # Handle authenticated users based on role
        if hasattr(user, 'role'):
            if user.role == 'SUPER_ADMIN':
                return base_queryset.order_by('-created_at')
            elif user.role == 'TURF_ADMIN':
                # Tenant owners only see their own tenant's bookings
                return base_queryset.filter(court__tenant__owner=user).order_by('-created_at')
        
        # Customers see their own bookings (optionally filtered by tenant if nested)
        return base_queryset.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        # For walk-in bookings (anonymous users), don't set customer
        # For authenticated users, automatically set as customer
        if self.request.user.is_authenticated:
            serializer.save(customer=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], url_path='my-bookings')
    def my_bookings(self, request):
        """
        Custom endpoint for users to see their own bookings.
        """
        queryset = self.get_queryset().filter(customer=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'CANCELLED':
            return Response({"error": "Cannot confirm a cancelled booking"}, status=400)
        booking.status = 'CONFIRMED'
        booking.save()
        return Response({'status': 'booking confirmed'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'CANCELLED'
        booking.save()
        return Response({'status': 'booking cancelled'})


class SlotAvailabilityView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        court_id = request.query_params.get('court')
        date_str = request.query_params.get('date') # YYYY-MM-DD

        if not court_id or not date_str:
            return Response({"error": "court and date are required"}, status=400)

        try:
            court = Court.objects.get(id=court_id)
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Court.DoesNotExist:
             return Response({"error": "Court not found"}, status=404)
        except ValueError:
             return Response({"error": "Invalid date format"}, status=400)

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

        return Response(available_slots)

class DashboardAnalyticsView(views.APIView):
    # Allow any for development/dashboard access; TODO: restrict in production
    permission_classes = [permissions.AllowAny]

    def get_tenant(self, request):
        if request.user.is_authenticated and hasattr(request.user, 'owned_tenant'):
            try:
                return request.user.owned_tenant
            except Exception:
                pass
        # Fallback: use first available tenant (for dev/anonymous access)
        from tenants.models import Tenant
        return Tenant.objects.first()

    def get(self, request, metric=None):
        tenant = self.get_tenant(request)
        if not tenant:
            return Response({"error": "No tenant found. Please seed data first."}, status=404)

        today = timezone.now().date()
        # Strictly exclude CANCELLED from all counts/sums
        base_queryset = Booking.objects.filter(court__tenant=tenant).exclude(status='CANCELLED')

        if metric == 'today-bookings':
            count = base_queryset.filter(date=today).count()
            return Response({"count": count})

        elif metric == 'today-revenue':
            # Only CONFIRMED counts as revenue in production
            revenue = base_queryset.filter(date=today, status='CONFIRMED').aggregate(total=Sum('total_price'))['total'] or 0
            return Response({"revenue": float(revenue)})

        elif metric == 'total-bookings':
            count = base_queryset.count()
            return Response({"count": count})

        elif metric == 'court-stats':
            stats = base_queryset.values('court__name').annotate(count=Count('id')).order_by('-count')
            return Response(list(stats))

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
            court_data = {}
            for c in Court.objects.filter(tenant=tenant):
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
            })

        return Response({"error": "Invalid metric"}, status=400)
