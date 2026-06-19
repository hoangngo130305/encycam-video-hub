from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-encycam-video-hub-dev-key')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# ---------------------------------------------------------------------------
# Jazzmin – giao diện admin hiện đại
# ---------------------------------------------------------------------------
JAZZMIN_SETTINGS = {
    # Tiêu đề trang
    "site_title": "Encycam Admin",
    "site_header": "Encycam",
    "site_brand": "Encycam Video Hub",
    "site_logo": None,
    "login_logo": None,
    "login_logo_dark": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,
    "welcome_sign": "Chào mừng đến Encycam Admin",
    "copyright": "Encycam Video Hub © 2026",

    # Tìm kiếm trong admin
    "search_model": ["accounts.User", "videos.Video"],

    # Thông tin user
    "user_avatar": None,

    # Top Menu
    "topmenu_links": [
        {"name": "Trang chủ", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Xem trang web", "url": "/", "new_window": True},
        {"model": "accounts.User"},
        {"model": "videos.Video"},
    ],

    # User Menu (góc trên phải)
    "usermenu_links": [
        {"name": "Hỗ trợ", "url": "https://github.com/", "new_window": True},
        {"model": "auth.user"},
    ],

    # Sidebar
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],

    # Sắp xếp thứ tự Apps trong sidebar
    "order_with_respect_to": [
        "accounts",
        "videos",
        "notifications",
        "audit",
        "auth",
    ],

    # Custom links trong sidebar
    "custom_links": {
        "videos": [
            {
                "name": "Video chờ duyệt",
                "url": "/admin/videos/video/?status=pending",
                "icon": "fas fa-clock",
                "permissions": ["videos.view_video"],
            },
        ],
    },

    # Icon cho từng app và model
    "icons": {
        "auth":                        "fas fa-users-cog",
        "auth.user":                   "fas fa-user",
        "auth.Group":                  "fas fa-users",
        "accounts":                    "fas fa-id-card",
        "accounts.User":               "fas fa-user-circle",
        "videos":                      "fas fa-film",
        "videos.Video":                "fas fa-video",
        "videos.VideoVersion":         "fas fa-code-branch",
        "videos.Comment":              "fas fa-comments",
        "videos.HistoryEntry":         "fas fa-history",
        "notifications":               "fas fa-bell",
        "notifications.Notification":  "fas fa-bell",
        "audit":                       "fas fa-clipboard-list",
        "audit.AuditEntry":            "fas fa-shield-alt",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",

    # Quan hệ
    "related_modal_active": True,

    # Tùy chỉnh CSS/JS
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,

    # Thay đổi giao diện view
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',                          # cần cho simplejwt
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    # Local apps
    'accounts',
    'videos',
    'notifications',
    'audit',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'encycam.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'encycam.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     config('DB_NAME',     default='encycam_db'),
        'USER':     config('DB_USER',     default='root'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST':     config('DB_HOST',     default='localhost'),
        'PORT':     config('DB_PORT',     default='3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = False

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST_FRAMEWORK block đã được thay bằng django-ninja (xem encycam/api.py)

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS = True

# Khi chạy sau reverse proxy (nginx), dùng header X-Forwarded-Host để build đúng URL tuyệt đối
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
