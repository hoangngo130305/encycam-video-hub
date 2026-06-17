from django.contrib import admin
from django.utils.html import format_html
from .models import Notification

TYPE_ICONS = {
    'info':    ('info',    'fas fa-info-circle'),
    'success': ('success', 'fas fa-check-circle'),
    'warning': ('warning', 'fas fa-exclamation-triangle'),
    'error':   ('danger',  'fas fa-times-circle'),
}


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ('type_badge', 'title', 'user', 'read_badge', 'video', 'created_at')
    list_filter   = ('type', 'read')
    search_fields = ('title', 'message', 'user__name', 'video__title')
    readonly_fields = ('created_at', 'video_title')
    raw_id_fields = ('user', 'video')
    ordering      = ('-created_at',)
    list_per_page = 30
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Thông báo', {
            'fields': ('user', 'type', 'title', 'message', 'read'),
        }),
        ('Video liên quan', {
            'fields': ('video', 'video_title'),
        }),
        ('Thời gian', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Loại', ordering='type')
    def type_badge(self, obj):
        cls, icon = TYPE_ICONS.get(obj.type, ('secondary', 'fas fa-bell'))
        return format_html(
            '<span class="badge badge-{}"><i class="{}"></i> {}</span>',
            cls, icon, obj.type.capitalize()
        )

    @admin.display(description='Đã đọc', ordering='read')
    def read_badge(self, obj):
        if obj.read:
            return format_html('<span class="badge badge-success"><i class="fas fa-check"></i> Đã đọc</span>')
        return format_html('<span class="badge badge-warning"><i class="fas fa-envelope"></i> Chưa đọc</span>')
