from typing import Optional
from django.contrib.auth import authenticate
from django.db.models import Q
from fastapi import APIRouter, HTTPException, Depends
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, ROLE_AVATAR_COLORS
from accounts.schemas import (
    UserOut, LoginIn, LoginOut, LogoutIn,
    TokenRefreshIn, MeUpdateIn, UserCreateIn, UserUpdateIn,
)
from audit.models import AuditEntry
from fastapi_auth import require_auth

router = APIRouter(tags=["auth & users"])


def _initials(name: str) -> str:
    words = name.strip().split()
    return "".join(w[0] for w in words if w)[:2].upper()


def _audit(actor: User, action: str, resource_id: int) -> None:
    AuditEntry.objects.create(
        user=actor, action=action, resource_type="user", resource_id=resource_id,
    )


def _check_admin(user: User) -> None:
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền này.")


@router.post("/auth/login/", response_model=LoginOut)
def login(body: LoginIn):
    email = body.email.strip().lower()
    user = authenticate(email=email, password=body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng.")
    if user.locked:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khoá. Vui lòng liên hệ Admin.")
    refresh = RefreshToken.for_user(user)
    return LoginOut(
        accessToken=str(refresh.access_token),
        refreshToken=str(refresh),
        user=UserOut.model_validate(user),
    )


@router.post("/auth/logout/")
def logout(body: LogoutIn, user: User = Depends(require_auth)):
    try:
        token = RefreshToken(body.refreshToken)
        token.blacklist()
    except Exception:
        pass
    return {"detail": "Đã đăng xuất thành công."}


@router.get("/auth/me/", response_model=UserOut)
def me(user: User = Depends(require_auth)):
    return user


@router.patch("/auth/me/", response_model=UserOut)
def update_me(body: MeUpdateIn, user: User = Depends(require_auth)):
    if body.name is not None:
        user.name = body.name
        user.initials = _initials(body.name)
    if body.email is not None:
        email = body.email.strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise HTTPException(status_code=400, detail="Email đã tồn tại trong hệ thống.")
        user.email = email
    user.save()
    return user


@router.post("/auth/token/refresh/")
def token_refresh(body: TokenRefreshIn):
    try:
        old = RefreshToken(body.refresh)
        old.blacklist()
        new_refresh = RefreshToken.for_user(User.objects.get(id=old['user_id']))
        return {"access": str(new_refresh.access_token), "refresh": str(new_refresh)}
    except Exception:
        raise HTTPException(status_code=401, detail="Refresh token không hợp lệ hoặc đã hết hạn.")


@router.get("/users/", response_model=list[UserOut])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    user: User = Depends(require_auth),
):
    _check_admin(user)
    qs = User.objects.order_by('created_at')
    if search and search.strip():
        qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))
    if role and role.strip():
        qs = qs.filter(role=role)
    return list(qs)


@router.post("/users/", response_model=UserOut)
def create_user(body: UserCreateIn, user: User = Depends(require_auth)):
    _check_admin(user)
    if User.objects.filter(email__iexact=body.email).exists():
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong hệ thống.")
    bg, color = ROLE_AVATAR_COLORS.get(body.role, ('#dbeafe', '#1d4ed8'))
    new_user = User(
        name=body.name,
        email=body.email.strip().lower(),
        role=body.role,
        initials=_initials(body.name),
        avatar_bg=bg,
        avatar_color=color,
        is_staff=(body.role == 'admin'),
    )
    new_user.set_password(body.password)
    new_user.save()
    _audit(user, f"Thêm user mới: {new_user.name} ({new_user.role})", new_user.id)
    return new_user


@router.get("/users/{user_id}/", response_model=UserOut)
def get_user(user_id: int, user: User = Depends(require_auth)):
    _check_admin(user)
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")


@router.patch("/users/{user_id}/", response_model=UserOut)
def update_user(user_id: int, body: UserUpdateIn, user: User = Depends(require_auth)):
    _check_admin(user)
    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")
    if body.email is not None:
        email = body.email.strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=user_id).exists():
            raise HTTPException(status_code=400, detail="Email đã tồn tại trong hệ thống.")
        target.email = email
    if body.name is not None:
        target.name = body.name
        target.initials = _initials(body.name)
    if body.role is not None and body.role != target.role:
        target.role = body.role
        bg, color = ROLE_AVATAR_COLORS.get(body.role, ('#dbeafe', '#1d4ed8'))
        target.avatar_bg = bg
        target.avatar_color = color
        target.is_staff = (body.role == 'admin')
    target.save()
    _audit(user, f"Cập nhật tài khoản {target.name} — role: {target.role}", target.id)
    return target


@router.delete("/users/{user_id}/")
def delete_user(user_id: int, user: User = Depends(require_auth)):
    _check_admin(user)
    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")
    name = target.name
    target.delete()
    _audit(user, f"Xoá tài khoản {name}", user_id)
    return {"detail": "Đã xoá tài khoản."}


@router.post("/users/{user_id}/toggle-lock/", response_model=UserOut)
def toggle_lock(user_id: int, user: User = Depends(require_auth)):
    _check_admin(user)
    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")
    if target.role == 'admin':
        raise HTTPException(status_code=400, detail="Không thể khoá tài khoản Admin.")
    if target.pk == user.pk:
        raise HTTPException(status_code=400, detail="Không thể tự khoá tài khoản của mình.")
    target.locked = not target.locked
    target.save(update_fields=['locked'])
    action_text = "Khoá" if target.locked else "Mở khoá"
    _audit(user, f"{action_text} tài khoản {target.name}", target.id)
    return target
