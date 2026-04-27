from rest_framework import serializers
from .models import Court, Booking, Slot
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

class CourtSerializer(serializers.ModelSerializer):
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    sport_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Court
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'sport_type', 'sport_type_display',
            'size', 'base_price_per_hour', 'peak_hour_price', 'status', 'status_display',
            'opening_time', 'closing_time', 'operating_hours', 'slot_duration_mins', 'is_active',
            'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ('tenant', 'created_at', 'updated_at')

    def get_sport_type_display(self, obj):
        return obj.get_sport_type_display()
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    court_name = serializers.ReadOnlyField(source='court.name')
    slot_details = SlotSerializer(source='slot', read_only=True)
    customer_username = serializers.ReadOnlyField(source='customer.username')
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('total_price', 'payment_status', 'created_at')
        # payment_method and status are writable

    def validate(self, data):
        # If slot is provided, use its times
        slot = data.get('slot')
        date = data.get('date')
        court = data.get('court')

        if slot:
            if slot.court != court:
                raise serializers.ValidationError({"court": "Slot does not belong to the selected court."})
            
            # Check overlap for this slot on this date (Exclude CANCELLED)
            overlaps = Booking.objects.filter(
                court=court,
                date=date,
                slot=slot,
            ).exclude(status='CANCELLED')
            
            if self.instance:
                overlaps = overlaps.exclude(id=self.instance.id)

            if overlaps.exists():
                raise serializers.ValidationError({"slot": "This slot is already booked for the selected date."})

        return data

    def create(self, validated_data):
        slot = validated_data.get('slot')
        date = validated_data.get('date')
        court = validated_data.get('court')
        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')

        # If start_time/end_time not provided but slot is, derive from slot
        if not start_time and slot:
            from datetime import datetime
            from django.utils import timezone
            
            start_dt = datetime.combine(date, slot.start_time)
            end_dt = datetime.combine(date, slot.end_time)
            
            # Make timezone aware if settings.USE_TZ is True
            if settings.USE_TZ:
                start_dt = timezone.make_aware(start_dt)
                end_dt = timezone.make_aware(end_dt)
                
            validated_data['start_time'] = start_dt
            validated_data['end_time'] = end_dt
        
        # Set total_price if not already set
        if 'total_price' not in validated_data or not validated_data.get('total_price'):
            if slot:
                validated_data['total_price'] = slot.price
            elif court:
                validated_data['total_price'] = court.base_price_per_hour
        
        return Booking.objects.create(**validated_data)
