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


def _log(msg: str):
    import datetime
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[YouTube {ts}] {msg}', flush=True)


def _fail(video_id: int, reason: str):
    """Đánh dấu upload thất bại và log lý do."""
    _log(f'❌ THẤT BẠI (video_id={video_id}): {reason}')
    try:
        from videos.models import Video
        Video.objects.filter(pk=video_id).update(
            youtube_upload_status='failed',
            youtube_upload_progress=0,
        )
    except Exception as e:
        _log(f'⚠️  Không thể cập nhật status=failed: {e}')


def _get_category_yt_settings(category_name: str):
    """Đọc playlist_id và youtube_category_id từ bảng Category trong DB."""
    if not category_name:
        _log('ℹ️  Không có danh mục — dùng category_id mặc định 22')
        return None, '22'
    try:
        from videos.models import Category
        cat = Category.objects.get(name=category_name)
        _log(f'ℹ️  Danh mục "{category_name}": playlist_id={cat.youtube_playlist_id or "(không có)"}, category_id={cat.youtube_category_id}')
        return cat.youtube_playlist_id or None, cat.youtube_category_id or '22'
    except Exception as e:
        _log(f'⚠️  Không lấy được danh mục "{category_name}": {e} — dùng mặc định')
        return None, '22'


# ── Auth ──────────────────────────────────────────────────────────────────────

def _get_credentials():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    _log(f'🔑 Kiểm tra token file: {TOKEN_FILE}')

    if not os.path.exists(TOKEN_FILE):
        raise RuntimeError(
            f'Token file không tồn tại tại {TOKEN_FILE}. '
            'Chạy: python manage.py youtube_auth'
        )

    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    _log(f'🔑 Token hợp lệ: {creds.valid} | Hết hạn: {creds.expired} | '
         f'Có refresh_token: {bool(creds.refresh_token)}')

    if creds.expired:
        if creds.refresh_token:
            _log('🔑 Token hết hạn — đang làm mới...')
            try:
                creds.refresh(Request())
                _save_token(creds)
                _log('🔑 Token đã được làm mới thành công.')
            except Exception as e:
                raise RuntimeError(f'Không thể làm mới token: {e}')
        else:
            raise RuntimeError(
                'Token hết hạn và không có refresh_token. '
                'Cần chạy lại: python manage.py youtube_auth'
            )

    if not creds.valid:
        raise RuntimeError(
            f'Token không hợp lệ (valid=False, expired={creds.expired}). '
            'Cần chạy lại: python manage.py youtube_auth'
        )

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
        _log(f'⚠️  ffmpeg returncode={result.returncode}, stderr={result.stderr.decode(errors="replace")[:200]}')
    except FileNotFoundError:
        _log('⚠️  ffmpeg không tìm thấy trong PATH — bỏ qua thumbnail')
    except subprocess.TimeoutExpired:
        _log('⚠️  ffmpeg timeout — bỏ qua thumbnail')
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
        _log('✅ Đã đặt thumbnail từ frame đầu video')
    except Exception as e:
        _log(f'⚠️  Không thể đặt thumbnail (kênh chưa xác minh?): {e}')
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

    _log(f'▶ Bắt đầu _do_upload cho video_id={video_id}')

    # 1. Lấy video từ DB
    try:
        video = Video.objects.prefetch_related('versions').get(pk=video_id)
        _log(f'ℹ️  Video: "{video.title}" | status={video.status} | category="{video.category}"')
    except Video.DoesNotExist:
        _fail(video_id, f'Video {video_id} không tồn tại trong DB')
        return

    # Kiểm tra xem đã upload rồi chưa
    if video.youtube_url:
        _log(f'ℹ️  Video đã có youtube_url={video.youtube_url} — bỏ qua upload')
        return

    # 2. Lấy version hiện tại
    try:
        ver = video.versions.get(number=video.current_version)
        _log(f'ℹ️  Dùng version v{ver.number}, uploaded_by={ver.uploaded_by}')
    except VideoVersion.DoesNotExist:
        _fail(video_id, f'Không tìm thấy version v{video.current_version} trong DB')
        return

    # 3. Kiểm tra file
    if not ver.file or not ver.file.name:
        _fail(video_id, f'Version v{video.current_version} chưa có file đính kèm')
        return

    file_path = ver.file.path
    _log(f'ℹ️  File path: {file_path}')

    if not os.path.isfile(file_path):
        _fail(video_id, f'File không tồn tại trên disk: {file_path}')
        return

    file_size_mb = os.path.getsize(file_path) / 1024 / 1024
    _log(f'ℹ️  File size: {file_size_mb:.1f} MB')

    # 4. Xác thực YouTube
    try:
        creds = _get_credentials()
    except RuntimeError as e:
        _fail(video_id, f'Lỗi xác thực: {e}')
        return
    except Exception as e:
        _fail(video_id, f'Lỗi không xác định khi lấy credentials: {type(e).__name__}: {e}')
        return

    # 5. Khởi tạo YouTube client
    try:
        youtube = build('youtube', 'v3', credentials=creds)
        _log('ℹ️  Đã khởi tạo YouTube API client')
    except Exception as e:
        _fail(video_id, f'Không thể khởi tạo YouTube client: {type(e).__name__}: {e}')
        return

    yt_title = f'[{video.category}] {video.title}' if video.category else video.title
    playlist_id, yt_category = _get_category_yt_settings(video.category)

    _log(f'ℹ️  Tiêu đề YouTube: "{yt_title}" | category_id={yt_category}')

    body = {
        'snippet': {
            'title':           yt_title,
            'description':     video.notes or '',
            'categoryId':      yt_category,
            'defaultLanguage': 'vi',
        },
        'status': {
            'privacyStatus':           'public',
            'selfDeclaredMadeForKids': False,
            'madeForKids':             False,
        },
    }

    try:
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
    except Exception as e:
        _fail(video_id, f'Không thể tạo upload request: {type(e).__name__}: {e}')
        return

    # 6. Bắt đầu upload
    Video.objects.filter(pk=video_id).update(
        youtube_upload_status='uploading',
        youtube_upload_progress=0,
    )
    _log(f'⬆ Bắt đầu upload "{yt_title}" ({file_size_mb:.1f} MB)...')

    response = None
    chunk_count = 0
    try:
        while response is None:
            status, response = insert_request.next_chunk()
            chunk_count += 1
            if status:
                pct = int(status.progress() * 100)
                _log(f'⬆ Chunk #{chunk_count} — {pct}%')
                Video.objects.filter(pk=video_id).update(youtube_upload_progress=pct)
    except Exception as e:
        _fail(video_id, f'Lỗi trong quá trình upload (chunk #{chunk_count}): {type(e).__name__}: {e}')
        _log(traceback.format_exc())
        return

    if not response or 'id' not in response:
        _fail(video_id, f'Response không hợp lệ sau upload: {response}')
        return

    yt_id  = response['id']
    yt_url = f'https://www.youtube.com/watch?v={yt_id}'
    _log(f'✅ Upload xong! YouTube ID={yt_id} | URL={yt_url}')

    # 7. Đặt thumbnail
    thumb_path = _extract_thumbnail(file_path)
    if thumb_path:
        _set_thumbnail(youtube, yt_id, thumb_path)
    else:
        _log('ℹ️  Bỏ qua thumbnail')

    # 8. Thêm vào playlist
    if playlist_id:
        try:
            youtube.playlistItems().insert(
                part='snippet',
                body={
                    'snippet': {
                        'playlistId': playlist_id,
                        'resourceId': {'kind': 'youtube#video', 'videoId': yt_id},
                    }
                },
            ).execute()
            _log(f'✅ Đã thêm vào playlist "{video.category}" (id={playlist_id})')
        except Exception as e:
            _log(f'⚠️  Không thể thêm vào playlist: {type(e).__name__}: {e}')
    else:
        _log(f'ℹ️  Không có playlist cho danh mục "{video.category}"')

    # 9. Lưu kết quả
    Video.objects.filter(pk=video_id).update(
        youtube_video_id=yt_id,
        youtube_url=yt_url,
        youtube_upload_status='done',
        youtube_upload_progress=100,
    )
    _log(f'✅ Hoàn thành toàn bộ: {yt_url}')


def upload_async(video_id: int):
    """Chạy upload trong background thread — không block API response."""
    _log(f'🚀 upload_async được gọi cho video_id={video_id}')

    def _run():
        _log(f'🧵 Background thread bắt đầu cho video_id={video_id}')
        try:
            _do_upload(video_id)
        except Exception:
            err = traceback.format_exc()
            _log(f'❌ Lỗi không bắt được trong _do_upload:\n{err}')
            try:
                from videos.models import Video
                Video.objects.filter(pk=video_id).update(
                    youtube_upload_status='failed',
                    youtube_upload_progress=0,
                )
            except Exception as e2:
                _log(f'⚠️  Không thể cập nhật status=failed: {e2}')
        _log(f'🧵 Background thread kết thúc cho video_id={video_id}')

    threading.Thread(target=_run, daemon=True).start()
