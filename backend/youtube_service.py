import os
import subprocess
import tempfile
import threading
import traceback

from django.conf import settings as django_settings

CLIENT_SECRETS = os.path.join(django_settings.BASE_DIR, 'client_secrets.json')
TOKEN_FILE     = os.path.join(django_settings.BASE_DIR, 'youtube_token.json')

SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
]

def _get_category_yt_settings(category_name: str):
    """Đọc playlist_id và youtube_category_id từ bảng Category trong DB."""
    if not category_name:
        return None, '22'
    try:
        from videos.models import Category
        cat = Category.objects.get(name=category_name)
        return cat.youtube_playlist_id or None, cat.youtube_category_id or '22'
    except Exception:
        return None, '22'


# ── Auth ──────────────────────────────────────────────────────────────────────

def _get_credentials():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    if not os.path.exists(TOKEN_FILE):
        raise RuntimeError("YouTube chưa được xác thực. Chạy: python manage.py youtube_auth")

    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        _save_token(creds)
    return creds


def _save_token(creds):
    import json
    with open(TOKEN_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            'token':         creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri':     creds.token_uri,
            'client_id':     creds.client_id,
            'client_secret': creds.client_secret,
            'scopes':        list(creds.scopes) if creds.scopes else SCOPES,
        }, f, ensure_ascii=False, indent=2)


# ── Thumbnail ─────────────────────────────────────────────────────────────────

def _extract_thumbnail(video_path: str) -> str | None:
    """Dùng ffmpeg lấy frame đầu tiên (giây thứ 1) làm thumbnail JPEG."""
    tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    tmp.close()
    try:
        result = subprocess.run(
            [
                'ffmpeg', '-y',
                '-i', video_path,
                '-ss', '00:00:01',
                '-vframes', '1',
                '-q:v', '2',
                tmp.name,
            ],
            capture_output=True,
            timeout=60,
        )
        if result.returncode == 0 and os.path.getsize(tmp.name) > 0:
            return tmp.name
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    try:
        os.unlink(tmp.name)
    except Exception:
        pass
    return None


def _set_thumbnail(youtube, yt_id: str, thumb_path: str) -> None:
    from googleapiclient.http import MediaFileUpload
    try:
        youtube.thumbnails().set(
            videoId=yt_id,
            media_body=MediaFileUpload(thumb_path, mimetype='image/jpeg'),
        ).execute()
        print('[YouTube] ✅ Đã đặt thumbnail từ frame đầu video')
    except Exception as e:
        print(f'[YouTube] ⚠️  Không thể đặt thumbnail (kênh chưa xác minh?): {e}')
    finally:
        try:
            os.unlink(thumb_path)
        except Exception:
            pass


# ── Upload ────────────────────────────────────────────────────────────────────

def _do_upload(video_id: int):
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from videos.models import Video, VideoVersion

    try:
        video = Video.objects.prefetch_related('versions').get(pk=video_id)
    except Video.DoesNotExist:
        print(f'[YouTube] Video {video_id} không tồn tại.')
        return

    try:
        ver = video.versions.get(number=video.current_version)
    except VideoVersion.DoesNotExist:
        print(f'[YouTube] Không tìm thấy version {video.current_version}.')
        return

    if not ver.file or not ver.file.name:
        print(f'[YouTube] Video {video_id} chưa có file.')
        return

    file_path = ver.file.path
    if not os.path.isfile(file_path):
        print(f'[YouTube] File không tồn tại: {file_path}')
        return

    try:
        creds = _get_credentials()
    except RuntimeError as e:
        print(f'[YouTube] {e}')
        return

    youtube = build('youtube', 'v3', credentials=creds)

    yt_title              = f'[{video.category}] {video.title}' if video.category else video.title
    playlist_id, yt_category = _get_category_yt_settings(video.category)

    body = {
        'snippet': {
            'title':           yt_title,
            'description':     video.notes or '',
            'categoryId':      yt_category,   # map theo danh mục
            'defaultLanguage': 'vi',
        },
        'status': {
            'privacyStatus':           'public',
            'selfDeclaredMadeForKids': False,  # không dành cho trẻ em
            'madeForKids':             False,
        },
    }

    media = MediaFileUpload(
        file_path,
        chunksize=10 * 1024 * 1024,
        resumable=True,
        mimetype='video/mp4',
    )

    insert_request = youtube.videos().insert(
        part='snippet,status',
        body=body,
        media_body=media,
    )

    print(f"[YouTube] Bắt đầu upload '{yt_title}'...")
    response = None
    while response is None:
        status, response = insert_request.next_chunk()
        if status:
            print(f'[YouTube] Đang upload... {int(status.progress() * 100)}%')

    yt_id  = response['id']
    yt_url = f'https://www.youtube.com/watch?v={yt_id}'
    print(f'[YouTube] Upload xong! {yt_url}')

    # Đặt thumbnail từ frame đầu video
    thumb_path = _extract_thumbnail(file_path)
    if thumb_path:
        _set_thumbnail(youtube, yt_id, thumb_path)
    else:
        print('[YouTube] ffmpeg không khả dụng — bỏ qua bước đặt thumbnail')

    # Thêm vào playlist theo danh mục (đọc từ DB)
    if playlist_id:
        youtube.playlistItems().insert(
            part='snippet',
            body={
                'snippet': {
                    'playlistId': playlist_id,
                    'resourceId': {'kind': 'youtube#video', 'videoId': yt_id},
                }
            },
        ).execute()
        print(f"[YouTube] Đã thêm vào playlist '{video.category}'")
    else:
        print(f"[YouTube] Không tìm thấy playlist cho '{video.category}'")

    Video.objects.filter(pk=video_id).update(
        youtube_video_id=yt_id,
        youtube_url=yt_url,
    )
    print(f'[YouTube] ✅ Hoàn thành: {yt_url}')


def upload_async(video_id: int):
    """Chạy upload trong background thread — không block API response."""
    def _run():
        try:
            _do_upload(video_id)
        except Exception:
            traceback.print_exc()

    threading.Thread(target=_run, daemon=True).start()
