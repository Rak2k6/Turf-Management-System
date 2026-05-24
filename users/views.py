from rest_framework import generics, permissions, status as http_status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UserSerializer, RegisterSerializer, MyTokenObtainPairSerializer,
    ChangePasswordSerializer, LogoutSerializer,
)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    Change password for the authenticated user.
    Requires old_password and new_password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response(
            {"success": True, "message": "Password changed successfully."},
            status=http_status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    Logout by blacklisting the refresh token.
    Accepts: { "refresh": "<token>" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except Exception:
            return Response(
                {"success": False, "message": "Token is invalid or already blacklisted."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "message": "Successfully logged out."},
            status=http_status.HTTP_200_OK,
        )
