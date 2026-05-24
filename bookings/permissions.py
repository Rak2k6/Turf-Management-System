from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Only allows access to users with SUPER_ADMIN role.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SUPER_ADMIN'


class IsTenantOwner(permissions.BasePermission):
    """
    Check if the user is the owner of the tenant that the object belongs to.
    For list/create: user must be authenticated and have TURF_ADMIN or SUPER_ADMIN role.
    For object-level: user must own the tenant the object belongs to.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['TURF_ADMIN', 'SUPER_ADMIN']

    def has_object_permission(self, request, view, obj):
        # Super admin can do anything
        if request.user.role == 'SUPER_ADMIN':
            return True
        
        # Check ownership based on the object type
        if hasattr(obj, 'owner'):  # For Tenant itself
            return obj.owner == request.user
        
        if hasattr(obj, 'tenant'):  # For Court or Slot
            return obj.tenant.owner == request.user
            
        if hasattr(obj, 'court'):  # For Booking
            return obj.court.tenant.owner == request.user
            
        return False


class IsBookingOwner(permissions.BasePermission):
    """
    Allow users to see and manage their own bookings.
    Turf admins and super admins can manage bookings for their courts.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['TURF_ADMIN', 'SUPER_ADMIN']:
            if request.user.role == 'SUPER_ADMIN':
                return True
            # Turf admin can manage bookings for their own courts
            return obj.court.tenant.owner == request.user
        return obj.customer == request.user


class IsStaffOrOwner(permissions.BasePermission):
    """
    Staff, Turf Admin, or Super Admin access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['STAFF', 'TURF_ADMIN', 'SUPER_ADMIN']


class IsAuthenticatedTenantMember(permissions.BasePermission):
    """
    Ensures user is authenticated. For read-only access to tenant-scoped data.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
