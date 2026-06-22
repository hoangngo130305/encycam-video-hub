import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'encycam.settings')

import django
django.setup()

from django.core.asgi import get_asgi_application
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
from starlette.routing import Mount
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from django.conf import settings as django_settings

# Import AFTER django.setup() so Django models are available
from fastapi_app import app as fastapi_app

django_asgi = ASGIStaticFilesHandler(get_asgi_application())

# /api/* → FastAPI  |  everything else → Django (admin, media)
_base = Starlette(routes=[
    Mount('/api', app=fastapi_app),
    Mount('/', app=django_asgi),
])

# CORS phải đặt ở lớp ngoài cùng — FastAPI sub-app middleware không bắt được preflight
application = CORSMiddleware(
    _base,
    allow_origins=django_settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
