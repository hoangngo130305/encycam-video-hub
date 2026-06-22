"""
python manage.py telegram_setup

Sau khi thêm bot vào group và gửi ít nhất 1 tin nhắn trong group,
lệnh này sẽ tự lấy chat_id và gửi tin nhắn test.
"""

import requests
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Lấy Telegram Chat ID và test gửi thông báo'

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        chat_id = getattr(settings, 'TELEGRAM_CHAT_ID', '')

        if not token:
            self.stderr.write('❌ TELEGRAM_BOT_TOKEN chưa được set trong .env')
            return

        self.stdout.write(f'🤖 Bot token: {token[:10]}...')

        # Lấy danh sách updates để tìm chat_id
        resp = requests.get(f'https://api.telegram.org/bot{token}/getUpdates', timeout=10)
        if not resp.ok:
            self.stderr.write(f'❌ Lỗi getUpdates: {resp.text}')
            return

        updates = resp.json().get('result', [])
        if not updates:
            self.stderr.write(
                '⚠️  Chưa có update nào. Hãy:\n'
                '  1. Thêm bot vào group/channel\n'
                '  2. Gửi bất kỳ tin nhắn nào trong group\n'
                '  3. Chạy lại lệnh này'
            )
            return

        found_chats = {}
        for u in updates:
            msg = u.get('message') or u.get('channel_post') or {}
            chat = msg.get('chat', {})
            if chat:
                cid   = str(chat['id'])
                ctype = chat.get('type', '')
                title = chat.get('title') or chat.get('first_name', '')
                found_chats[cid] = f'{title} ({ctype})'

        if not found_chats:
            self.stderr.write('❌ Không tìm thấy chat nào trong updates.')
            return

        self.stdout.write('\n📋 Các chat tìm thấy:')
        for cid, info in found_chats.items():
            marker = ' ← đang dùng' if cid == chat_id else ''
            self.stdout.write(f'  CHAT_ID = {cid}  →  {info}{marker}')

        target = chat_id or list(found_chats.keys())[0]
        self.stdout.write(f'\n📤 Gửi tin nhắn test đến chat {target}...')

        send_resp = requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={
                'chat_id':    target,
                'text':       '✅ <b>Encycam Video Hub</b>\n\nKết nối Telegram thành công! Thông báo workflow sẽ được gửi vào đây.',
                'parse_mode': 'HTML',
            },
            timeout=10,
        )

        if send_resp.ok:
            self.stdout.write(self.style.SUCCESS(f'\n✅ Gửi thành công!'))
            if not chat_id:
                self.stdout.write(
                    f'\n👉 Thêm dòng sau vào .env:\n'
                    f'   TELEGRAM_CHAT_ID={target}'
                )
        else:
            self.stderr.write(f'❌ Gửi thất bại: {send_resp.text}')
