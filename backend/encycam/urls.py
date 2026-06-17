from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "Encycam Video Hub"
admin.site.site_title  = "Encycam Admin"
admin.site.index_title = "Bảng điều khiển"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('videos.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('audit.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
