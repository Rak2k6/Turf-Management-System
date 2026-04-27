from django.db import models
from django.conf import settings
from django.utils import timezone
from tenants.models import Tenant

class Court(models.Model):
    SPORT_CHOICES = (
        ('CRICKET', 'Cricket'),
        ('FOOTBALL', 'Football'),
        ('BADMINTON', 'Badminton'),
        ('TENNIS', 'Tennis'),
        ('BASKETBALL', 'Basketball'),
        ('VOLLEYBALL', 'Volleyball'),
        ('SQUASH', 'Squash'),
        ('OTHER', 'Other'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('MAINTENANCE', 'Maintenance'),
        ('INACTIVE', 'Inactive'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='courts')
    name = models.CharField(max_length=100)
    sport_type = models.CharField(max_length=20, choices=SPORT_CHOICES)
    size = models.CharField(max_length=50, blank=True, help_text="e.g., 100x60 ft")
    base_price_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    peak_hour_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Price during peak hours")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Simple Scheduling for MVP
    opening_time = models.TimeField(default="06:00")
    closing_time = models.TimeField(default="23:00")
    operating_hours = models.JSONField(default=list, blank=True, help_text="List of timing shifts: [{'start': '06:00', 'end': '10:00'}, ...]")
    slot_duration_mins = models.IntegerField(default=60)
    
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='courts/', blank=True, null=True, help_text="Court photo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Enforce unique court names per tenant at the database level
        unique_together = [('tenant', 'name')]

    def __str__(self):
        return f"{self.name} - {self.tenant.name}"


class Slot(models.Model):
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='slots')
    start_time = models.TimeField()
    end_time = models.TimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.court.name}: {self.start_time} - {self.end_time}"

class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('SUBMITTED', 'Submitted'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('ONLINE', 'Online'),
    )

    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='bookings')
    slot = models.ForeignKey(Slot, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    
    # For walk-in customers without an account
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=15, blank=True)

    # Date of booking
    date = models.DateField(default=timezone.now)
    
    # Exact start/end if slots are not used, or derived from slot
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['slot', 'date'], 
                condition=~models.Q(status='CANCELLED'),
                name='unique_booking_slot_date'
            )
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.court.name} on {self.date}"
