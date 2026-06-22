"""
Telegram notification service — gửi riêng cho từng user.

Setup:
  1. Chat với @BotFather → /newbot → lấy BOT_TOKEN → điền vào .env
  2. Mỗi thành viên nhắn tin với @userinfobot để lấy Telegram ID của mình
  3. Admin vào trang Quản lý user → điền Telegram ID cho từng người
"""

import threading
import traceback

import requests
from django.conf import settings as django_settings


def _token() -> str:
    return getattr(django_settings, 'TELEGRAM_BOT_TOKEN', '')


def _app_url() -> str:
    return getattr(django_settings, 'APP_FRONTEND_URL', '').rstrip('/')


def _link(video_id: int) -> str:
    base = _app_url()
    return f'{base}/#/videos/{video_id}' if base else ''


def _send(chat_id: str, text: str) -> None:
    token = _token()
    if not token or not chat_id:
        return
    try:
        resp = requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={
                'chat_id':                  chat_id,
                'text':                     text,
                'parse_mode':               'HTML',
                'disable_web_page_preview': True,
            },
            timeout=10,
        )
        if not resp.ok:
            print(f'[Telegram] Gửi tới {chat_id} lỗi: {resp.text}')
    except Exception:
        traceback.print_exc()


def _send_to_user(user, text: str) -> None:
    """Gửi cho 1 user cụ thể (object có thuộc tính telegram_chat_id)."""
    cid = getattr(user, 'telegram_chat_id', '') or ''
    if cid:
        threading.Thread(target=_send, args=(cid, text), daemon=True).start()
    else:
        print(f'[Telegram] User {getattr(user, "name", "?")} chưa có Telegram ID — bỏ qua.')


def _send_to_role(role: str, text: str) -> None:
    """Gửi cho tất cả user có role đã cho và có telegram_chat_id."""
    from accounts.models import User
    users = User.objects.filter(role=role, locked=False).exclude(telegram_chat_id='')
    for u in users:
        threading.Thread(target=_send, args=(u.telegram_chat_id, text), daemon=True).start()


# ── Các sự kiện workflow ──────────────────────────────────────────────────────

def notify_upload(video_id: int, video_title: str, btv_name: str, category: str) -> None:
    """BTV upload xong → thông báo tới tất cả Reviewer + Admin."""
    link = _link(video_id)
    text = (
        f'🎬 <b>Video mới cần Review</b>\n'
        f'📋 <b>Tên:</b> {video_title}\n'
        f'👤 <b>BTV:</b> {btv_name}\n'
        f'📁 <b>Danh mục:</b> {category or "—"}'
    )
    if link:
        text += f'\n🔗 <a href="{link}">Xem video</a>'
    _send_to_role('reviewer', text)
    _send_to_role('admin', text)


def notify_send_to_final(video_id: int, video_title: str, reviewer_name: str, category: str) -> None:
    """Reviewer chuyển lên → thông báo tới Duyệt cuối + Admin."""
    link = _link(video_id)
    text = (
        f'✅ <b>Chờ duyệt cuối</b>\n'
        f'📋 <b>Tên:</b> {video_title}\n'
        f'👁 <b>Reviewer:</b> {reviewer_name}\n'
        f'📁 <b>Danh mục:</b> {category or "—"}'
    )
    if link:
        text += f'\n🔗 <a href="{link}">Xem video</a>'
    _send_to_role('final', text)
    _send_to_role('admin', text)


def notify_revision(video_id: int, video_title: str, reviewer_name: str, note: str, btv) -> None:
    """Reviewer yêu cầu sửa → thông báo riêng cho BTV."""
    link = _link(video_id)
    text = (
        f'🔄 <b>Yêu cầu sửa lại</b>\n'
        f'📋 <b>Tên:</b> {video_title}\n'
        f'👁 <b>Reviewer:</b> {reviewer_name}\n'
        f'💬 <b>Nội dung:</b> {note}'
    )
    if link:
        text += f'\n🔗 <a href="{link}">Xem video</a>'
    _send_to_user(btv, text)


def notify_approved(video_id: int, video_title: str, approver_name: str, btv, reviewer=None, yt_url: str = '') -> None:
    """Approve cuối → thông báo riêng cho BTV + Reviewer."""
    link = _link(video_id)
    text = (
        f'🚀 <b>Video đã được Approve!</b>\n'
        f'📋 <b>Tên:</b> {video_title}\n'
        f'👤 <b>Người duyệt:</b> {approver_name}'
    )
    if yt_url:
        text += f'\n▶️ <a href="{yt_url}">Xem trên YouTube</a>'
    if link:
        text += f'\n🔗 <a href="{link}">Xem nội bộ</a>'
    _send_to_user(btv, text)
    if reviewer:
        _send_to_user(reviewer, text)


def notify_rejected(video_id: int, video_title: str, rejecter_name: str, reason: str, btv, reviewer=None) -> None:
    """Reject cuối → thông báo riêng cho BTV + Reviewer."""
    link = _link(video_id)
    text = (
        f'❌ <b>Video bị Reject</b>\n'
        f'📋 <b>Tên:</b> {video_title}\n'
        f'👤 <b>Người từ chối:</b> {rejecter_name}\n'
        f'💬 <b>Lý do:</b> {reason}'
    )
    if link:
        text += f'\n🔗 <a href="{link}">Xem video</a>'
    _send_to_user(btv, text)
    if reviewer:
        _send_to_user(reviewer, text)
