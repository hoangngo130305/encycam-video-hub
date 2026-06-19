import csv
from typing import Optional
from django.db.models import Q
from django.http import HttpResponse
from ninja import Router
from accounts.models import User
from audit.models import AuditEntry
from audit.schemas import AuditEntryOut

router = Router(tags=["audit"])


def _check_admin(user: User) -> None:
    if user.role != 'admin':
        from ninja.errors import HttpError
        raise HttpError(403, "Chỉ Admin mới có quyền này.")


@router.get("/audit/", response=list[AuditEntryOut])
def list_audit(
    request,
    search: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
):
    _check_admin(request.auth)
    qs = AuditEntry.objects.select_related('user').order_by('-timestamp')

    if search:
        qs = qs.filter(
            Q(action__icontains=search) |
            Q(user__name__icontains=search) |
            Q(details__icontains=search)
        )
    if resource_type:
        qs = qs.filter(resource_type=resource_type)
    if resource_id and resource_id.isdigit():
        qs = qs.filter(resource_id=int(resource_id))

    result = []
    for e in qs[:200]:
        result.append(AuditEntryOut.model_validate(e).model_dump())
    return result


@router.get("/audit/export/")
def export_audit(request, search: Optional[str] = None):
    _check_admin(request.auth)
    qs = AuditEntry.objects.select_related('user').order_by('-timestamp')
    if search and search.strip():
        qs = qs.filter(
            Q(action__icontains=search) | Q(user__name__icontains=search)
        )

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="audit_log.csv"'
    response.write('﻿')  # UTF-8 BOM for Excel

    writer = csv.writer(response)
    writer.writerow(['ID', 'Thời điểm', 'Người thực hiện', 'Email', 'Hành động', 'Loại', 'Resource ID', 'Chi tiết'])
    for e in qs:
        writer.writerow([
            e.id,
            e.timestamp.strftime('%d/%m/%Y %H:%M'),
            e.user.name,
            e.user.email,
            e.action,
            e.resource_type,
            e.resource_id or '',
            e.details,
        ])
    return response
