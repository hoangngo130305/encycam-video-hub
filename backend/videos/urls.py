from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('videos', views.VideoViewSet, basename='video')

urlpatterns = [
    path('', include(router.urls)),
    # Nested comment routes
    path('videos/<int:video_pk>/comments/', views.CommentListCreateView.as_view(), name='video-comments'),
    # Comment resolve
    path('comments/<int:pk>/resolve/', views.CommentResolveView.as_view(), name='comment-resolve'),
    # Dashboard
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]
