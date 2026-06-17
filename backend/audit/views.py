import csv
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from accounts.permissions import IsAdmin
from .models import AuditEntry
from .serializers import AuditEntrySerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit/
    Admin only. Supports search + resource_type filter + pagination.
    """
    permission_classes = [IsAdmin]
    serializer_class = AuditEntrySerializer

    def get_queryset(self):
        qs = AuditEntry.objects.select_related('user').order_by('-timestamp')

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(action__icontains=search) |
                Q(user__name__icontains=search) |
                Q(details__icontains=search)
            )

        resource_type = self.request.query_params.get('resourceType', '').strip()
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        resource_id = self.request.query_params.get('resourceId', '').strip()
        if resource_id.isdigit():
            qs = qs.filter(resource_id=int(resource_id))

        return qs


class AuditLogExportView(APIView):
    """
    GET /api/audit/export/
    Admin only. Exports audit log as CSV.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = AuditEntry.objects.select_related('user').order_by('-timestamp')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(action__icontains=search) |
                Q(user__name__icontains=search)
            )

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="audit_log.csv"'
        response.write('﻿')  # UTF-8 BOM for Excel

        writer = csv.writer(response)
        writer.writerow(['ID', 'Thời điểm', 'Người thực hiện', 'Email', 'Hành động', 'Loại', 'Resource ID', 'Chi tiết'])

        for entry in qs:
            writer.writerow([
                entry.id,
                entry.timestamp.strftime('%d/%m/%Y %H:%M'),
                entry.user.name,
                entry.user.email,
                entry.action,
                entry.resource_type,
                entry.resource_id or '',
                entry.details,
            ])

        return response
