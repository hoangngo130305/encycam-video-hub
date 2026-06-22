import csv
import io
from typing import Optional
from django.db.models import Q
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response

from accounts.models import User
from audit.models import AuditEntry
from audit.schemas import AuditEntryOut
from fastapi_auth import require_auth

router = APIRouter(tags=["audit"])


def _check_admin(user: User) -> None:
    if not user.has_role('admin'):
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền này.")


@router.get("/audit/", response_model=list[AuditEntryOut])
def list_audit(
    search: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    user: User = Depends(require_auth),
):
    _check_admin(user)
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
    return [AuditEntryOut.model_validate(e) for e in qs[:200]]


@router.get("/audit/export/")
def export_audit(
    search: Optional[str] = None,
    user: User = Depends(require_auth),
):
    _check_admin(user)
    qs = AuditEntry.objects.select_related('user').order_by('-timestamp')
    if search and search.strip():
        qs = qs.filter(
            Q(action__icontains=search) | Q(user__name__icontains=search)
        )

    output = io.StringIO()
    writer = csv.writer(output)
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

    content = '﻿' + output.getvalue()  # UTF-8 BOM for Excel
    return Response(
        content=content.encode('utf-8'),
        media_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': 'attachment; filename="audit_log.csv"'},
    )
