from rest_framework import status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate
from django.db.models import Q

from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer
from .permissions import IsAdmin


class AuthLoginView(generics.GenericAPIView):
    """
    POST /api/auth/login/
    Body: { email, password }
    Returns: { accessToken, refreshToken, user }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email và mật khẩu là bắt buộc.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, email=email, password=password)

        if user is None:
            return Response(
                {'detail': 'Email hoặc mật khẩu không đúng.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.locked:
            return Response(
                {'detail': 'Tài khoản đã bị khoá. Vui lòng liên hệ Admin.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data,
        })


class AuthLogoutView(generics.GenericAPIView):
    """
    POST /api/auth/logout/
    Body: { refreshToken }
    Blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refreshToken')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response({'detail': 'Đã đăng xuất thành công.'})


class AuthMeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/  – current user profile
    PATCH /api/auth/me/ – update own name/email
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer


class UserViewSet(ModelViewSet):
    """
    Admin-only user management.
    GET    /api/users/            – list all users
    POST   /api/users/            – create user
    GET    /api/users/{id}/       – user detail
    PATCH  /api/users/{id}/       – update user
    DELETE /api/users/{id}/       – delete user
    POST   /api/users/{id}/toggle-lock/ – lock / unlock
    """
    permission_classes = [IsAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = User.objects.all().order_by('created_at')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))
        role = self.request.query_params.get('role', '').strip()
        if role:
            qs = qs.filter(role=role)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        from audit.models import AuditEntry
        user = serializer.save()
        AuditEntry.objects.create(
            user=self.request.user,
            action=f'Thêm user mới: {user.name} ({user.role})',
            resource_type='user',
            resource_id=user.id,
        )

    def perform_update(self, serializer):
        from audit.models import AuditEntry
        user = serializer.save()
        AuditEntry.objects.create(
            user=self.request.user,
            action=f'Cập nhật tài khoản {user.name} — role: {user.role}',
            resource_type='user',
            resource_id=user.id,
        )

    def perform_destroy(self, instance):
        from audit.models import AuditEntry
        name = instance.name
        uid = instance.id
        instance.delete()
        AuditEntry.objects.create(
            user=self.request.user,
            action=f'Xoá tài khoản {name}',
            resource_type='user',
            resource_id=uid,
        )

    @action(detail=True, methods=['post'], url_path='toggle-lock')
    def toggle_lock(self, request, pk=None):
        from audit.models import AuditEntry
        user = self.get_object()

        if user.role == 'admin':
            return Response(
                {'detail': 'Không thể khoá tài khoản Admin.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user == request.user:
            return Response(
                {'detail': 'Không thể tự khoá tài khoản của mình.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.locked = not user.locked
        user.save(update_fields=['locked'])

        action_text = 'Khoá' if user.locked else 'Mở khoá'
        AuditEntry.objects.create(
            user=request.user,
            action=f'{action_text} tài khoản {user.name}',
            resource_type='user',
            resource_id=user.id,
        )
        return Response(UserSerializer(user).data)
