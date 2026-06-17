from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('comment', 'Comment'),
        ('approve', 'Approve'),
        ('reject',  'Reject'),
        ('upload',  'Upload'),
        ('mention', 'Mention'),
        ('timeout', 'Timeout'),
        ('system',  'System'),
    ]

    user       = models.ForeignKey(
        'accounts.User', verbose_name='Người nhận',
        related_name='notifications', on_delete=models.CASCADE,
    )
    type       = models.CharField('Loại thông báo', max_length=20, choices=TYPE_CHOICES)
    title      = models.CharField('Tiêu đề', max_length=255)
    message    = models.TextField('Nội dung')
    read       = models.BooleanField('Đã đọc', default=False)
    created_at = models.DateTimeField('Ngày tạo', auto_now_add=True)
    video      = models.ForeignKey(
        'videos.Video', verbose_name='Video liên quan',
        null=True, blank=True, on_delete=models.SET_NULL,
        related_name='notifications',
    )
    # Cache video title in case video gets deleted later
    video_title = models.CharField('Tên video (cached)', max_length=500, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        verbose_name = 'Thông báo'
        verbose_name_plural = 'Thông báo'

    def __str__(self):
        return f'[{self.type}] {self.title} → {self.user.name}'

    def save(self, *args, **kwargs):
        if self.video and not self.video_title:
            self.video_title = self.video.title
        super().save(*args, **kwargs)
