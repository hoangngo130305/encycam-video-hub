from django.db import models


class AuditEntry(models.Model):
    RESOURCE_TYPE_CHOICES = [
        ('video',  'Video'),
        ('user',   'User'),
        ('system', 'System'),
    ]

    timestamp     = models.DateTimeField('Thời điểm', auto_now_add=True)
    user          = models.ForeignKey(
        'accounts.User', verbose_name='Người thực hiện',
        related_name='audit_entries', on_delete=models.CASCADE,
    )
    action        = models.TextField('Hành động')
    resource_type = models.CharField('Loại tài nguyên', max_length=20, choices=RESOURCE_TYPE_CHOICES)
    resource_id   = models.PositiveIntegerField('ID tài nguyên', null=True, blank=True)
    details       = models.TextField('Chi tiết', blank=True)

    class Meta:
        db_table = 'audit_log'
        ordering = ['-timestamp']
        verbose_name = 'Audit log'
        verbose_name_plural = 'Audit log'

    def __str__(self):
        return f'{self.user.name}: {self.action[:60]}'
