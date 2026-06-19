from django.contrib import admin
from django.urls import path, include
from videos.views import serve_media_with_range

admin.site.site_header = "Encycam Video Hub"
admin.site.site_title  = "Encycam Admin"
admin.site.index_title = "Bảng điều khiển"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('videos.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('audit.urls')),
    # Serve media with Range request support so videos can be seeked
    path('media/<path:path>', serve_media_with_range),
]
