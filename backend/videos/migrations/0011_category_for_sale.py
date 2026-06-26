from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0010_add_sale_project'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='for_sale',
            field=models.BooleanField(default=False, verbose_name='Dùng cho Sale flow'),
        ),
    ]
