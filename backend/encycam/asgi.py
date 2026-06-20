import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'encycam.settings')

import django
django.setup()

from django.core.asgi import get_asgi_application
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
from starlette.routing import Mount
from starlette.applications import Starlette

# Import AFTER django.setup() so Django models are available
from fastapi_app import app as fastapi_app

django_asgi = ASGIStaticFilesHandler(get_asgi_application())

# /api/* → FastAPI  |  everything else → Django (admin, media)
application = Starlette(routes=[
    Mount('/api', app=fastapi_app),
    Mount('/', app=django_asgi),
])
