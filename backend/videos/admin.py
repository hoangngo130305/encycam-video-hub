from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import Video, VideoVersion, Comment, HistoryEntry

STATUS_COLORS = {
    'pending':       ('warning',   'Chờ review'),
    'reviewing':     ('info',      'Đang review'),
    'reviewed':      ('primary',   'Đã review'),
    'approved':      ('success',   'Đã duyệt'),
    'rejected':      ('danger',    'Từ chối'),
    'needs_revision':('warning',   'Cần sửa lại'),
}


def _format_size(size_bytes):
    if size_bytes >= 1024 ** 3:
        return f'{size_bytes / 1024 ** 3:.2f} GB'
    if size_bytes >= 1024 ** 2:
        return f'{size_bytes / 1024 ** 2:.0f} MB'
    return f'{size_bytes / 1024:.0f} KB'


# ---------------------------------------------------------------------------
# Form tuỳ chỉnh cho trang Add Video — có field upload file
# ---------------------------------------------------------------------------

class VideoAddForm(forms.ModelForm):
    # Khai báo ngoài Meta.fields vì đây là trường phi-model
    video_file = forms.FileField(
        label='File video (v1) *',
        required=True,
        help_text='Chỉ nhận file .mp4 · Tối đa 4 GB',
        widget=forms.ClearableFileInput(attrs={'accept': '.mp4'}),
    )

    class Meta:
        model = Video
        # KHÔNG đưa video_file vào đây — đây là trường phi-model, khai báo trực tiếp ở trên
        fields = ('title', 'category', 'notes', 'btv', 'thumb_gradient')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from accounts.models import User
        # Chỉ hiển thị BTV đang hoạt động trong dropdown btv
        self.fields['btv'].queryset = User.objects.filter(
            role='btv', is_active=True, locked=False
        ).order_by('name')
        self.fields['btv'].empty_label = '--- Chọn BTV phụ trách ---'

    def clean_video_file(self):
        f = self.cleaned_data.get('video_file')
        if f:
            if not f.name.lower().endswith('.mp4'):
                raise forms.ValidationError('Chỉ nhận file .mp4')
            if f.size > 4 * 1024 ** 3:
                raise forms.ValidationError('File quá lớn (tối đa 4 GB)')
        return f


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------

class VideoVersionInline(admin.TabularInline):
    model = VideoVersion
    extra = 0
    readonly_fields = ('uploaded_at', 'uploaded_by', 'file_size', 'duration')
    fields = ('number', 'uploaded_by', 'file', 'file_size', 'duration', 'uploaded_at')
    ordering = ('number',)
    show_change_link = True


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ('user', 'created_at')
    fields = ('user', 'text', 'timestamp', 'resolved', 'created_at')
    ordering = ('created_at',)
    show_change_link = True


class HistoryEntryInline(admin.TabularInline):
    model = HistoryEntry
    extra = 0
    readonly_fields = ('timestamp', 'user', 'action', 'from_status', 'to_status')
    fields = ('timestamp', 'user', 'action', 'from_status', 'to_status')
    ordering = ('timestamp',)
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# VideoAdmin
# ---------------------------------------------------------------------------

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display   = ('file_id', 'title', 'status_badge', 'current_version', 'btv', 'reviewer', 'category', 'uploaded_at', 'updated_at')
    list_filter    = ('status', 'category')
    search_fields  = ('title', 'file_id', 'btv__name', 'reviewer__name')
    readonly_fields = ('file_id', 'uploaded_at', 'updated_at')
    ordering       = ('-uploaded_at',)
    inlines        = [VideoVersionInline, HistoryEntryInline, CommentInline]
    list_per_page  = 20
    date_hierarchy = 'uploaded_at'

    # Fieldsets cho trang EDIT
    fieldsets = (
        ('Thông tin video', {
            'fields': ('title', 'file_id', 'category', 'notes', 'thumb_gradient'),
        }),
        ('Trạng thái & Phiên bản', {
            'fields': ('status', 'current_version'),
        }),
        ('Nhân sự', {
            'fields': ('btv', 'reviewer'),
        }),
        ('Thời gian', {
            'fields': ('uploaded_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    # Fieldsets cho trang ADD — thêm section upload file
    add_fieldsets = (
        ('Thông tin video', {
            'fields': ('title', 'category', 'notes', 'btv', 'thumb_gradient'),
        }),
        ('File video', {
            'description': 'Chọn file .mp4 từ máy tính để upload lên server.',
            'fields': ('video_file',),
        }),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        from accounts.models import User
        if db_field.name == 'btv':
            kwargs['queryset'] = User.objects.filter(
                role='btv', is_active=True, locked=False
            ).order_by('name')
            kwargs.setdefault('empty_label', '--- Chọn BTV ---')
        elif db_field.name == 'reviewer':
            kwargs['queryset'] = User.objects.filter(
                role__in=['reviewer', 'final'], is_active=True, locked=False
            ).order_by('name')
            kwargs.setdefault('empty_label', '--- Chọn Reviewer ---')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_form(self, request, obj=None, **kwargs):
        """Dùng VideoAddForm khi tạo mới, form mặc định khi sửa."""
        if obj is None:
            kwargs['form'] = VideoAddForm
            # Chỉ truyền model fields vào modelform_factory;
            # video_file là declared field nên vẫn xuất hiện trong form.fields
            kwargs['fields'] = ('title', 'category', 'notes', 'btv', 'thumb_gradient')
        return super().get_form(request, obj, **kwargs)

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        if not change:
            # Tạo VideoVersion v1 với file vừa upload
            uploaded_file = form.cleaned_data.get('video_file')
            if uploaded_file:
                file_size = _format_size(uploaded_file.size)
                VideoVersion.objects.create(
                    video=obj,
                    number=1,
                    uploaded_by=request.user,
                    file=uploaded_file,
                    file_size=file_size,
                )
                HistoryEntry.objects.create(
                    video=obj,
                    user=request.user,
                    action='Upload v1 (Django Admin)',
                    to_status='pending',
                )
                from audit.models import AuditEntry
                AuditEntry.objects.create(
                    user=request.user,
                    action=f'Upload mới "{obj.title}" → v1 (Django Admin)',
                    resource_type='video',
                    resource_id=obj.id,
                )

    @admin.display(description='Trạng thái', ordering='status')
    def status_badge(self, obj):
        cls, label = STATUS_COLORS.get(obj.status, ('secondary', obj.status))
        return format_html('<span class="badge badge-{}">{}</span>', cls, label)


# ---------------------------------------------------------------------------
# VideoVersionAdmin
# ---------------------------------------------------------------------------

@admin.register(VideoVersion)
class VideoVersionAdmin(admin.ModelAdmin):
    list_display   = ('video', 'number', 'uploaded_by', 'file_size_display', 'duration', 'uploaded_at')
    list_filter    = ('video__status',)
    search_fields  = ('video__title', 'uploaded_by__name')
    readonly_fields = ('uploaded_at',)
    raw_id_fields  = ('video', 'uploaded_by')
    list_per_page  = 25

    @admin.display(description='Dung lượng', ordering='file_size')
    def file_size_display(self, obj):
        return obj.file_size or '—'


# ---------------------------------------------------------------------------
# CommentAdmin
# ---------------------------------------------------------------------------

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display   = ('video', 'user', 'timestamp', 'resolved_badge', 'created_at')
    list_filter    = ('resolved',)
    search_fields  = ('video__title', 'user__name', 'text')
    readonly_fields = ('created_at',)
    raw_id_fields  = ('video', 'user')
    list_per_page  = 30

    @admin.display(description='Đã giải quyết', ordering='resolved')
    def resolved_badge(self, obj):
        if obj.resolved:
            return format_html('<span class="badge badge-success">Đã xong</span>')
        return format_html('<span class="badge badge-warning">Chờ xử lý</span>')


# ---------------------------------------------------------------------------
# HistoryEntryAdmin
# ---------------------------------------------------------------------------

@admin.register(HistoryEntry)
class HistoryEntryAdmin(admin.ModelAdmin):
    list_display   = ('video', 'user', 'action', 'status_flow', 'timestamp')
    list_filter    = ('from_status', 'to_status')
    search_fields  = ('video__title', 'user__name', 'action')
    readonly_fields = ('timestamp',)
    raw_id_fields  = ('video', 'user')
    list_per_page  = 30
    date_hierarchy = 'timestamp'

    @admin.display(description='Luồng trạng thái')
    def status_flow(self, obj):
        from_cls, from_label = STATUS_COLORS.get(obj.from_status or '', ('secondary', obj.from_status or '—'))
        to_cls, to_label     = STATUS_COLORS.get(obj.to_status or '', ('secondary', obj.to_status or '—'))
        return format_html(
            '<span class="badge badge-{}">{}</span> &rarr; <span class="badge badge-{}">{}</span>',
            from_cls, from_label, to_cls, to_label,
        )
