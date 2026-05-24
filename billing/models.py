"""
billing/models.py

Production-grade models for the Billing module.
Covers:
  - Customer   : walk-in and recurring customers managed per-tenant
  - Revenue    : income entries, optionally linked to a booking or a billing customer
  - Expense    : operational cost entries per tenant
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from tenants.models import Tenant


# ---------------------------------------------------------------------------
# Managers
# ---------------------------------------------------------------------------

class TenantScopedManager(models.Manager):
    """
    Convenience manager that can be used to filter by tenant at query time.
    Usage: Model.objects.for_tenant(tenant)
    """

    def for_tenant(self, tenant):
        return self.get_queryset().filter(tenant=tenant)


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class Customer(models.Model):
    """
    Customer records managed by the turf owner.
    Tracks walk-in and recurring customers per-tenant.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='customers',
        verbose_name=_('Tenant'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_profile',
        help_text=_('Link to a registered user account, if any'),
        verbose_name=_('Linked User'),
    )
    name = models.CharField(_('Name'), max_length=100)
    phone = models.CharField(_('Phone'), max_length=15, blank=True)
    email = models.EmailField(_('Email'), blank=True)
    notes = models.TextField(_('Notes'), blank=True)
    is_active = models.BooleanField(
        _('Active'),
        default=True,
        help_text=_('Uncheck to deactivate a customer without deleting records.'),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantScopedManager()

    class Meta:
        unique_together = [('tenant', 'phone')]
        ordering = ['-created_at']
        verbose_name = _('Customer')
        verbose_name_plural = _('Customers')
        indexes = [
            models.Index(fields=['tenant', 'is_active'], name='bill_cust_tenant_active_idx'),
            models.Index(fields=['tenant', 'name'], name='bill_cust_tenant_name_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone or self.email or 'no contact'})"

    def clean(self):
        """At least one contact method must be provided."""
        if not self.phone and not self.email:
            raise ValidationError(
                _('A customer must have at least a phone number or an email address.')
            )


# ---------------------------------------------------------------------------
# Revenue
# ---------------------------------------------------------------------------

def _generate_receipt_number():
    """Generate a short unique receipt reference."""
    return f"RCV-{uuid.uuid4().hex[:8].upper()}"


class Revenue(models.Model):
    """
    Revenue entries for a tenant.
    Optionally linked to a Booking (automated) or a billing Customer (manual).
    """

    PAYMENT_METHOD_CHOICES = (
        ('CASH', _('Cash')),
        ('CARD', _('Card')),
        ('UPI', _('UPI')),
        ('ONLINE', _('Online')),
        ('OTHER', _('Other')),
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='revenues',
        verbose_name=_('Tenant'),
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revenue_entries',
        verbose_name=_('Booking'),
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revenue_entries',
        verbose_name=_('Customer'),
        help_text=_('Billing customer associated with this revenue entry.'),
    )
    receipt_number = models.CharField(
        _('Receipt Number'),
        max_length=20,
        unique=True,
        default=_generate_receipt_number,
        editable=False,
        help_text=_('Auto-generated unique receipt reference.'),
    )
    amount = models.DecimalField(_('Amount (₹)'), max_digits=10, decimal_places=2)
    date = models.DateField(_('Date'))
    description = models.CharField(_('Description'), max_length=255, blank=True)
    payment_method = models.CharField(
        _('Payment Method'),
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='CASH',
    )
    is_verified = models.BooleanField(
        _('Verified'),
        default=False,
        help_text=_('Mark this revenue entry as verified/reconciled.'),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantScopedManager()

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = _('Revenue')
        verbose_name_plural = _('Revenues')
        indexes = [
            models.Index(fields=['tenant', 'date'], name='bill_revenue_tenant_date_idx'),
            models.Index(fields=['tenant', 'payment_method'], name='billing_revenue_pm_idx'),
        ]

    def __str__(self):
        return f"₹{self.amount} — {self.date} [{self.receipt_number}] ({self.tenant.name})"

    def clean(self):
        if self.amount is not None and self.amount <= Decimal('0'):
            raise ValidationError({'amount': _('Revenue amount must be greater than zero.')})


# ---------------------------------------------------------------------------
# Expense
# ---------------------------------------------------------------------------

class Expense(models.Model):
    """
    Operational expense entries for a tenant.
    Supports categorisation, recurrence notes, and soft audit fields.
    """

    CATEGORY_CHOICES = (
        ('MAINTENANCE', _('Maintenance')),
        ('UTILITIES', _('Utilities')),
        ('SALARIES', _('Salaries')),
        ('EQUIPMENT', _('Equipment')),
        ('RENT', _('Rent')),
        ('MARKETING', _('Marketing')),
        ('INSURANCE', _('Insurance')),
        ('TAXES', _('Taxes')),
        ('OTHER', _('Other')),
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='expenses',
        verbose_name=_('Tenant'),
    )
    category = models.CharField(
        _('Category'),
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='OTHER',
    )
    amount = models.DecimalField(_('Amount (₹)'), max_digits=10, decimal_places=2)
    date = models.DateField(_('Date'))
    description = models.CharField(_('Description'), max_length=255, blank=True)
    is_recurring = models.BooleanField(
        _('Recurring'),
        default=False,
        help_text=_('Is this a recurring/monthly expense?'),
    )
    recurrence_note = models.CharField(
        _('Recurrence Note'),
        max_length=100,
        blank=True,
        help_text=_('E.g., "Monthly rent", "Weekly electricity bill".'),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantScopedManager()

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = _('Expense')
        verbose_name_plural = _('Expenses')
        indexes = [
            models.Index(fields=['tenant', 'date'], name='bill_expense_tenant_date_idx'),
            models.Index(fields=['tenant', 'category'], name='bill_expense_category_idx'),
        ]

    def __str__(self):
        return f"₹{self.amount} — {self.get_category_display()} on {self.date} ({self.tenant.name})"

    def clean(self):
        if self.amount is not None and self.amount <= Decimal('0'):
            raise ValidationError({'amount': _('Expense amount must be greater than zero.')})
        if self.is_recurring and not self.recurrence_note:
            raise ValidationError(
                {'recurrence_note': _('Please describe the recurrence pattern.')}
            )
