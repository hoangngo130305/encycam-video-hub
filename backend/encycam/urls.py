from django.contrib import admin
from django.urls import path
from videos.views import serve_media_with_range

admin.site.site_header = "Encycam Video Hub"
admin.site.site_title  = "Encycam Admin"
admin.site.index_title = "Bảng điều khiển"

urlpatterns = [
    path('admin/', admin.site.urls),
    # Media với HTTP Range support (video seeking)
    path('media/<path:path>', serve_media_with_range),
]
