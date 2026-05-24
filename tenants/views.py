from rest_framework import viewsets, permissions, exceptions
from rest_framework.response import Response
from .models import Tenant
from .serializers import TenantSerializer, TenantBrandingSerializer
from bookings.permissions import IsSuperAdmin


class IsTenantOwnerPermission(permissions.BasePermission):
    """Object-level permission — owner or super admin only."""
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or request.user.role == 'SUPER_ADMIN'


class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            # Only super admin can create/delete tenants directly
            return [IsSuperAdmin()]
        elif self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsTenantOwnerPermission()]
        elif self.action == 'list':
            # Only super admin can list all tenants; turf admins use /api/my-tenant/
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return Tenant.objects.all()
        # Turf admins can only see their own tenant
        if user.role == 'TURF_ADMIN' and hasattr(user, 'owned_tenant'):
            try:
                return Tenant.objects.filter(id=user.owned_tenant.id)
            except Exception:
                pass
        # Customers / staff — no tenant listing
        return Tenant.objects.none()

    def perform_create(self, serializer):
        serializer.save()


class MeTenantView(viewsets.GenericViewSet):
    """
    Returns the tenant owned by the authenticated user.
    GET /api/my-tenant/
    """
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        if not hasattr(request.user, 'owned_tenant'):
            raise exceptions.NotFound("No tenant found for this user.")
        try:
            tenant = request.user.owned_tenant
        except Tenant.DoesNotExist:
            raise exceptions.NotFound("No tenant found for this user.")
        serializer = self.get_serializer(tenant)
        return Response({"success": True, "data": serializer.data})
