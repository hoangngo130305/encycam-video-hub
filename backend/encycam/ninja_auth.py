from ninja.security import HttpBearer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken


class JWTAuth(HttpBearer):
    """Validates Bearer JWT tokens issued by djangorestframework-simplejwt.
    Returns the User instance on success, None on failure (→ 401)."""

    def authenticate(self, request, token: str):
        try:
            from accounts.models import User
            data = AccessToken(token)
            user = User.objects.get(id=data['user_id'], is_active=True)
            if user.locked:
                return None
            return user
        except (TokenError, InvalidToken, Exception):
            return None
