from django.db import migrations, models


def seed_categories(apps, schema_editor):
    Category = apps.get_model('videos', 'Category')
    Category.objects.bulk_create([
        Category(
            name='ENCY CAM',
            youtube_playlist_id='PLHeQY2h8X0OfJj4d2wtD-iEssTxn7KjTM',
            youtube_category_id='26',
        ),
        Category(
            name='ENCY ROBOT',
            youtube_playlist_id='PLHeQY2h8X0OemT3ppJ9YuqG-FoV_CB-Mu',
            youtube_category_id='28',
        ),
        Category(
            name='KHÁCH HÀNG TIÊU BIỂU',
            youtube_playlist_id='PLHeQY2h8X0OcstCa1KAY41dktraWIrv2w',
            youtube_category_id='22',
        ),
    ])


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0006_add_youtube_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Tên danh mục')),
                ('youtube_playlist_id', models.CharField(blank=True, max_length=60, verbose_name='YouTube Playlist ID')),
                ('youtube_category_id', models.CharField(default='22', max_length=5, verbose_name='YouTube Category ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Danh mục',
                'verbose_name_plural': 'Danh mục',
                'db_table': 'categories',
                'ordering': ['name'],
            },
        ),
        migrations.AlterField(
            model_name='video',
            name='category',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Danh mục'),
        ),
        migrations.RunPython(seed_categories, migrations.RunPython.noop),
    ]
