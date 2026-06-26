from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


ROLE_AVATAR_COLORS = {
    'admin':        ('#f3e8ff', '#7c3aed'),
    'btv':          ('#dbeafe', '#1d4ed8'),
    'reviewer':     ('#dcfce7', '#16a34a'),
    'final':        ('#ffedd5', '#ea580c'),
    'sale_manager': ('#fef9c3', '#a16207'),
    'sale':         ('#fce7f3', '#be185d'),
}


class UserManager(BaseUserManager):
    def create_user(self, email, name, role='btv', password=None, **extra_fields):
        if not email:
            raise ValueError('Email là bắt buộc')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin',        'Admin'),
        ('btv',          'BTV'),
        ('reviewer',     'Reviewer'),
        ('final',        'Duyệt cuối'),
        ('sale_manager', 'Sale Manager'),
        ('sale',         'Sale'),
    ]

    name        = models.CharField('Họ tên', max_length=255)
    email       = models.EmailField('Email', unique=True)
    role        = models.CharField('Vai trò', max_length=20, choices=ROLE_CHOICES, default='btv')
    initials    = models.CharField('Chữ viết tắt', max_length=3, blank=True)
    avatar_bg   = models.CharField('Màu nền avatar', max_length=20, blank=True, default='#dbeafe')
    avatar_color = models.CharField('Màu chữ avatar', max_length=20, blank=True, default='#1d4ed8')
    extra_roles = models.CharField('Vai trò bổ sung', max_length=100, blank=True, default='')
    telegram_chat_id = models.CharField('Telegram Chat ID', max_length=30, blank=True)
    locked      = models.BooleanField('Bị khoá', default=False)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    created_at  = models.DateTimeField('Ngày tạo', auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'
        ordering = ['created_at']

    def has_role(self, *roles: str) -> bool:
        """Trả về True nếu user có bất kỳ role nào trong danh sách (bao gồm extra_roles)."""
        extras = {r.strip() for r in (self.extra_roles or '').split(',') if r.strip()}
        all_r = {self.role} | extras
        return bool(all_r.intersection(set(roles)))

    @property
    def all_roles(self) -> list:
        """Danh sách tất cả role (primary + extra), không trùng."""
        extras = [r.strip() for r in (self.extra_roles or '').split(',') if r.strip()]
        seen: set = set()
        result = []
        for r in [self.role] + extras:
            if r and r not in seen:
                seen.add(r)
                result.append(r)
        return result

    def __str__(self):
        return f'{self.name} <{self.email}>'

    def save(self, *args, **kwargs):
        # Auto-generate initials from name
        if not self.initials and self.name:
            words = self.name.strip().split()
            self.initials = ''.join(w[0] for w in words if w)[:2].upper()

        # Auto-set avatar colors based on role
        bg, color = ROLE_AVATAR_COLORS.get(self.role, ('#dbeafe', '#1d4ed8'))
        if not self.avatar_bg:
            self.avatar_bg = bg
        if not self.avatar_color:
            self.avatar_color = color

        # Admin role gets is_staff automatically
        if self.role == 'admin' or 'admin' in (self.extra_roles or ''):
            self.is_staff = True

        super().save(*args, **kwargs)
