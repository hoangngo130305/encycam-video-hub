from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.utils.html import format_html
from .models import User


class UserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Mật khẩu', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Xác nhận mật khẩu', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('name', 'email', 'role')

    def clean_password2(self):
        p1 = self.cleaned_data.get('password1')
        p2 = self.cleaned_data.get('password2')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError('Hai mật khẩu không khớp.')
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField(
        label='Mật khẩu',
        help_text='Mật khẩu không được lưu dưới dạng plain text. '
                  '<a href="../password/">Đổi mật khẩu tại đây</a>.',
    )

    class Meta:
        model = User
        fields = ('name', 'email', 'role', 'password', 'avatar_bg', 'avatar_color',
                  'locked', 'is_active', 'is_staff', 'is_superuser')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form     = UserChangeForm
    add_form = UserCreationForm

    list_display   = ('avatar_badge', 'name', 'email', 'role_badge', 'status_badge', 'is_staff', 'created_at')
    list_filter    = ('role', 'locked', 'is_active', 'is_staff')
    search_fields  = ('name', 'email')
    ordering       = ('created_at',)
    readonly_fields = ('created_at', 'initials', 'avatar_bg', 'avatar_color', 'last_login')
    filter_horizontal = ()
    list_per_page  = 25
    show_full_result_count = True
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Thông tin tài khoản', {
            'fields': ('name', 'email', 'password', 'role'),
        }),
        ('Avatar (tự động sinh)', {
            'fields': ('initials', 'avatar_bg', 'avatar_color'),
            'classes': ('collapse',),
        }),
        ('Trạng thái', {
            'fields': ('locked', 'is_active', 'is_staff', 'is_superuser'),
        }),
        ('Thời gian', {
            'fields': ('created_at', 'last_login'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        ('Tạo tài khoản mới', {
            'classes': ('wide',),
            'fields': ('name', 'email', 'role', 'password1', 'password2'),
        }),
    )

    @admin.display(description='Avatar')
    def avatar_badge(self, obj):
        return format_html(
            '<span style="display:inline-flex;align-items:center;justify-content:center;'
            'width:32px;height:32px;border-radius:50%;background:{};color:{};'
            'font-weight:bold;font-size:12px;">{}</span>',
            obj.avatar_bg, obj.avatar_color, obj.initials or '?'
        )

    @admin.display(description='Vai trò')
    def role_badge(self, obj):
        colors = {
            'admin':    ('warning', 'Admin'),
            'btv':      ('primary', 'BTV'),
            'reviewer': ('success', 'Reviewer'),
            'final':    ('danger',  'Duyệt cuối'),
        }
        cls, label = colors.get(obj.role, ('secondary', obj.role))
        return format_html('<span class="badge badge-{}">{}</span>', cls, label)

    @admin.display(description='Trạng thái')
    def status_badge(self, obj):
        if obj.locked:
            return format_html('<span class="badge badge-danger">Bị khoá</span>')
        if obj.is_active:
            return format_html('<span class="badge badge-success">Hoạt động</span>')
        return format_html('<span class="badge badge-secondary">Vô hiệu</span>')
