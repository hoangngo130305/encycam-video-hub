"""
Management command: python manage.py seed_data
Seeds the database with the same mock data as the frontend (mockData.ts).
Safe to run multiple times — skips existing records.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime


def dt(s):
    """Parse Vietnamese date string 'dd/mm/yyyy HH:MM' to aware datetime."""
    try:
        naive = datetime.strptime(s, '%d/%m/%Y %H:%M')
    except ValueError:
        naive = datetime.strptime(s, '%d/%m/%Y')
    return timezone.make_aware(naive)


class Command(BaseCommand):
    help = 'Seed the database with the same demo data as the frontend mockData.ts'

    def handle(self, *args, **options):
        from accounts.models import User
        from videos.models import Video, VideoVersion, Comment, HistoryEntry
        from notifications.models import Notification
        from audit.models import AuditEntry

        self.stdout.write('🌱 Seeding users…')
        users_data = [
            {'email': 'admin@encycam.vn',  'name': 'Admin System', 'role': 'admin',    'initials': 'AD', 'avatar_bg': '#f3e8ff', 'avatar_color': '#7c3aed', 'locked': False},
            {'email': 'hminh@encycam.vn',  'name': 'Hoàng Minh',   'role': 'btv',      'initials': 'HM', 'avatar_bg': '#dbeafe', 'avatar_color': '#1d4ed8', 'locked': False},
            {'email': 'tphu@encycam.vn',   'name': 'Trần Phú',     'role': 'btv',      'initials': 'TP', 'avatar_bg': '#dcfce7', 'avatar_color': '#15803d', 'locked': False},
            {'email': 'ltuan@encycam.vn',  'name': 'Lê Tuấn',      'role': 'btv',      'initials': 'LT', 'avatar_bg': '#fce7f3', 'avatar_color': '#be185d', 'locked': True},
            {'email': 'nthao@encycam.vn',  'name': 'Nguyễn Thảo',  'role': 'reviewer', 'initials': 'NT', 'avatar_bg': '#dcfce7', 'avatar_color': '#16a34a', 'locked': False},
            {'email': 'plong@encycam.vn',  'name': 'Phạm Long',    'role': 'final',    'initials': 'PL', 'avatar_bg': '#ffedd5', 'avatar_color': '#ea580c', 'locked': False},
            {'email': 'mhuong@encycam.vn', 'name': 'Mai Hương',    'role': 'reviewer', 'initials': 'MH', 'avatar_bg': '#ede9fe', 'avatar_color': '#7c3aed', 'locked': False},
            {'email': 'bkhoa@encycam.vn',  'name': 'Bùi Khoa',     'role': 'btv',      'initials': 'BK', 'avatar_bg': '#fef9c3', 'avatar_color': '#a16207', 'locked': False},
        ]

        u = {}
        for d in users_data:
            obj, created = User.objects.get_or_create(
                email=d['email'],
                defaults={
                    'name':         d['name'],
                    'role':         d['role'],
                    'initials':     d['initials'],
                    'avatar_bg':    d['avatar_bg'],
                    'avatar_color': d['avatar_color'],
                    'locked':       d['locked'],
                    'is_staff':     d['role'] == 'admin',
                    'is_superuser': d['role'] == 'admin',
                },
            )
            if created:
                obj.set_password('encycam2026')
                obj.save()
                self.stdout.write(f'  ✅ Created user: {obj.name}')
            else:
                self.stdout.write(f'  ⏭  Skipped: {obj.name}')
            u[d['email']] = obj

        admin    = u['admin@encycam.vn']
        hminh    = u['hminh@encycam.vn']
        tphu     = u['tphu@encycam.vn']
        nthao    = u['nthao@encycam.vn']
        plong    = u['plong@encycam.vn']
        mhuong   = u['mhuong@encycam.vn']

        self.stdout.write('🎬 Seeding videos…')
        videos_data = [
            {
                'file_id': 'VideoID_2413',
                'title': 'Hướng dẫn chụp ảnh chân dung ngoài trời',
                'status': 'needs_revision',
                'current_version': 3,
                'btv': hminh, 'reviewer': nthao,
                'notes': 'Video hướng dẫn kỹ thuật chụp chân dung outdoor, ánh sáng tự nhiên',
                'thumb_gradient': 'from-blue-500 to-purple-600',
                'category': 'Tutorial',
                'uploaded_at': dt('03/06/2026 09:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': hminh, 'file_size': '1.2 GB', 'duration': '8:24', 'at': dt('03/06/2026 09:00')},
                    {'number': 2, 'uploaded_by': hminh, 'file_size': '1.1 GB', 'duration': '8:18', 'at': dt('05/06/2026 08:00')},
                    {'number': 3, 'uploaded_by': hminh, 'file_size': '1.15 GB', 'duration': '8:20', 'at': dt('10/06/2026 08:42')},
                ],
                'history': [
                    {'user': hminh,  'action': 'Upload v1',                             'to': 'pending',         'at': dt('03/06/2026 09:00')},
                    {'user': nthao,  'action': 'Bắt đầu review v1',                     'from': 'pending',        'to': 'reviewing',       'at': dt('04/06/2026 10:00')},
                    {'user': nthao,  'action': 'Yêu cầu sửa — âm thanh 04:32',          'from': 'reviewing',      'to': 'needs_revision',  'at': dt('04/06/2026 14:00')},
                    {'user': hminh,  'action': 'Upload v2 (đã sửa âm thanh)',            'at': dt('05/06/2026 08:00')},
                    {'user': nthao,  'action': 'Yêu cầu sửa — thiếu lower third 07:15', 'from': 'reviewing',      'to': 'needs_revision',  'at': dt('05/06/2026 15:00')},
                    {'user': hminh,  'action': 'Upload v3 (đã thêm lower third)',        'at': dt('10/06/2026 08:42')},
                ],
                'comments': [
                    {'user': nthao, 'text': 'Đoạn này âm thanh bị rè, @HoàngMinh cần record lại narration từ đây.', 'ts': '04:32', 'resolved': False},
                    {'user': nthao, 'text': 'Thiếu lower third ở đây — thêm tên + chức danh người được phỏng vấn.', 'ts': '07:15', 'resolved': False},
                    {'user': nthao, 'text': 'Intro dài quá, cắt bớt phần setup đầu.', 'ts': '01:08', 'resolved': True},
                ],
            },
            {
                'file_id': 'VideoID_2410',
                'title': 'Review máy ảnh Sony ZV-E10 II — Full Test',
                'status': 'reviewing',
                'current_version': 1,
                'btv': hminh, 'reviewer': nthao,
                'thumb_gradient': 'from-slate-600 to-slate-800',
                'category': 'Review',
                'uploaded_at': dt('09/06/2026 09:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': hminh, 'file_size': '2.3 GB', 'duration': '15:02', 'at': dt('09/06/2026 09:00')},
                ],
                'history': [
                    {'user': hminh, 'action': 'Upload v1',          'to': 'pending',   'at': dt('09/06/2026 09:00')},
                    {'user': nthao, 'action': 'Bắt đầu review',     'from': 'pending', 'to': 'reviewing', 'at': dt('09/06/2026 10:30')},
                ],
                'comments': [
                    {'user': nthao, 'text': 'Phần B-roll máy quay quá tối, cần điều chỉnh exposure.', 'ts': '02:15', 'resolved': False},
                ],
            },
            {
                'file_id': 'VideoID_2408',
                'title': 'Top 5 ống kính kit tốt nhất 2025',
                'status': 'reviewed',
                'current_version': 2,
                'btv': hminh, 'reviewer': nthao,
                'thumb_gradient': 'from-amber-500 to-orange-600',
                'category': 'Comparison',
                'uploaded_at': dt('03/06/2026 09:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': hminh, 'file_size': '1.8 GB', 'duration': '11:37', 'at': dt('03/06/2026 09:00')},
                    {'number': 2, 'uploaded_by': hminh, 'file_size': '1.75 GB', 'duration': '11:30', 'at': dt('05/06/2026 10:00')},
                ],
                'history': [
                    {'user': hminh, 'action': 'Upload v1',                                   'to': 'pending',   'at': dt('03/06/2026 09:00')},
                    {'user': nthao, 'action': 'Bắt đầu review v1',                           'from': 'pending',   'to': 'reviewing',      'at': dt('04/06/2026 14:20')},
                    {'user': nthao, 'action': 'Yêu cầu sửa — âm thanh clip tại 03:20',       'from': 'reviewing', 'to': 'needs_revision', 'at': dt('04/06/2026 15:00')},
                    {'user': hminh, 'action': 'Upload v2 (đã sửa)',                           'at': dt('05/06/2026 10:00')},
                    {'user': nthao, 'action': 'Approve — chuyển Duyệt cuối',                  'from': 'reviewing', 'to': 'reviewed',       'at': dt('05/06/2026 16:30')},
                ],
                'comments': [
                    {'user': nthao, 'text': 'Âm thanh bị clip tại đây, tiếng kít.', 'ts': '03:20', 'resolved': True},
                    {'user': hminh, 'text': 'Đã fix trong v2, anh check lại nhé.',  'ts': '03:20', 'resolved': True},
                    {'user': nthao, 'text': 'Thêm CTA end screen cho video này.',   'ts': '',      'resolved': True},
                ],
            },
            {
                'file_id': 'VideoID_2401',
                'title': 'Cách chỉnh màu Lightroom cho phong cảnh',
                'status': 'approved',
                'current_version': 1,
                'btv': hminh, 'reviewer': nthao,
                'thumb_gradient': 'from-green-400 to-teal-500',
                'category': 'Tutorial',
                'uploaded_at': dt('01/06/2026 09:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': hminh, 'file_size': '980 MB', 'duration': '9:15', 'at': dt('01/06/2026 09:00')},
                ],
                'history': [
                    {'user': hminh,  'action': 'Upload v1',                            'to': 'pending',   'at': dt('01/06/2026 09:00')},
                    {'user': nthao,  'action': 'Review, không có lỗi',                 'from': 'pending',   'to': 'reviewing', 'at': dt('02/06/2026 10:00')},
                    {'user': nthao,  'action': 'Approve — chuyển Duyệt cuối',          'from': 'reviewing', 'to': 'reviewed',  'at': dt('02/06/2026 14:00')},
                    {'user': plong,  'action': 'Approve cuối — Published ✅',           'from': 'reviewed',  'to': 'approved',  'at': dt('03/06/2026 16:20')},
                ],
                'comments': [],
            },
            {
                'file_id': 'VideoID_2399',
                'title': 'Macro photography với kit lens — Chi tiết kỹ thuật',
                'status': 'pending',
                'current_version': 1,
                'btv': tphu, 'reviewer': None,
                'thumb_gradient': 'from-rose-400 to-pink-600',
                'category': 'Tutorial',
                'uploaded_at': dt('10/06/2026 07:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': tphu, 'file_size': '750 MB', 'duration': '6:48', 'at': dt('10/06/2026 07:00')},
                ],
                'history': [
                    {'user': tphu, 'action': 'Upload v1', 'to': 'pending', 'at': dt('10/06/2026 07:00')},
                ],
                'comments': [],
            },
            {
                'file_id': 'VideoID_2397',
                'title': 'Chụp ảnh đường phố ban đêm — Street Photography',
                'status': 'reviewing',
                'current_version': 1,
                'btv': tphu, 'reviewer': mhuong,
                'thumb_gradient': 'from-indigo-600 to-violet-700',
                'category': 'Tutorial',
                'uploaded_at': dt('08/06/2026 09:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': tphu, 'file_size': '1.4 GB', 'duration': '12:10', 'at': dt('08/06/2026 09:00')},
                ],
                'history': [
                    {'user': tphu,   'action': 'Upload v1',      'to': 'pending',   'at': dt('08/06/2026 09:00')},
                    {'user': mhuong, 'action': 'Bắt đầu review', 'from': 'pending', 'to': 'reviewing', 'at': dt('08/06/2026 11:00')},
                ],
                'comments': [
                    {'user': mhuong, 'text': 'Cảnh ban đêm hơi nhiều noise, check noise reduction.', 'ts': '05:30', 'resolved': False},
                ],
            },
            {
                'file_id': 'VideoID_2395',
                'title': 'Gear Review: Tripod Sirui 3T-35K — Có nên mua?',
                'status': 'rejected',
                'current_version': 1,
                'btv': tphu, 'reviewer': nthao,
                'thumb_gradient': 'from-red-400 to-rose-600',
                'category': 'Review',
                'uploaded_at': dt('05/06/2026 14:00'),
                'versions': [
                    {'number': 1, 'uploaded_by': tphu, 'file_size': '890 MB', 'duration': '7:22', 'at': dt('05/06/2026 14:00')},
                ],
                'history': [
                    {'user': tphu,  'action': 'Upload v1',                                                          'to': 'pending',   'at': dt('05/06/2026 14:00')},
                    {'user': nthao, 'action': 'Bắt đầu review',                                                     'from': 'pending',  'to': 'reviewing', 'at': dt('06/06/2026 10:00')},
                    {'user': nthao, 'action': 'Approve — chuyển Duyệt cuối',                                         'from': 'reviewing', 'to': 'reviewed',  'at': dt('06/06/2026 14:00')},
                    {'user': plong, 'action': 'Reject — Lý do: Chất lượng âm thanh quá kém, cần record lại',         'from': 'reviewed',  'to': 'rejected',  'at': dt('07/06/2026 09:00')},
                ],
                'comments': [
                    {'user': nthao, 'text': 'Âm thanh cần record lại, chất lượng quá kém ở đây.', 'ts': '01:20', 'resolved': False},
                ],
            },
        ]

        vid_objs = {}
        for d in videos_data:
            obj, created = Video.objects.get_or_create(
                file_id=d['file_id'],
                defaults={
                    'title':           d['title'],
                    'status':          d['status'],
                    'current_version': d['current_version'],
                    'btv':             d['btv'],
                    'reviewer':        d.get('reviewer'),
                    'notes':           d.get('notes', ''),
                    'thumb_gradient':  d['thumb_gradient'],
                    'category':        d['category'],
                },
            )
            vid_objs[d['file_id']] = (obj, d)
            if created:
                # Manually set uploaded_at (auto_now_add can't be overridden normally)
                Video.objects.filter(pk=obj.pk).update(uploaded_at=d['uploaded_at'])
                self.stdout.write(f'  ✅ Created video: {obj.title}')
            else:
                self.stdout.write(f'  ⏭  Skipped: {obj.title}')

        self.stdout.write('📋 Seeding versions, history, comments…')
        for file_id, (obj, d) in vid_objs.items():
            if VideoVersion.objects.filter(video=obj).exists():
                continue
            for v in d['versions']:
                vobj = VideoVersion.objects.create(
                    video=obj, number=v['number'],
                    uploaded_by=v['uploaded_by'],
                    file_size=v['file_size'], duration=v['duration'],
                )
                VideoVersion.objects.filter(pk=vobj.pk).update(uploaded_at=v['at'])

            for h in d['history']:
                hobj = HistoryEntry.objects.create(
                    video=obj, user=h['user'], action=h['action'],
                    from_status=h.get('from'), to_status=h.get('to'),
                )
                HistoryEntry.objects.filter(pk=hobj.pk).update(timestamp=h['at'])

            for c in d.get('comments', []):
                Comment.objects.create(
                    video=obj, user=c['user'],
                    text=c['text'], timestamp=c.get('ts', ''),
                    resolved=c['resolved'],
                )

        self.stdout.write('🔔 Seeding notifications…')
        notif_data = [
            # BTV notifications (for hminh)
            {'user': hminh, 'type': 'comment', 'title': 'Comment mới', 'message': 'Nguyễn Thảo đã comment vào "Hướng dẫn chụp ảnh chân dung" — "Đoạn này âm thanh bị rè..."', 'read': False, 'video_id': 'VideoID_2413'},
            {'user': hminh, 'type': 'mention', 'title': 'Được mention', 'message': 'Nguyễn Thảo đã mention bạn tại timestamp 04:32 trong "Hướng dẫn chụp ảnh chân dung"', 'read': False, 'video_id': 'VideoID_2413'},
            {'user': hminh, 'type': 'upload',  'title': 'Video đang review', 'message': 'Video "Review Sony ZV-E10 II" chuyển sang trạng thái đang review', 'read': False, 'video_id': 'VideoID_2410'},
            {'user': hminh, 'type': 'approve', 'title': 'Video được duyệt', 'message': 'Video "Cách chỉnh màu Lightroom" đã được duyệt cuối approve ✅', 'read': True, 'video_id': 'VideoID_2401'},
            # Reviewer notifications (for nthao)
            {'user': nthao, 'type': 'upload',  'title': 'Re-upload mới', 'message': 'Hoàng Minh đã re-upload "Hướng dẫn chụp ảnh chân dung" → v3', 'read': False, 'video_id': 'VideoID_2413'},
            {'user': nthao, 'type': 'upload',  'title': 'Video mới cần review', 'message': 'Video "Review Sony ZV-E10 II" đã upload, đang chờ bạn review', 'read': False, 'video_id': 'VideoID_2410'},
            {'user': nthao, 'type': 'timeout', 'title': '⚠️ Sắp timeout', 'message': '"Hướng dẫn chụp ảnh chân dung" còn 8 tiếng — hãy xử lý sớm!', 'read': False, 'video_id': 'VideoID_2413'},
            {'user': nthao, 'type': 'approve', 'title': 'Video đã duyệt', 'message': 'Video "Cách chỉnh màu Lightroom" đã được duyệt cuối ✅', 'read': True, 'video_id': 'VideoID_2401'},
            # Final notifications (for plong)
            {'user': plong, 'type': 'timeout', 'title': '⚠️ Timeout 7 ngày', 'message': '"Top 5 ống kính kit 2025" chưa được duyệt — Admin đã được notify.', 'read': False, 'video_id': 'VideoID_2408'},
            {'user': plong, 'type': 'upload',  'title': 'Chờ quyết định', 'message': '"Top 5 ống kính kit 2025" đã được Reviewer approve, đang chờ quyết định cuối của bạn', 'read': False, 'video_id': 'VideoID_2408'},
            {'user': plong, 'type': 'approve', 'title': 'Đã approve', 'message': 'Bạn đã approve "Cách chỉnh màu Lightroom" thành công', 'read': True, 'video_id': 'VideoID_2401'},
            # Admin notifications
            {'user': admin, 'type': 'timeout', 'title': '🔴 Timeout 7 ngày', 'message': 'Phạm Long chưa duyệt "Top 5 ống kính kit 2025". Hãy liên hệ can thiệp.', 'read': False, 'video_id': 'VideoID_2408'},
            {'user': admin, 'type': 'timeout', 'title': '🟡 Timeout 3 ngày', 'message': 'Nguyễn Thảo chưa review "Hướng dẫn chụp ảnh chân dung" — email nhắc đã gửi.', 'read': False, 'video_id': 'VideoID_2413'},
            {'user': admin, 'type': 'system',  'title': 'Cleanup hoàn thành', 'message': 'Cleanup thành công: 3 file cũ (_v1, _v2) đã xóa · tiết kiệm 4.2 GB', 'read': True, 'video_id': None},
        ]

        for d in notif_data:
            if Notification.objects.filter(user=d['user'], title=d['title']).exists():
                continue
            video = vid_objs.get(d['video_id'], (None,))[0] if d.get('video_id') else None
            Notification.objects.create(
                user=d['user'], type=d['type'],
                title=d['title'], message=d['message'],
                read=d['read'], video=video,
            )

        self.stdout.write('📜 Seeding audit log…')
        audit_data = [
            {'user': hminh,  'action': 'Upload "Hướng dẫn chụp ảnh chân dung" → v3',              'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2413', 'at': dt('10/06/2026 08:42')},
            {'user': nthao,  'action': 'Comment tại 04:32 — "Âm thanh bị rè..."',                   'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2413', 'at': dt('10/06/2026 08:20')},
            {'user': plong,  'action': 'Mở video "Top 5 ống kính kit" để xem (chưa quyết định)',    'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2408', 'at': dt('09/06/2026 16:55')},
            {'user': nthao,  'action': 'Approve "Top 5 ống kính kit" — chuyển Duyệt cuối',          'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2408', 'at': dt('08/06/2026 10:30')},
            {'user': hminh,  'action': 'Upload "Top 5 ống kính kit" → v2 (sửa theo comment)',        'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2408', 'at': dt('07/06/2026 14:00')},
            {'user': nthao,  'action': 'Yêu cầu sửa "Top 5 ống kính kit" v1 — âm thanh clip',       'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2408', 'at': dt('06/06/2026 09:00')},
            {'user': admin,  'action': 'Khoá tài khoản Lê Tuấn',                                     'rtype': 'user',   'rid': None,  'video_id': None,           'at': dt('05/06/2026 11:00')},
            {'user': plong,  'action': 'Approve "Cách chỉnh màu Lightroom" — published ✅',           'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2401', 'at': dt('03/06/2026 16:20')},
            {'user': nthao,  'action': 'Approve "Cách chỉnh màu Lightroom" — chuyển Duyệt cuối',    'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2401', 'at': dt('02/06/2026 14:00')},
            {'user': hminh,  'action': 'Upload "Cách chỉnh màu Lightroom" → v1',                    'rtype': 'video',  'rid': None,  'video_id': 'VideoID_2401', 'at': dt('01/06/2026 09:00')},
        ]

        for d in audit_data:
            if AuditEntry.objects.filter(user=d['user'], action=d['action']).exists():
                continue
            video = vid_objs.get(d['video_id'], (None,))[0] if d.get('video_id') else None
            resource_id = video.id if video else d.get('rid')
            entry = AuditEntry.objects.create(
                user=d['user'], action=d['action'],
                resource_type=d['rtype'],
                resource_id=resource_id,
            )
            AuditEntry.objects.filter(pk=entry.pk).update(timestamp=d['at'])

        self.stdout.write(self.style.SUCCESS('\n✅ Seed hoàn thành! Tài khoản mặc định: password = encycam2026'))
        self.stdout.write('   Demo accounts:')
        for ud in users_data:
            self.stdout.write(f'   {ud["email"]:30s}  [{ud["role"]:8s}]  {"🔒 LOCKED" if ud["locked"] else ""}')
