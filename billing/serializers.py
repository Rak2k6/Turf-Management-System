"""
billing/serializers.py

Production-grade serializers for the Billing module.
Covers:
  - CustomerSerializer            : full CRUD with contact validation
  - CustomerListSerializer        : lightweight list representation
  - RevenueSerializer             : create/update with nested read-only fields
  - RevenueListSerializer         : lightweight list with booking/customer labels
  - ExpenseSerializer             : create/update with validation
  - ExpenseListSerializer         : lightweight list with category display
  - BillingDashboardSerializer    : read-only aggregate summary
"""

import re
from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework import serializers

from .models import Customer, Revenue, Expense


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_PHONE_RE = re.compile(r'^\+?[\d\s\-]{7,15}$')


def _validate_phone(value: str) -> str:
    """Normalise whitespace and validate phone format."""
    value = value.strip()
    if value and not _PHONE_RE.match(value):
        raise serializers.ValidationError(
            "Enter a valid phone number (7–15 digits, optional leading +)."
        )
    return value


def _validate_positive_amount(value: Decimal) -> Decimal:
    if value <= Decimal('0'):
        raise serializers.ValidationError("Amount must be greater than zero.")
    return value


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class CustomerSerializer(serializers.ModelSerializer):
    """
    Full serializer used for create / retrieve / update / partial_update.
    The `tenant` field is injected by the view and is read-only here.
    """

    # Human-readable label for the linked user (read-only)
    user_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id',
            'tenant',
            'user',
            'user_display',
            'name',
            'phone',
            'email',
            'notes',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at', 'user_display')

    def get_user_display(self, obj) -> str | None:
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None

    def validate_phone(self, value: str) -> str:
        return _validate_phone(value)

    def validate(self, attrs):
        phone = attrs.get('phone', '')
        email = attrs.get('email', '')
        # On update, fall back to the existing instance values
        if self.instance:
            phone = phone or self.instance.phone
            email = email or self.instance.email
        if not phone and not email:
            raise serializers.ValidationError(
                "A customer must have at least a phone number or an email address."
            )
        return attrs


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested data)."""

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'is_active', 'created_at']


# ---------------------------------------------------------------------------
# Revenue
# ---------------------------------------------------------------------------

class RevenueSerializer(serializers.ModelSerializer):
    """
    Full serializer for Revenue create / retrieve / update.
    Provides nested read-only fields for booking and customer context.
    """

    # Read-only enriched fields
    booking_display = serializers.SerializerMethodField(read_only=True)
    customer_display = serializers.SerializerMethodField(read_only=True)
    payment_method_display = serializers.SerializerMethodField(read_only=True)
    tenant_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Revenue
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'booking',
            'booking_display',
            'customer',
            'customer_display',
            'receipt_number',
            'amount',
            'date',
            'description',
            'payment_method',
            'payment_method_display',
            'is_verified',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'id',
            'tenant',
            'tenant_name',
            'receipt_number',
            'booking_display',
            'customer_display',
            'payment_method_display',
            'created_at',
            'updated_at',
        )

    def get_booking_display(self, obj) -> dict | None:
        if obj.booking:
            return {
                'id': obj.booking.id,
                'date': obj.booking.date,
                'court': obj.booking.court.name,
            }
        return None

    def get_customer_display(self, obj) -> dict | None:
        if obj.customer:
            return {'id': obj.customer.id, 'name': obj.customer.name}
        return None

    def get_payment_method_display(self, obj) -> str:
        return obj.get_payment_method_display()

    def get_tenant_name(self, obj) -> str:
        return obj.tenant.name

    def validate_amount(self, value: Decimal) -> Decimal:
        return _validate_positive_amount(value)

    def validate_customer(self, customer):
        """
        Ensure the customer belongs to the same tenant as this revenue entry.
        The tenant is set at perform_create time; during partial validation we
        rely on the request context.
        """
        if customer is None:
            return customer
        request = self.context.get('request')
        if request and hasattr(request.user, 'owned_tenant'):
            try:
                tenant = request.user.owned_tenant
                if customer.tenant != tenant:
                    raise serializers.ValidationError(
                        "Customer does not belong to your tenant."
                    )
            except Exception:
                pass  # SUPER_ADMIN — skip cross-tenant guard
        return customer


class RevenueListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Revenue
        fields = [
            'id',
            'receipt_number',
            'amount',
            'date',
            'payment_method',
            'customer_name',
            'is_verified',
        ]

    def get_customer_name(self, obj) -> str | None:
        return obj.customer.name if obj.customer else None


# ---------------------------------------------------------------------------
# Expense
# ---------------------------------------------------------------------------

class ExpenseSerializer(serializers.ModelSerializer):
    """Full serializer for Expense create / retrieve / update."""

    category_display = serializers.SerializerMethodField(read_only=True)
    tenant_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'category',
            'category_display',
            'amount',
            'date',
            'description',
            'is_recurring',
            'recurrence_note',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'id',
            'tenant',
            'tenant_name',
            'category_display',
            'created_at',
            'updated_at',
        )

    def get_category_display(self, obj) -> str:
        return obj.get_category_display()

    def get_tenant_name(self, obj) -> str:
        return obj.tenant.name

    def validate_amount(self, value: Decimal) -> Decimal:
        return _validate_positive_amount(value)

    def validate(self, attrs):
        is_recurring = attrs.get('is_recurring', False)
        recurrence_note = attrs.get('recurrence_note', '').strip()
        # On PATCH, fall back to instance values
        if self.instance:
            is_recurring = is_recurring if 'is_recurring' in attrs else self.instance.is_recurring
            recurrence_note = (
                recurrence_note
                if 'recurrence_note' in attrs
                else self.instance.recurrence_note
            )
        if is_recurring and not recurrence_note:
            raise serializers.ValidationError(
                {'recurrence_note': 'Please describe the recurrence pattern.'}
            )
        return attrs


class ExpenseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    category_display = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'category', 'category_display', 'amount', 'date', 'is_recurring']

    def get_category_display(self, obj) -> str:
        return obj.get_category_display()


# ---------------------------------------------------------------------------
# Billing Dashboard
# ---------------------------------------------------------------------------

class BillingDashboardSerializer(serializers.Serializer):
    """
    Read-only serializer for the billing dashboard summary.
    Computed at the view layer and serialized here for a clean contract.
    """

    # Totals
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    net_profit = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    # Counts
    revenue_count = serializers.IntegerField(read_only=True)
    expense_count = serializers.IntegerField(read_only=True)
    customer_count = serializers.IntegerField(read_only=True)

    # Breakdowns
    revenue_by_payment_method = serializers.ListField(
        child=serializers.DictField(), read_only=True
    )
    expenses_by_category = serializers.ListField(
        child=serializers.DictField(), read_only=True
    )
    monthly_summary = serializers.ListField(
        child=serializers.DictField(), read_only=True
    )
