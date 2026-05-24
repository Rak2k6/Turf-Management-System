from rest_framework.response import Response
from rest_framework import status as http_status


class StandardResponseMixin:
    """
    Mixin that wraps all ViewSet responses in a standard envelope:

        {
            "success": true/false,
            "message": "...",
            "data": { ... } or [ ... ],
            "errors": null or { ... }
        }

    Apply to any ViewSet alongside viewsets.ModelViewSet:
        class MyViewSet(StandardResponseMixin, viewsets.ModelViewSet):
            ...
    """

    # ── Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _success_response(data=None, message="Success", status_code=http_status.HTTP_200_OK):
        return Response(
            {
                "success": True,
                "message": message,
                "data": data,
                "errors": None,
            },
            status=status_code,
        )

    @staticmethod
    def _error_response(errors=None, message="An error occurred.", status_code=http_status.HTTP_400_BAD_REQUEST):
        return Response(
            {
                "success": False,
                "message": message,
                "data": None,
                "errors": errors,
            },
            status=status_code,
        )

    # ── Override default CRUD responses ────────────────────────────────

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return self._success_response(
            data=response.data,
            message="Resource created successfully.",
            status_code=http_status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return self._success_response(
            data=response.data,
            message="Resource updated successfully.",
        )

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        return self._success_response(
            data=response.data,
            message="Resource updated successfully.",
        )

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return self._success_response(
            message="Resource deleted successfully.",
            status_code=http_status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return self._success_response(data=response.data)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return self._success_response(data=response.data)
