from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from users.views import RegisterView, MyTokenObtainPairView, UserProfileView, LogoutView, ChangePasswordView
from tenants.views import TenantViewSet, MeTenantView
from bookings.views import CourtViewSet, BookingViewSet, SlotAvailabilityView, SlotViewSet, DashboardAnalyticsView
from billing.views import CustomerViewSet, RevenueViewSet, ExpenseViewSet, BillingDashboardView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

router = routers.DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')

# Nested Router for Tenants
tenants_router = routers.NestedSimpleRouter(router, r'tenants', lookup='tenant')
tenants_router.register(r'courts', CourtViewSet, basename='tenant-courts')
tenants_router.register(r'slots', SlotViewSet, basename='tenant-slots')
tenants_router.register(r'bookings', BookingViewSet, basename='tenant-bookings')

# Root routers for general access
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'courts', CourtViewSet, basename='court')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'revenues', RevenueViewSet, basename='revenue')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/auth/profile/', UserProfileView.as_view(), name='auth_profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),

    # Application
    path('api/', include(router.urls)),
    path('api/', include(tenants_router.urls)),
    path('api/my-tenant/', MeTenantView.as_view({'get': 'list'}), name='my_tenant'),
    path('api/availability/', SlotAvailabilityView.as_view(), name='slot_availability'),
    path('api/dashboard/<str:metric>/', DashboardAnalyticsView.as_view(), name='dashboard_analytics'),

    # Billing Dashboard
    path('api/billing/dashboard/', BillingDashboardView.as_view(), name='billing_dashboard'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
