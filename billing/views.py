"""
billing/views.py

Production-grade ViewSets for the Billing module.
Covers:
  - CustomerViewSet       : CRUD + activate/deactivate custom actions + search/filter
  - RevenueViewSet        : CRUD + date-range filter + payment-method filter + summary action
  - ExpenseViewSet        : CRUD + date-range filter + category filter + summary action
  - BillingDashboardView  : GET-only aggregate dashboard (net profit, breakdowns, monthly)
"""

import logging
from decimal import Decimal

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.permissions import IsTenantOwner, IsSuperAdmin

from .models import Customer, Revenue, Expense
from .serializers import (
    CustomerSerializer,
    CustomerListSerializer,
    RevenueSerializer,
    RevenueListSerializer,
    ExpenseSerializer,
    ExpenseListSerializer,
    BillingDashboardSerializer,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_tenant(user):
    """
    Return the Tenant associated with *user*, or None for SUPER_ADMIN.
    Raises PermissionDenied if the user has no tenant association.
    """
    if user.role == 'SUPER_ADMIN':
        return None
    try:
        return user.owned_tenant
    except Exception:
        raise PermissionDenied(
            "Your account is not associated with a tenant. "
            "Please contact the system administrator."
        )


def _require_tenant(user):
    """Like _resolve_tenant but always raises for SUPER_ADMIN (write operations)."""
    tenant = _resolve_tenant(user)
    if tenant is None:
        raise PermissionDenied(
            "Super-admin accounts cannot create billing records directly. "
            "Use a tenant-owner account."
        )
    return tenant


# ---------------------------------------------------------------------------
# Customer ViewSet
# ---------------------------------------------------------------------------

class CustomerViewSet(viewsets.ModelViewSet):
    """
    Manage billing customers.

    List   : GET  /api/customers/
    Create : POST /api/customers/
    Retrieve: GET  /api/customers/{id}/
    Update : PUT  /api/customers/{id}/
    Partial: PATCH /api/customers/{id}/
    Delete : DELETE /api/customers/{id}/

    Custom Actions:
      POST /api/customers/{id}/activate/
      POST /api/customers/{id}/deactivate/

    Query Params:
      ?search=<name|phone|email>
      ?is_active=true|false
      ?ordering=name|-name|created_at|-created_at
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            qs = Customer.objects.select_related('tenant', 'user').all()
        else:
            tenant = _resolve_tenant(user)
            qs = Customer.objects.select_related('tenant', 'user').filter(tenant=tenant)

        # Optional active filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ('true', '1', 'yes'))

        return qs

    def perform_create(self, serializer):
        tenant = _require_tenant(self.request.user)
        try:
            instance = serializer.save(tenant=tenant)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)
        logger.info(
            "Customer created: id=%s name=%s tenant=%s by user=%s",
            instance.pk, instance.name, tenant.name, self.request.user.id,
        )

    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        """Activate a previously deactivated customer."""
        customer = self.get_object()
        customer.is_active = True
        customer.save(update_fields=['is_active', 'updated_at'])
        logger.info("Customer activated: id=%s by user=%s", customer.pk, request.user.id)
        return Response({'status': 'activated', 'id': customer.pk})

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        """Deactivate a customer (soft delete)."""
        customer = self.get_object()
        customer.is_active = False
        customer.save(update_fields=['is_active', 'updated_at'])
        logger.info("Customer deactivated: id=%s by user=%s", customer.pk, request.user.id)
        return Response({'status': 'deactivated', 'id': customer.pk})


# ---------------------------------------------------------------------------
# Revenue ViewSet
# ---------------------------------------------------------------------------

class RevenueViewSet(viewsets.ModelViewSet):
    """
    Manage revenue entries.

    List   : GET  /api/revenues/
    Create : POST /api/revenues/
    Retrieve: GET  /api/revenues/{id}/
    Update : PUT  /api/revenues/{id}/
    Partial: PATCH /api/revenues/{id}/
    Delete : DELETE /api/revenues/{id}/

    Custom Actions:
      GET /api/revenues/summary/       — aggregated totals by payment method

    Query Params:
      ?date_from=YYYY-MM-DD
      ?date_to=YYYY-MM-DD
      ?payment_method=CASH|CARD|UPI|ONLINE|OTHER
      ?booking=<booking_id>
      ?customer=<customer_id>
      ?is_verified=true|false
      ?ordering=date|-date|amount|-amount
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return RevenueListSerializer
        return RevenueSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            qs = Revenue.objects.select_related('tenant', 'booking', 'booking__court', 'customer').all()
        else:
            tenant = _resolve_tenant(user)
            qs = Revenue.objects.select_related(
                'tenant', 'booking', 'booking__court', 'customer'
            ).filter(tenant=tenant)

        params = self.request.query_params

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        payment_method = params.get('payment_method')
        if payment_method:
            qs = qs.filter(payment_method=payment_method.upper())

        booking_id = params.get('booking')
        if booking_id:
            qs = qs.filter(booking_id=booking_id)

        customer_id = params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        is_verified = params.get('is_verified')
        if is_verified is not None:
            qs = qs.filter(is_verified=is_verified.lower() in ('true', '1', 'yes'))

        return qs

    def perform_create(self, serializer):
        tenant = _require_tenant(self.request.user)
        try:
            instance = serializer.save(tenant=tenant)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)
        logger.info(
            "Revenue created: id=%s amount=%s date=%s tenant=%s by user=%s",
            instance.pk, instance.amount, instance.date, tenant.name, self.request.user.id,
        )

    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        Return an aggregate summary of revenue for the current tenant.
        Supports the same date_from/date_to filters as the list view.
        """
        qs = self.get_queryset()

        totals = qs.aggregate(
            total=Sum('amount'),
            count=Count('id'),
        )
        by_payment_method = list(
            qs.values('payment_method')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        return Response({
            'total_revenue': totals['total'] or Decimal('0.00'),
            'transaction_count': totals['count'] or 0,
            'by_payment_method': by_payment_method,
        })

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        """Mark a revenue entry as verified/reconciled."""
        revenue = self.get_object()
        revenue.is_verified = True
        revenue.save(update_fields=['is_verified', 'updated_at'])
        logger.info("Revenue verified: id=%s by user=%s", revenue.pk, request.user.id)
        return Response({'status': 'verified', 'receipt_number': revenue.receipt_number})


# ---------------------------------------------------------------------------
# Expense ViewSet
# ---------------------------------------------------------------------------

class ExpenseViewSet(viewsets.ModelViewSet):
    """
    Manage expense entries.

    List   : GET  /api/expenses/
    Create : POST /api/expenses/
    Retrieve: GET  /api/expenses/{id}/
    Update : PUT  /api/expenses/{id}/
    Partial: PATCH /api/expenses/{id}/
    Delete : DELETE /api/expenses/{id}/

    Custom Actions:
      GET /api/expenses/summary/       — aggregated totals by category

    Query Params:
      ?date_from=YYYY-MM-DD
      ?date_to=YYYY-MM-DD
      ?category=MAINTENANCE|UTILITIES|SALARIES|EQUIPMENT|RENT|MARKETING|INSURANCE|TAXES|OTHER
      ?is_recurring=true|false
      ?ordering=date|-date|amount|-amount
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return ExpenseListSerializer
        return ExpenseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            qs = Expense.objects.select_related('tenant').all()
        else:
            tenant = _resolve_tenant(user)
            qs = Expense.objects.select_related('tenant').filter(tenant=tenant)

        params = self.request.query_params

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        category = params.get('category')
        if category:
            qs = qs.filter(category=category.upper())

        is_recurring = params.get('is_recurring')
        if is_recurring is not None:
            qs = qs.filter(is_recurring=is_recurring.lower() in ('true', '1', 'yes'))

        return qs

    def perform_create(self, serializer):
        tenant = _require_tenant(self.request.user)
        try:
            instance = serializer.save(tenant=tenant)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)
        logger.info(
            "Expense created: id=%s amount=%s category=%s tenant=%s by user=%s",
            instance.pk, instance.amount, instance.category, tenant.name, self.request.user.id,
        )

    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        Return an aggregate summary of expenses grouped by category.
        Supports the same date_from/date_to filters as the list view.
        """
        qs = self.get_queryset()

        totals = qs.aggregate(
            total=Sum('amount'),
            count=Count('id'),
        )
        by_category = list(
            qs.values('category')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        return Response({
            'total_expenses': totals['total'] or Decimal('0.00'),
            'expense_count': totals['count'] or 0,
            'by_category': by_category,
        })


# ---------------------------------------------------------------------------
# Billing Dashboard View
# ---------------------------------------------------------------------------

class BillingDashboardView(APIView):
    """
    Aggregate billing dashboard for the authenticated tenant owner.

    GET /api/billing/dashboard/

    Optional Query Params:
      ?date_from=YYYY-MM-DD
      ?date_to=YYYY-MM-DD

    Returns:
      - total_revenue
      - total_expenses
      - net_profit
      - revenue_count
      - expense_count
      - customer_count (active)
      - revenue_by_payment_method   [ {payment_method, total, count} ]
      - expenses_by_category        [ {category, total, count} ]
      - monthly_summary             [ {month, revenue, expenses, net} ]
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]

    def get(self, request):
        user = request.user

        if user.role == 'SUPER_ADMIN':
            revenues = Revenue.objects.all()
            expenses = Expense.objects.all()
            customers = Customer.objects.all()
        else:
            tenant = _resolve_tenant(user)
            revenues = Revenue.objects.filter(tenant=tenant)
            expenses = Expense.objects.filter(tenant=tenant)
            customers = Customer.objects.filter(tenant=tenant)

        # --- Date range filters ---
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if date_from:
            revenues = revenues.filter(date__gte=date_from)
            expenses = expenses.filter(date__gte=date_from)

        if date_to:
            revenues = revenues.filter(date__lte=date_to)
            expenses = expenses.filter(date__lte=date_to)

        # --- Aggregate totals ---
        rev_agg = revenues.aggregate(total=Sum('amount'), count=Count('id'))
        exp_agg = expenses.aggregate(total=Sum('amount'), count=Count('id'))

        total_revenue = rev_agg['total'] or Decimal('0.00')
        total_expenses = exp_agg['total'] or Decimal('0.00')
        net_profit = total_revenue - total_expenses

        # --- Revenue by payment method ---
        rev_by_pm = list(
            revenues.values('payment_method')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        # --- Expenses by category ---
        exp_by_cat = list(
            expenses.values('category')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        # --- Monthly breakdown (last 12 months) ---
        rev_monthly = (
            revenues.annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(revenue=Sum('amount'))
            .order_by('month')
        )
        exp_monthly = (
            expenses.annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(expenses=Sum('amount'))
            .order_by('month')
        )

        # Merge into a single monthly summary dict
        monthly_map: dict = {}
        for row in rev_monthly:
            key = str(row['month'])[:7]  # YYYY-MM
            monthly_map.setdefault(key, {'month': key, 'revenue': Decimal('0'), 'expenses': Decimal('0')})
            monthly_map[key]['revenue'] = row['revenue'] or Decimal('0')
        for row in exp_monthly:
            key = str(row['month'])[:7]
            monthly_map.setdefault(key, {'month': key, 'revenue': Decimal('0'), 'expenses': Decimal('0')})
            monthly_map[key]['expenses'] = row['expenses'] or Decimal('0')

        monthly_summary = sorted(
            [
                {
                    'month': v['month'],
                    'revenue': str(v['revenue']),
                    'expenses': str(v['expenses']),
                    'net': str(v['revenue'] - v['expenses']),
                }
                for v in monthly_map.values()
            ],
            key=lambda x: x['month'],
        )

        data = {
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'revenue_count': rev_agg['count'] or 0,
            'expense_count': exp_agg['count'] or 0,
            'customer_count': customers.filter(is_active=True).count(),
            'revenue_by_payment_method': rev_by_pm,
            'expenses_by_category': exp_by_cat,
            'monthly_summary': monthly_summary,
        }

        serializer = BillingDashboardSerializer(data)
        return Response(serializer.data)
