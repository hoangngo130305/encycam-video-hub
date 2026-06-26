import random
from django.db import models


class Category(models.Model):
    name                 = models.CharField('Tên danh mục', max_length=100, unique=True)
    youtube_playlist_id  = models.CharField('YouTube Playlist ID', max_length=60, blank=True)
    youtube_category_id  = models.CharField('YouTube Category ID', max_length=5, default='22')
    for_sale             = models.BooleanField('Dùng cho Sale flow', default=False)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        ordering = ['name']
        verbose_name = 'Danh mục'
        verbose_name_plural = 'Danh mục'

    def __str__(self):
        return self.name


class SaleProject(models.Model):
    name         = models.CharField('Tên project', max_length=200)
    category     = models.ForeignKey(
        Category, verbose_name='Danh mục',
        related_name='sale_projects', on_delete=models.CASCADE,
    )
    sale         = models.ForeignKey(
        'accounts.User', verbose_name='Sale được gán',
        related_name='sale_projects', null=True, blank=True,
        on_delete=models.SET_NULL,
    )
    sale_manager = models.ForeignKey(
        'accounts.User', verbose_name='Sale Manager',
        related_name='managed_projects', on_delete=models.CASCADE,
    )
    created_at   = models.DateTimeField('Ngày tạo', auto_now_add=True)

    class Meta:
        db_table = 'sale_projects'
        ordering = ['-created_at']
        verbose_name = 'Sale Project'
        verbose_name_plural = 'Sale Projects'

    def __str__(self):
        return f'{self.name} — {self.sale.name if self.sale else "Chưa gán"}'


THUMB_GRADIENTS = [
    'from-blue-500 to-purple-600',
    'from-slate-600 to-slate-800',
    'from-amber-500 to-orange-600',
    'from-green-400 to-teal-500',
    'from-rose-400 to-pink-600',
    'from-indigo-600 to-violet-700',
    'from-red-400 to-rose-600',
    'from-blue-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-400 to-green-600',
]


def random_gradient():
    return random.choice(THUMB_GRADIENTS)


class Video(models.Model):
    STATUS_CHOICES = [
        ('pending',        'Chờ review'),
        ('reviewing',      'Đang review'),
        ('reviewed',       'Đã review'),
        ('approved',       'Đã duyệt'),
        ('rejected',       'Từ chối'),
        ('needs_revision', 'Cần sửa lại'),
    ]

    title           = models.CharField('Tên video', max_length=500)
    file_id         = models.CharField('File ID', max_length=50, unique=True, blank=True)
    status          = models.CharField('Trạng thái', max_length=30, choices=STATUS_CHOICES, default='pending')
    current_version = models.PositiveIntegerField('Phiên bản hiện tại', default=1)
    btv             = models.ForeignKey(
        'accounts.User', verbose_name='BTV',
        related_name='uploaded_videos', on_delete=models.CASCADE,
    )
    reviewer        = models.ForeignKey(
        'accounts.User', verbose_name='Reviewer',
        related_name='reviewing_videos', null=True, blank=True, on_delete=models.SET_NULL,
    )
    uploaded_at     = models.DateTimeField('Ngày tải lên', auto_now_add=True)
    updated_at      = models.DateTimeField('Cập nhật lần cuối', auto_now=True)
    notes               = models.TextField('Ghi chú', blank=True)
    thumb_gradient      = models.CharField('Gradient thumbnail', max_length=100, default=random_gradient)
    category            = models.CharField('Danh mục', max_length=100, blank=True, default='')
    youtube_video_id    = models.CharField('YouTube Video ID', max_length=20, blank=True)
    youtube_url         = models.URLField('YouTube URL', blank=True)
    youtube_upload_status = models.CharField(
        'Trạng thái upload YouTube',
        max_length=20,
        choices=[('idle', 'Chờ'), ('uploading', 'Đang upload'), ('done', 'Hoàn thành'), ('failed', 'Lỗi')],
        default='idle',
    )
    youtube_upload_progress = models.PositiveSmallIntegerField('Tiến độ upload YouTube (%)', default=0)
    sale_project = models.ForeignKey(
        'SaleProject', verbose_name='Sale Project',
        null=True, blank=True, on_delete=models.SET_NULL,
        related_name='videos',
    )

    class Meta:
        db_table = 'videos'
        ordering = ['-uploaded_at']
        verbose_name = 'Video'
        verbose_name_plural = 'Videos'

    def __str__(self):
        return f'[{self.file_id}] {self.title}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # After first save we have a PK — generate file_id if missing
        if not self.file_id:
            self.file_id = f'VideoID_{self.pk + 2000}'
            type(self).objects.filter(pk=self.pk).update(file_id=self.file_id)


class VideoVersion(models.Model):
    video       = models.ForeignKey(Video, verbose_name='Video', related_name='versions', on_delete=models.CASCADE)
    number      = models.PositiveIntegerField('Số phiên bản')
    uploaded_at = models.DateTimeField('Ngày tải lên', auto_now_add=True)
    uploaded_by = models.ForeignKey(
        'accounts.User', verbose_name='Người tải lên',
        related_name='uploaded_versions', on_delete=models.CASCADE,
    )
    file        = models.FileField('File video', upload_to='videos/', null=True, blank=True)
    file_size   = models.CharField('Kích thước file', max_length=50, blank=True, default='—')
    duration    = models.CharField('Thời lượng', max_length=20, blank=True, default='—')

    class Meta:
        db_table = 'video_versions'
        ordering = ['number']
        unique_together = ['video', 'number']
        verbose_name = 'Phiên bản video'
        verbose_name_plural = 'Phiên bản video'

    def __str__(self):
        return f'{self.video.title} — v{self.number}'


class Comment(models.Model):
    video      = models.ForeignKey(Video, verbose_name='Video', related_name='video_comments', on_delete=models.CASCADE)
    user       = models.ForeignKey('accounts.User', verbose_name='Người dùng', related_name='comments', on_delete=models.CASCADE)
    text       = models.TextField('Nội dung')
    # Stores mm:ss video timestamp, e.g. "04:32" — blank if no timestamp
    timestamp  = models.CharField('Timestamp (mm:ss)', max_length=10, blank=True, null=True, default=None)
    resolved   = models.BooleanField('Đã xử lý', default=False)
    created_at = models.DateTimeField('Ngày tạo', auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'Comment #{self.pk} — {self.user.name} trên {self.video.title}'


class HistoryEntry(models.Model):
    video       = models.ForeignKey(Video, verbose_name='Video', related_name='history', on_delete=models.CASCADE)
    timestamp   = models.DateTimeField('Thời điểm', auto_now_add=True)
    user        = models.ForeignKey('accounts.User', verbose_name='Người thực hiện', related_name='history_entries', on_delete=models.CASCADE)
    action      = models.TextField('Hành động')
    from_status = models.CharField('Trạng thái trước', max_length=30, blank=True, null=True)
    to_status   = models.CharField('Trạng thái sau', max_length=30, blank=True, null=True)

    class Meta:
        db_table = 'history_entries'
        ordering = ['timestamp']
        verbose_name = 'Lịch sử duyệt'
        verbose_name_plural = 'Lịch sử duyệt'

    def __str__(self):
        return f'{self.user.name}: {self.action[:60]}'
