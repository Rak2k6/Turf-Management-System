from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class UserService:
    @staticmethod
    @transaction.atomic
    def create_user(username, password, email, role='CUSTOMER', phone_number=None, business_name=None):
        """
        Creates a new user with the specified role and securely hashes the password.
        Default role is CUSTOMER for public registrations.
        If role is TURF_ADMIN, also auto-creates a Tenant for them.
        """
        user = User(
            username=username,
            email=email,
            role=role,
            phone_number=phone_number
        )
        user.set_password(password)
        user.save()

        # Auto-create Tenant for TURF_ADMIN registrations
        if role == 'TURF_ADMIN':
            from tenants.models import Tenant
            tenant_name = business_name or f"{username}'s Turf"
            # Generate a URL-safe subdomain from the business name
            subdomain = tenant_name.lower().replace(' ', '-').replace("'", '')
            # Ensure subdomain uniqueness
            base_subdomain = subdomain
            counter = 1
            while Tenant.objects.filter(subdomain=subdomain).exists():
                subdomain = f"{base_subdomain}-{counter}"
                counter += 1

            Tenant.objects.create(
                name=tenant_name,
                subdomain=subdomain,
                owner=user,
            )

        return user
