from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_bearer = HTTPBearer()


def require_auth(credentials: HTTPAuthorizationCredentials = Depends(_bearer)):
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
    from accounts.models import User
    try:
        data = AccessToken(credentials.credentials)
        user = User.objects.get(id=data['user_id'], is_active=True)
        if user.locked:
            raise HTTPException(status_code=403, detail="Tài khoản đã bị khoá.")
        return user
    except HTTPException:
        raise
    except (TokenError, InvalidToken):
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn.")
    except Exception:
        raise HTTPException(status_code=401, detail="Xác thực thất bại.")
