from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_add_telegram_chat_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='extra_roles',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Vai trò bổ sung'),
        ),
    ]
