from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers, exceptions
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .services import UserService

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    tenant_id = serializers.SerializerMethodField()
    tenant_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'tenant_id', 'tenant_name')
        read_only_fields = ('id', 'role')  # Role should not be set by user during basic registration

    def get_tenant_id(self, obj):
        if hasattr(obj, 'owned_tenant'):
            try:
                return obj.owned_tenant.id
            except Exception:
                pass
        return None

    def get_tenant_name(self, obj):
        if hasattr(obj, 'owned_tenant'):
            try:
                return obj.owned_tenant.name
            except Exception:
                pass
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='CUSTOMER')
    business_name = serializers.CharField(max_length=100, required=False, write_only=True,
                                          help_text="Required for TURF_ADMIN registration")

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'role', 'phone_number', 'business_name')
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate_password(self, value):
        # Filter raw self.initial_data to only include valid fields on the User model
        user_data = {
            k: v for k, v in self.initial_data.items()
            if k in ['username', 'email', 'role', 'phone_number']
        }
        validate_password(value, user=User(**user_data))
        return value

    def validate_role(self, value):
        """
        Only Super Admins or Turf Admins can create non-CUSTOMER roles.
        """
        request = self.context.get('request')
        
        # If public registration (not authenticated)
        if not request or not request.user or not request.user.is_authenticated:
            if value not in ('CUSTOMER', 'TURF_ADMIN'):
                raise serializers.ValidationError("Only admins can create non-customer accounts.")
            return value

        # If authenticated, check if the user is an admin
        if value in ['TURF_ADMIN', 'STAFF', 'SUPER_ADMIN']:
            if request.user.role not in ['SUPER_ADMIN', 'TURF_ADMIN']:
                raise serializers.ValidationError(f"You do not have permission to create a user with role: {value}")
        
        return value

    def validate(self, data):
        # If registering as TURF_ADMIN, business_name is required
        if data.get('role') == 'TURF_ADMIN' and not data.get('business_name'):
            raise serializers.ValidationError({
                'business_name': 'Business name is required for turf owner registration.'
            })
        return data

    def create(self, validated_data):
        business_name = validated_data.pop('business_name', None)
        user = UserService.create_user(business_name=business_name, **validated_data)
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        authenticate_kwargs = {
            self.username_field: attrs.get(self.username_field),
            'password': attrs.get('password'),
            'request': self.context.get('request'),
        }
        self.user = authenticate(**authenticate_kwargs)

        if self.user is None:
            raise exceptions.AuthenticationFailed(
                self.error_messages['no_active_account'],
                'no_active_account',
            )

        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['role'] = user.role
        token['username'] = user.username
        return token


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context['request'].user)
        return value


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)

    def validate_refresh(self, value):
        try:
            RefreshToken(value)
        except Exception:
            raise serializers.ValidationError("Invalid or expired refresh token.")
        return value
