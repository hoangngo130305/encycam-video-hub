from django.contrib import admin
from django.utils.html import format_html
from .models import AuditEntry

RESOURCE_ICONS = {
    'user':    'fas fa-user',
    'video':   'fas fa-video',
    'comment': 'fas fa-comment',
    'version': 'fas fa-code-branch',
}


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
    list_display  = ('timestamp', 'user', 'action_short', 'resource_badge', 'resource_id')
    list_filter   = ('resource_type',)
    search_fields = ('action', 'user__name', 'user__email', 'details')
    readonly_fields = ('timestamp', 'user', 'action', 'resource_type', 'resource_id', 'details')
    ordering      = ('-timestamp',)
    date_hierarchy = 'timestamp'
    list_per_page = 30
    show_full_result_count = True

    fieldsets = (
        ('Hành động', {
            'fields': ('user', 'action', 'details'),
        }),
        ('Tài nguyên', {
            'fields': ('resource_type', 'resource_id'),
        }),
        ('Thời gian', {
            'fields': ('timestamp',),
        }),
    )

    @admin.display(description='Hành động')
    def action_short(self, obj):
        text = obj.action[:80] + ('…' if len(obj.action) > 80 else '')
        return text

    @admin.display(description='Loại tài nguyên', ordering='resource_type')
    def resource_badge(self, obj):
        icon = RESOURCE_ICONS.get(obj.resource_type, 'fas fa-cube')
        return format_html(
            '<span class="badge badge-info"><i class="{}"></i> {}</span>',
            icon, obj.resource_type or '—'
        )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
