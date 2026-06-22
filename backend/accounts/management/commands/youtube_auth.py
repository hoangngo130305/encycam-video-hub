from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Xác thực YouTube API OAuth2 (chỉ cần chạy 1 lần đầu)'

    def handle(self, *args, **options):
        from google_auth_oauthlib.flow import InstalledAppFlow
        from youtube_service import CLIENT_SECRETS, TOKEN_FILE, SCOPES, _save_token

        self.stdout.write('🔐 Bắt đầu xác thực YouTube...')
        self.stdout.write(f'   Client secrets: {CLIENT_SECRETS}')

        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS, SCOPES)
        creds = flow.run_local_server(port=8080, open_browser=True)

        _save_token(creds)
        self.stdout.write(self.style.SUCCESS(f'✅ Xác thực thành công! Token lưu tại: {TOKEN_FILE}'))
