import re
from django.contrib.auth import authenticate
from django.db.models import Q
from ninja import Router
from rest_framework_simplejwt.tokens import RefreshToken

from typing import Optional
from accounts.models import User, ROLE_AVATAR_COLORS
from accounts.schemas import (
    UserOut, LoginIn, LoginOut, LogoutIn,
    TokenRefreshIn, TokenRefreshOut,
    MeUpdateIn, UserCreateIn, UserUpdateIn,
)
from audit.models import AuditEntry

router = Router(tags=["auth & users"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _initials(name: str) -> str:
    words = name.strip().split()
    return "".join(w[0] for w in words if w)[:2].upper()


def _audit(actor: User, action: str, resource_id: int) -> None:
    AuditEntry.objects.create(
        user=actor, action=action, resource_type="user", resource_id=resource_id,
    )


def _user_out(user: User) -> dict:
    return UserOut.model_validate(user).model_dump(by_alias=True)


# ── auth ──────────────────────────────────────────────────────────────────────

@router.post("/auth/login/", auth=None, response=LoginOut)
def login(request, body: LoginIn):
    email = body.email.strip().lower()
    user = authenticate(request, email=email, password=body.password)

    if user is None:
        from ninja.errors import HttpError
        raise HttpError(401, "Email hoặc mật khẩu không đúng.")
    if user.locked:
        from ninja.errors import HttpError
        raise HttpError(403, "Tài khoản đã bị khoá. Vui lòng liên hệ Admin.")

    refresh = RefreshToken.for_user(user)
    return {
        "accessToken": str(refresh.access_token),
        "refreshToken": str(refresh),
        "user": _user_out(user),
    }


@router.post("/auth/logout/")
def logout(request, body: LogoutIn):
    try:
        token = RefreshToken(body.refreshToken)
        token.blacklist()
    except Exception:
        pass
    return {"detail": "Đã đăng xuất thành công."}


@router.get("/auth/me/", response=UserOut)
def me(request):
    return request.auth


@router.patch("/auth/me/", response=UserOut)
def update_me(request, body: MeUpdateIn):
    user: User = request.auth
    if body.name is not None:
        user.name = body.name
        user.initials = _initials(body.name)
    if body.email is not None:
        email = body.email.strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            from ninja.errors import HttpError
            raise HttpError(400, "Email đã tồn tại trong hệ thống.")
        user.email = email
    user.save()
    return user


@router.post("/auth/token/refresh/", auth=None)
def token_refresh(request, body: TokenRefreshIn):
    from ninja.errors import HttpError
    try:
        old = RefreshToken(body.refresh)
        old.blacklist()
        new_refresh = RefreshToken.for_user(
            User.objects.get(id=old['user_id'])
        )
        return {"access": str(new_refresh.access_token), "refresh": str(new_refresh)}
    except Exception:
        raise HttpError(401, "Refresh token không hợp lệ hoặc đã hết hạn.")


# ── user management (admin only) ──────────────────────────────────────────────

def _check_admin(user: User) -> None:
    if user.role != 'admin':
        from ninja.errors import HttpError
        raise HttpError(403, "Chỉ Admin mới có quyền này.")


@router.get("/users/", response=list[UserOut])
def list_users(request, search: Optional[str] = None, role: Optional[str] = None):
    _check_admin(request.auth)
    qs = User.objects.order_by('created_at')
    if search and search.strip():
        qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))
    if role and role.strip():
        qs = qs.filter(role=role)
    return list(qs)


@router.post("/users/", response=UserOut)
def create_user(request, body: UserCreateIn):
    _check_admin(request.auth)
    if User.objects.filter(email__iexact=body.email).exists():
        from ninja.errors import HttpError
        raise HttpError(400, "Email đã tồn tại trong hệ thống.")

    bg, color = ROLE_AVATAR_COLORS.get(body.role, ('#dbeafe', '#1d4ed8'))
    user = User(
        name=body.name,
        email=body.email.strip().lower(),
        role=body.role,
        initials=_initials(body.name),
        avatar_bg=bg,
        avatar_color=color,
        is_staff=(body.role == 'admin'),
    )
    user.set_password(body.password)
    user.save()
    _audit(request.auth, f"Thêm user mới: {user.name} ({user.role})", user.id)
    return user


@router.get("/users/{user_id}/", response=UserOut)
def get_user(request, user_id: int):
    _check_admin(request.auth)
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        from ninja.errors import HttpError
        raise HttpError(404, "Người dùng không tồn tại.")


@router.patch("/users/{user_id}/", response=UserOut)
def update_user(request, user_id: int, body: UserUpdateIn):
    _check_admin(request.auth)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        from ninja.errors import HttpError
        raise HttpError(404, "Người dùng không tồn tại.")

    if body.email is not None:
        email = body.email.strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=user_id).exists():
            from ninja.errors import HttpError
            raise HttpError(400, "Email đã tồn tại trong hệ thống.")
        user.email = email

    if body.name is not None:
        user.name = body.name
        user.initials = _initials(body.name)

    if body.role is not None and body.role != user.role:
        user.role = body.role
        bg, color = ROLE_AVATAR_COLORS.get(body.role, ('#dbeafe', '#1d4ed8'))
        user.avatar_bg = bg
        user.avatar_color = color
        user.is_staff = (body.role == 'admin')

    user.save()
    _audit(request.auth, f"Cập nhật tài khoản {user.name} — role: {user.role}", user.id)
    return user


@router.delete("/users/{user_id}/")
def delete_user(request, user_id: int):
    _check_admin(request.auth)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        from ninja.errors import HttpError
        raise HttpError(404, "Người dùng không tồn tại.")
    name = user.name
    user.delete()
    _audit(request.auth, f"Xoá tài khoản {name}", user_id)
    return {"detail": "Đã xoá tài khoản."}


@router.post("/users/{user_id}/toggle-lock/", response=UserOut)
def toggle_lock(request, user_id: int):
    _check_admin(request.auth)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        from ninja.errors import HttpError
        raise HttpError(404, "Người dùng không tồn tại.")

    if user.role == 'admin':
        from ninja.errors import HttpError
        raise HttpError(400, "Không thể khoá tài khoản Admin.")
    if user.pk == request.auth.pk:
        from ninja.errors import HttpError
        raise HttpError(400, "Không thể tự khoá tài khoản của mình.")

    user.locked = not user.locked
    user.save(update_fields=['locked'])
    action_text = "Khoá" if user.locked else "Mở khoá"
    _audit(request.auth, f"{action_text} tài khoản {user.name}", user.id)
    return user
