from django.urls import path
from . import views

urlpatterns = [
    path('audit/',         views.AuditLogListView.as_view(),   name='audit-list'),
    path('audit/export/',  views.AuditLogExportView.as_view(), name='audit-export'),
]
