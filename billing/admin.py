"""
billing/admin.py

Production-grade Django admin configuration for the Billing module.
Features:
  - Rich list_display, list_filter, search_fields, date_hierarchy
  - Custom admin actions (export to CSV, bulk verify)
  - Inline Revenue entries on Customer admin
  - Revenue inline on BookingAdmin (read-only)
"""

import csv
import logging
from decimal import Decimal

from django.contrib import admin, messages
from django.db.models import Sum
from django.http import HttpResponse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import Customer, Revenue, Expense

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers / Mixins
# ---------------------------------------------------------------------------

def _export_to_csv(modeladmin, request, queryset, filename: str, fields: list[str]):
    """Generic CSV export action helper."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(fields)
    for obj in queryset:
        writer.writerow([getattr(obj, f, '') for f in fields])
    return response


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------

class RevenueInline(admin.TabularInline):
    """Show revenue entries inside a Customer admin page (read-only)."""

    model = Revenue
    fk_name = 'customer'
    extra = 0
    can_delete = False
    show_change_link = True
    readonly_fields = ('receipt_number', 'amount', 'date', 'payment_method', 'is_verified', 'created_at')
    fields = readonly_fields
    verbose_name = 'Revenue Entry'
    verbose_name_plural = 'Revenue Entries'


class BookingRevenueInline(admin.TabularInline):
    """Show revenue entries linked to a Booking (registered on BookingAdmin elsewhere)."""

    model = Revenue
    fk_name = 'booking'
    extra = 0
    can_delete = False
    show_change_link = True
    readonly_fields = ('receipt_number', 'amount', 'payment_method', 'customer', 'is_verified')
    fields = readonly_fields
    verbose_name = 'Revenue Entry'
    verbose_name_plural = 'Revenue Entries'


# ---------------------------------------------------------------------------
# Customer Admin
# ---------------------------------------------------------------------------

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'phone',
        'email',
        'tenant',
        'is_active_badge',
        'linked_user',
        'created_at',
    )
    list_filter = ('is_active', 'tenant', 'created_at')
    search_fields = ('name', 'phone', 'email', 'tenant__name')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 50
    inlines = [RevenueInline]

    fieldsets = (
        ('Identity', {
            'fields': ('tenant', 'user', 'name', 'phone', 'email'),
        }),
        ('Additional', {
            'fields': ('notes', 'is_active'),
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Active', boolean=False)
    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color:green;font-weight:bold;">✓ Active</span>')
        return format_html('<span style="color:red;">✗ Inactive</span>')

    @admin.display(description='Linked User')
    def linked_user(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return '—'

    actions = ['activate_customers', 'deactivate_customers', 'export_customers_csv']

    @admin.action(description='Activate selected customers')
    def activate_customers(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} customer(s) activated.', messages.SUCCESS)

    @admin.action(description='Deactivate selected customers')
    def deactivate_customers(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} customer(s) deactivated.', messages.WARNING)

    @admin.action(description='Export selected customers to CSV')
    def export_customers_csv(self, request, queryset):
        return _export_to_csv(
            self, request, queryset,
            filename='customers.csv',
            fields=['id', 'name', 'phone', 'email', 'is_active', 'created_at'],
        )


# ---------------------------------------------------------------------------
# Revenue Admin
# ---------------------------------------------------------------------------

@admin.register(Revenue)
class RevenueAdmin(admin.ModelAdmin):
    list_display = (
        'receipt_number',
        'tenant',
        'amount_display',
        'date',
        'payment_method',
        'customer',
        'booking_link',
        'is_verified',
        'created_at',
    )
    list_filter = ('is_verified', 'payment_method', 'tenant', 'date')
    search_fields = ('receipt_number', 'description', 'tenant__name', 'customer__name')
    readonly_fields = ('receipt_number', 'created_at', 'updated_at')
    date_hierarchy = 'date'
    ordering = ('-date',)
    list_per_page = 50
    raw_id_fields = ('booking', 'customer')

    fieldsets = (
        ('Core', {
            'fields': ('tenant', 'receipt_number', 'amount', 'date', 'description'),
        }),
        ('Payment', {
            'fields': ('payment_method', 'is_verified'),
        }),
        ('Relations', {
            'fields': ('booking', 'customer'),
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Amount')
    def amount_display(self, obj):
        return format_html('<strong>₹{}</strong>', obj.amount)

    @admin.display(description='Booking')
    def booking_link(self, obj):
        if obj.booking:
            return format_html('<a href="/admin/bookings/booking/{}/change/">#{}</a>', obj.booking.pk, obj.booking.pk)
        return '—'

    actions = ['mark_verified', 'mark_unverified', 'export_revenue_csv']

    @admin.action(description='Mark selected as verified')
    def mark_verified(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} revenue entries marked as verified.', messages.SUCCESS)

    @admin.action(description='Mark selected as unverified')
    def mark_unverified(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} revenue entries marked as unverified.', messages.WARNING)

    @admin.action(description='Export selected revenue to CSV')
    def export_revenue_csv(self, request, queryset):
        return _export_to_csv(
            self, request, queryset,
            filename='revenue.csv',
            fields=['id', 'receipt_number', 'tenant_id', 'amount', 'date', 'payment_method', 'description', 'is_verified'],
        )

    def changelist_view(self, request, extra_context=None):
        """Append total revenue to the changelist footer."""
        response = super().changelist_view(request, extra_context)
        try:
            qs = response.context_data['cl'].queryset
            total = qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            response.context_data['subtitle'] = f'Total (filtered): ₹{total}'
        except (AttributeError, KeyError):
            pass
        return response


# ---------------------------------------------------------------------------
# Expense Admin
# ---------------------------------------------------------------------------

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'tenant',
        'category',
        'amount_display',
        'date',
        'is_recurring',
        'description_short',
        'created_at',
    )
    list_filter = ('category', 'is_recurring', 'tenant', 'date')
    search_fields = ('description', 'tenant__name', 'recurrence_note')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'
    ordering = ('-date',)
    list_per_page = 50

    fieldsets = (
        ('Core', {
            'fields': ('tenant', 'category', 'amount', 'date', 'description'),
        }),
        ('Recurrence', {
            'fields': ('is_recurring', 'recurrence_note'),
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Amount')
    def amount_display(self, obj):
        return format_html('<strong>₹{}</strong>', obj.amount)

    @admin.display(description='Description')
    def description_short(self, obj):
        return obj.description[:60] + '…' if len(obj.description) > 60 else obj.description

    actions = ['export_expenses_csv']

    @admin.action(description='Export selected expenses to CSV')
    def export_expenses_csv(self, request, queryset):
        return _export_to_csv(
            self, request, queryset,
            filename='expenses.csv',
            fields=['id', 'tenant_id', 'category', 'amount', 'date', 'description', 'is_recurring', 'recurrence_note'],
        )

    def changelist_view(self, request, extra_context=None):
        """Append total expenses to the changelist footer."""
        response = super().changelist_view(request, extra_context)
        try:
            qs = response.context_data['cl'].queryset
            total = qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            response.context_data['subtitle'] = f'Total (filtered): ₹{total}'
        except (AttributeError, KeyError):
            pass
        return response
