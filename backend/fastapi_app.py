import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from django.conf import settings

app = FastAPI(
    title="Encycam Video Hub API",
    version="2.0.0",
    description="API quản lý quy trình duyệt video nội bộ",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Lỗi server nội bộ.", "error": str(exc)},
    )

from accounts.api import router as accounts_router
from videos.api import router as videos_router
from notifications.api import router as notifications_router
from audit.api import router as audit_router

app.include_router(accounts_router)
app.include_router(videos_router)
app.include_router(notifications_router)
app.include_router(audit_router)
