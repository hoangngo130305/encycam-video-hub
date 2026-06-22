from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Xác thực YouTube API OAuth2 (chỉ cần chạy 1 lần đầu)'

    def handle(self, *args, **options):
        from google_auth_oauthlib.flow import InstalledAppFlow
        from youtube_service import CLIENT_SECRETS, TOKEN_FILE, SCOPES, _save_token

        self.stdout.write('🔐 Bắt đầu xác thực YouTube...')
        self.stdout.write(f'   Client secrets: {CLIENT_SECRETS}')

        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS, SCOPES)

        auth_url, _ = flow.authorization_url(prompt='consent')
        self.stdout.write('\n👉 Mở URL sau trong trình duyệt trên máy tính của bạn:\n')
        self.stdout.write(auth_url)
        self.stdout.write('\nSau khi đồng ý, Google sẽ hiện một mã code. Dán mã đó vào đây:\n')
        code = input('Mã code: ').strip()
        flow.fetch_token(code=code)
        creds = flow.credentials

        _save_token(creds)
        self.stdout.write(self.style.SUCCESS(f'✅ Xác thực thành công! Token lưu tại: {TOKEN_FILE}'))
