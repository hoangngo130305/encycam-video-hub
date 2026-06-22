from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0007_category_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='youtube_upload_status',
            field=models.CharField(
                choices=[('idle', 'Chờ'), ('uploading', 'Đang upload'), ('done', 'Hoàn thành'), ('failed', 'Lỗi')],
                default='idle',
                max_length=20,
                verbose_name='Trạng thái upload YouTube',
            ),
        ),
        migrations.AddField(
            model_name='video',
            name='youtube_upload_progress',
            field=models.PositiveSmallIntegerField(default=0, verbose_name='Tiến độ upload YouTube (%)'),
        ),
    ]
