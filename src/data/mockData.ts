import type { User, Video, Comment, Notification, AuditEntry } from '../types';

export const USERS: User[] = [
  { id: 1, name: 'Admin System', email: 'admin@encycam.vn', role: 'admin', initials: 'AD', avatarBg: '#f3e8ff', avatarColor: '#7c3aed', locked: false, createdAt: '01/01/2026' },
  { id: 2, name: 'Hoàng Minh', email: 'hminh@encycam.vn', role: 'btv', initials: 'HM', avatarBg: '#dbeafe', avatarColor: '#1d4ed8', locked: false, createdAt: '15/01/2026' },
  { id: 3, name: 'Trần Phú', email: 'tphu@encycam.vn', role: 'btv', initials: 'TP', avatarBg: '#dcfce7', avatarColor: '#15803d', locked: false, createdAt: '20/01/2026' },
  { id: 4, name: 'Lê Tuấn', email: 'ltuan@encycam.vn', role: 'btv', initials: 'LT', avatarBg: '#fce7f3', avatarColor: '#be185d', locked: true, createdAt: '22/01/2026' },
  { id: 5, name: 'Nguyễn Thảo', email: 'nthao@encycam.vn', role: 'reviewer', initials: 'NT', avatarBg: '#dcfce7', avatarColor: '#16a34a', locked: false, createdAt: '10/01/2026' },
  { id: 6, name: 'Phạm Long', email: 'plong@encycam.vn', role: 'final', initials: 'PL', avatarBg: '#ffedd5', avatarColor: '#ea580c', locked: false, createdAt: '10/01/2026' },
  { id: 7, name: 'Mai Hương', email: 'mhuong@encycam.vn', role: 'reviewer', initials: 'MH', avatarBg: '#ede9fe', avatarColor: '#7c3aed', locked: false, createdAt: '25/01/2026' },
  { id: 8, name: 'Bùi Khoa', email: 'bkhoa@encycam.vn', role: 'btv', initials: 'BK', avatarBg: '#fef9c3', avatarColor: '#a16207', locked: false, createdAt: '01/02/2026' },
];

const [admin, hoangMinh, tranPhu, , nguyenThao, phamLong, maiHuong] = USERS;

export const VIDEOS: Video[] = [
  {
    id: 1,
    title: 'Hướng dẫn chụp ảnh chân dung ngoài trời',
    fileId: 'VideoID_2413',
    status: 'needs_revision',
    currentVersion: 3,
    versions: [
      { number: 1, uploadedAt: '03/06/2026 09:00', uploadedBy: 'Hoàng Minh', fileSize: '1.2 GB', duration: '8:24' },
      { number: 2, uploadedAt: '05/06/2026 08:00', uploadedBy: 'Hoàng Minh', fileSize: '1.1 GB', duration: '8:18' },
      { number: 3, uploadedAt: '10/06/2026 08:42', uploadedBy: 'Hoàng Minh', fileSize: '1.15 GB', duration: '8:20' },
    ],
    btv: hoangMinh,
    reviewer: nguyenThao,
    uploadedAt: '03/06/2026 09:00',
    updatedAt: '2 giờ trước',
    notes: 'Video hướng dẫn kỹ thuật chụp chân dung outdoor, ánh sáng tự nhiên',
    thumbGradient: 'from-blue-500 to-purple-600',
    category: 'Tutorial',
    history: [
      { id: 1, timestamp: '03/06/2026 09:00', user: hoangMinh, action: 'Upload v1', toStatus: 'pending' },
      { id: 2, timestamp: '04/06/2026 10:00', user: nguyenThao, action: 'Bắt đầu review v1', fromStatus: 'pending', toStatus: 'reviewing' },
      { id: 3, timestamp: '04/06/2026 14:00', user: nguyenThao, action: 'Yêu cầu sửa — âm thanh 04:32', fromStatus: 'reviewing', toStatus: 'needs_revision' },
      { id: 4, timestamp: '05/06/2026 08:00', user: hoangMinh, action: 'Upload v2 (đã sửa âm thanh)' },
      { id: 5, timestamp: '05/06/2026 15:00', user: nguyenThao, action: 'Yêu cầu sửa — thiếu lower third 07:15', fromStatus: 'reviewing', toStatus: 'needs_revision' },
      { id: 6, timestamp: '10/06/2026 08:42', user: hoangMinh, action: 'Upload v3 (đã thêm lower third)' },
    ],
  },
  {
    id: 2,
    title: 'Review máy ảnh Sony ZV-E10 II — Full Test',
    fileId: 'VideoID_2410',
    status: 'reviewing',
    currentVersion: 1,
    versions: [
      { number: 1, uploadedAt: '09/06/2026 09:00', uploadedBy: 'Hoàng Minh', fileSize: '2.3 GB', duration: '15:02' },
    ],
    btv: hoangMinh,
    reviewer: nguyenThao,
    uploadedAt: '09/06/2026 09:00',
    updatedAt: '1 ngày trước',
    thumbGradient: 'from-slate-600 to-slate-800',
    category: 'Review',
    history: [
      { id: 1, timestamp: '09/06/2026 09:00', user: hoangMinh, action: 'Upload v1', toStatus: 'pending' },
      { id: 2, timestamp: '09/06/2026 10:30', user: nguyenThao, action: 'Bắt đầu review', fromStatus: 'pending', toStatus: 'reviewing' },
    ],
  },
  {
    id: 3,
    title: 'Top 5 ống kính kit tốt nhất 2025',
    fileId: 'VideoID_2408',
    status: 'reviewed',
    currentVersion: 2,
    versions: [
      { number: 1, uploadedAt: '03/06/2026 09:00', uploadedBy: 'Hoàng Minh', fileSize: '1.8 GB', duration: '11:37' },
      { number: 2, uploadedAt: '05/06/2026 10:00', uploadedBy: 'Hoàng Minh', fileSize: '1.75 GB', duration: '11:30' },
    ],
    btv: hoangMinh,
    reviewer: nguyenThao,
    uploadedAt: '03/06/2026 09:00',
    updatedAt: '3 ngày trước',
    thumbGradient: 'from-amber-500 to-orange-600',
    category: 'Comparison',
    history: [
      { id: 1, timestamp: '03/06/2026 09:00', user: hoangMinh, action: 'Upload v1', toStatus: 'pending' },
      { id: 2, timestamp: '04/06/2026 14:20', user: nguyenThao, action: 'Bắt đầu review v1', fromStatus: 'pending', toStatus: 'reviewing' },
      { id: 3, timestamp: '04/06/2026 15:00', user: nguyenThao, action: 'Yêu cầu sửa — âm thanh clip tại 03:20', fromStatus: 'reviewing', toStatus: 'needs_revision' },
      { id: 4, timestamp: '05/06/2026 10:00', user: hoangMinh, action: 'Upload v2 (đã sửa)' },
      { id: 5, timestamp: '05/06/2026 16:30', user: nguyenThao, action: 'Approve — chuyển Duyệt cuối', fromStatus: 'reviewing', toStatus: 'reviewed' },
    ],
  },
  {
    id: 4,
    title: 'Cách chỉnh màu Lightroom cho phong cảnh',
    fileId: 'VideoID_2401',
    status: 'approved',
    currentVersion: 1,
    versions: [
      { number: 1, uploadedAt: '01/06/2026 09:00', uploadedBy: 'Hoàng Minh', fileSize: '980 MB', duration: '9:15' },
    ],
    btv: hoangMinh,
    reviewer: nguyenThao,
    uploadedAt: '01/06/2026 09:00',
    updatedAt: '7 ngày trước',
    thumbGradient: 'from-green-400 to-teal-500',
    category: 'Tutorial',
    history: [
      { id: 1, timestamp: '01/06/2026 09:00', user: hoangMinh, action: 'Upload v1', toStatus: 'pending' },
      { id: 2, timestamp: '02/06/2026 10:00', user: nguyenThao, action: 'Review, không có lỗi', fromStatus: 'pending', toStatus: 'reviewing' },
      { id: 3, timestamp: '02/06/2026 14:00', user: nguyenThao, action: 'Approve — chuyển Duyệt cuối', fromStatus: 'reviewing', toStatus: 'reviewed' },
      { id: 4, timestamp: '03/06/2026 16:20', user: phamLong, action: 'Approve cuối — Published ✅', fromStatus: 'reviewed', toStatus: 'approved' },
    ],
  },
  {
    id: 5,
    title: 'Macro photography với kit lens — Chi tiết kỹ thuật',
    fileId: 'VideoID_2399',
    status: 'pending',
    currentVersion: 1,
    versions: [
      { number: 1, uploadedAt: '10/06/2026 07:00', uploadedBy: 'Trần Phú', fileSize: '750 MB', duration: '6:48' },
    ],
    btv: tranPhu,
    reviewer: undefined,
    uploadedAt: '10/06/2026 07:00',
    updatedAt: 'Hôm nay',
    thumbGradient: 'from-rose-400 to-pink-600',
    category: 'Tutorial',
    history: [
      { id: 1, timestamp: '10/06/2026 07:00', user: tranPhu, action: 'Upload v1', toStatus: 'pending' },
    ],
  },
  {
    id: 6,
    title: 'Chụp ảnh đường phố ban đêm — Street Photography',
    fileId: 'VideoID_2397',
    status: 'reviewing',
    currentVersion: 1,
    versions: [
      { number: 1, uploadedAt: '08/06/2026 09:00', uploadedBy: 'Trần Phú', fileSize: '1.4 GB', duration: '12:10' },
    ],
    btv: tranPhu,
    reviewer: maiHuong,
    uploadedAt: '08/06/2026 09:00',
    updatedAt: '2 ngày trước',
    thumbGradient: 'from-indigo-600 to-violet-700',
    category: 'Tutorial',
    history: [
      { id: 1, timestamp: '08/06/2026 09:00', user: tranPhu, action: 'Upload v1', toStatus: 'pending' },
      { id: 2, timestamp: '08/06/2026 11:00', user: maiHuong, action: 'Bắt đầu review', fromStatus: 'pending', toStatus: 'reviewing' },
    ],
  },
  {
    id: 7,
    title: 'Gear Review: Tripod Sirui 3T-35K — Có nên mua?',
    fileId: 'VideoID_2395',
    status: 'rejected',
    currentVersion: 1,
    versions: [
      { number: 1, uploadedAt: '05/06/2026 14:00', uploadedBy: 'Trần Phú', fileSize: '890 MB', duration: '7:22' },
    ],
    btv: tranPhu,
    reviewer: nguyenThao,
    uploadedAt: '05/06/2026 14:00',
    updatedAt: '5 ngày trước',
    thumbGradient: 'from-red-400 to-rose-600',
    category: 'Review',
    history: [
      { id: 1, timestamp: '05/06/2026 14:00', user: tranPhu, action: 'Upload v1', toStatus: 'pending' },
      { id: 2, timestamp: '06/06/2026 10:00', user: nguyenThao, action: 'Bắt đầu review', fromStatus: 'pending', toStatus: 'reviewing' },
      { id: 3, timestamp: '06/06/2026 14:00', user: nguyenThao, action: 'Approve — chuyển Duyệt cuối', fromStatus: 'reviewing', toStatus: 'reviewed' },
      { id: 4, timestamp: '07/06/2026 09:00', user: phamLong, action: 'Reject — Lý do: Chất lượng âm thanh quá kém, cần record lại', fromStatus: 'reviewed', toStatus: 'rejected' },
    ],
  },
];

export const COMMENTS: Record<number, Comment[]> = {
  1: [
    { id: 1, videoId: 1, user: nguyenThao, text: 'Đoạn này âm thanh bị rè, @HoàngMinh cần record lại narration từ đây. Kiểm tra micro trước khi quay lại.', timestamp: '04:32', resolved: false, createdAt: '2 giờ trước' },
    { id: 2, videoId: 1, user: nguyenThao, text: 'Thiếu lower third ở đây — thêm tên + chức danh người được phỏng vấn.', timestamp: '07:15', resolved: false, createdAt: '2 giờ trước' },
    { id: 3, videoId: 1, user: nguyenThao, text: 'Intro dài quá, cắt bớt phần setup đầu.', timestamp: '01:08', resolved: true, createdAt: '1 ngày trước' },
  ],
  2: [
    { id: 1, videoId: 2, user: nguyenThao, text: 'Phần B-roll máy quay quá tối, cần điều chỉnh exposure. Nếu không có raw file thì grade lại trong post.', timestamp: '02:15', resolved: false, createdAt: '1 ngày trước' },
  ],
  3: [
    { id: 1, videoId: 3, user: nguyenThao, text: 'Âm thanh bị clip tại đây, tiếng kít.', timestamp: '03:20', resolved: true, createdAt: '5 ngày trước' },
    { id: 2, videoId: 3, user: hoangMinh, text: 'Đã fix trong v2, anh check lại nhé.', timestamp: '03:20', resolved: true, createdAt: '4 ngày trước' },
    { id: 3, videoId: 3, user: nguyenThao, text: 'Thêm CTA end screen cho video này.', resolved: true, createdAt: '5 ngày trước' },
  ],
  4: [],
  5: [],
  6: [
    { id: 1, videoId: 6, user: maiHuong, text: 'Cảnh ban đêm hơi nhiều noise, check noise reduction trong premiere.', timestamp: '05:30', resolved: false, createdAt: '2 ngày trước' },
  ],
  7: [
    { id: 1, videoId: 7, user: nguyenThao, text: 'Âm thanh cần record lại, chất lượng quá kém ở đây.', timestamp: '01:20', resolved: false, createdAt: '5 ngày trước' },
  ],
};

export const NOTIFICATIONS: Record<string, Notification[]> = {
  btv: [
    { id: 1, type: 'comment', title: 'Comment mới', message: 'Nguyễn Thảo đã comment vào "Hướng dẫn chụp ảnh chân dung" — "Đoạn này âm thanh bị rè..."', read: false, createdAt: '2 giờ trước', videoId: 1, videoTitle: 'Hướng dẫn chụp ảnh chân dung', forRoles: ['btv'] },
    { id: 2, type: 'mention', title: 'Được mention', message: 'Nguyễn Thảo đã mention bạn tại timestamp 04:32 trong "Hướng dẫn chụp ảnh chân dung"', read: false, createdAt: '2 giờ trước', videoId: 1, forRoles: ['btv'] },
    { id: 3, type: 'upload', title: 'Video đang review', message: 'Video "Review Sony ZV-E10 II" chuyển sang trạng thái đang review', read: false, createdAt: '1 ngày trước', videoId: 2, forRoles: ['btv'] },
    { id: 4, type: 'approve', title: 'Video được duyệt', message: 'Video "Cách chỉnh màu Lightroom" đã được duyệt cuối approve ✅', read: true, createdAt: '7 ngày trước', videoId: 4, forRoles: ['btv'] },
  ],
  reviewer: [
    { id: 1, type: 'upload', title: 'Re-upload mới', message: 'Hoàng Minh đã re-upload "Hướng dẫn chụp ảnh chân dung" → v3', read: false, createdAt: '2 giờ trước', videoId: 1, forRoles: ['reviewer'] },
    { id: 2, type: 'upload', title: 'Video mới cần review', message: 'Video "Review Sony ZV-E10 II" đã upload, đang chờ bạn review', read: false, createdAt: '1 ngày trước', videoId: 2, forRoles: ['reviewer'] },
    { id: 3, type: 'timeout', title: '⚠️ Sắp timeout', message: '"Hướng dẫn chụp ảnh chân dung" còn 8 tiếng — hãy xử lý sớm!', read: false, createdAt: '30 phút trước', videoId: 1, forRoles: ['reviewer'] },
    { id: 4, type: 'approve', title: 'Video đã duyệt', message: 'Video "Cách chỉnh màu Lightroom" đã được duyệt cuối ✅', read: true, createdAt: '7 ngày trước', videoId: 4, forRoles: ['reviewer'] },
  ],
  final: [
    { id: 1, type: 'timeout', title: '⚠️ Timeout 7 ngày', message: '"Top 5 ống kính kit 2025" chưa được duyệt — Admin đã được notify.', read: false, createdAt: '1 giờ trước', videoId: 3, forRoles: ['final'] },
    { id: 2, type: 'upload', title: 'Chờ quyết định', message: '"Top 5 ống kính kit 2025" đã được Reviewer approve, đang chờ quyết định cuối của bạn', read: false, createdAt: '3 ngày trước', videoId: 3, forRoles: ['final'] },
    { id: 3, type: 'approve', title: 'Đã approve', message: 'Bạn đã approve "Cách chỉnh màu Lightroom" thành công', read: true, createdAt: '7 ngày trước', videoId: 4, forRoles: ['final'] },
  ],
  admin: [
    { id: 1, type: 'timeout', title: '🔴 Timeout 7 ngày', message: 'Phạm Long chưa duyệt "Top 5 ống kính kit 2025". Hãy liên hệ can thiệp.', read: false, createdAt: '1 giờ trước', videoId: 3, forRoles: ['admin'] },
    { id: 2, type: 'timeout', title: '🟡 Timeout 3 ngày', message: 'Nguyễn Thảo chưa review "Hướng dẫn chụp ảnh chân dung" — email nhắc đã gửi.', read: false, createdAt: '8 tiếng trước', videoId: 1, forRoles: ['admin'] },
    { id: 3, type: 'system', title: 'Cleanup hoàn thành', message: 'Cleanup thành công: 3 file cũ (_v1, _v2) đã xóa · tiết kiệm 4.2 GB', read: true, createdAt: '02:00 hôm nay', forRoles: ['admin'] },
  ],
};

export const AUDIT_LOG: AuditEntry[] = [
  { id: 1, timestamp: '10/06/2026 08:42', user: hoangMinh, action: 'Upload "Hướng dẫn chụp ảnh chân dung" → v3', resourceType: 'video', resourceId: 1 },
  { id: 2, timestamp: '10/06/2026 08:20', user: nguyenThao, action: 'Comment tại 04:32 — "Âm thanh bị rè..."', resourceType: 'video', resourceId: 1 },
  { id: 3, timestamp: '09/06/2026 16:55', user: phamLong, action: 'Mở video "Top 5 ống kính kit" để xem (chưa quyết định)', resourceType: 'video', resourceId: 3 },
  { id: 4, timestamp: '08/06/2026 10:30', user: nguyenThao, action: 'Approve "Top 5 ống kính kit" — chuyển Duyệt cuối', resourceType: 'video', resourceId: 3 },
  { id: 5, timestamp: '07/06/2026 14:00', user: hoangMinh, action: 'Upload "Top 5 ống kính kit" → v2 (sửa theo comment)', resourceType: 'video', resourceId: 3 },
  { id: 6, timestamp: '06/06/2026 09:00', user: nguyenThao, action: 'Yêu cầu sửa "Top 5 ống kính kit" v1 — âm thanh clip', resourceType: 'video', resourceId: 3 },
  { id: 7, timestamp: '05/06/2026 11:00', user: admin, action: 'Khoá tài khoản Lê Tuấn', resourceType: 'user', resourceId: 4 },
  { id: 8, timestamp: '03/06/2026 16:20', user: phamLong, action: 'Approve "Cách chỉnh màu Lightroom" — published ✅', resourceType: 'video', resourceId: 4 },
  { id: 9, timestamp: '02/06/2026 14:00', user: nguyenThao, action: 'Approve "Cách chỉnh màu Lightroom" — chuyển Duyệt cuối', resourceType: 'video', resourceId: 4 },
  { id: 10, timestamp: '01/06/2026 09:00', user: hoangMinh, action: 'Upload "Cách chỉnh màu Lightroom" → v1', resourceType: 'video', resourceId: 4 },
];
