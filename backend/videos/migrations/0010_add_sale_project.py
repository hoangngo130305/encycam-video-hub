from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0009_alter_category_id'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SaleProject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Tên project')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')),
                ('category', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sale_projects',
                    to='videos.category',
                    verbose_name='Danh mục',
                )),
                ('sale', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='sale_projects',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Sale được gán',
                )),
                ('sale_manager', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='managed_projects',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Sale Manager',
                )),
            ],
            options={
                'verbose_name': 'Sale Project',
                'verbose_name_plural': 'Sale Projects',
                'db_table': 'sale_projects',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddField(
            model_name='video',
            name='sale_project',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='videos',
                to='videos.saleproject',
                verbose_name='Sale Project',
            ),
        ),
    ]
