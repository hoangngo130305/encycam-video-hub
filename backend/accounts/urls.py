from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')

urlpatterns = [
    path('auth/login/',         views.AuthLoginView.as_view(),  name='auth-login'),
    path('auth/logout/',        views.AuthLogoutView.as_view(), name='auth-logout'),
    path('auth/me/',            views.AuthMeView.as_view(),     name='auth-me'),
    path('auth/token/refresh/', TokenRefreshView.as_view(),     name='token-refresh'),
    path('', include(router.urls)),
]
