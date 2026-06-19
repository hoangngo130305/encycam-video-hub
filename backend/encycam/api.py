from ninja import NinjaAPI
from encycam.ninja_auth import JWTAuth

api = NinjaAPI(
    title="Encycam Video Hub API",
    version="2.0.0",
    description="API quản lý quy trình duyệt video nội bộ",
    auth=JWTAuth(),
    urls_namespace="api",
)

# Routers phải import sau khi api được khởi tạo để tránh circular import
from accounts.api import router as accounts_router        # noqa: E402
from videos.api import router as videos_router            # noqa: E402
from notifications.api import router as notifications_router  # noqa: E402
from audit.api import router as audit_router              # noqa: E402

api.add_router("/", accounts_router)
api.add_router("/", videos_router)
api.add_router("/", notifications_router)
api.add_router("/", audit_router)
