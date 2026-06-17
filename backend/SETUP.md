# EncyCam Video Hub — Backend Setup

## Cài đặt

```bash
cd backend

# 1. Tạo virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Tạo file .env (copy từ .env.example)
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux

# 4. Chạy migrations
python manage.py migrate

# 5. Seed dữ liệu mẫu (khớp hoàn toàn với frontend mockData.ts)
python manage.py seed_data

# 6. Khởi động server
python manage.py runserver
```

API sẽ chạy tại: http://127.0.0.1:8000/

## Tài khoản demo (password: `encycam2026`)

| Email                  | Vai trò   | Trạng thái |
|------------------------|-----------|------------|
| admin@encycam.vn       | Admin     | Active     |
| hminh@encycam.vn       | BTV       | Active     |
| tphu@encycam.vn        | BTV       | Active     |
| ltuan@encycam.vn       | BTV       | 🔒 Locked  |
| nthao@encycam.vn       | Reviewer  | Active     |
| plong@encycam.vn       | Final     | Active     |
| mhuong@encycam.vn      | Reviewer  | Active     |
| bkhoa@encycam.vn       | BTV       | Active     |

## API Endpoints

### Auth
| Method | URL                        | Mô tả                    |
|--------|----------------------------|--------------------------|
| POST   | /api/auth/login/           | Đăng nhập → JWT tokens   |
| POST   | /api/auth/logout/          | Đăng xuất (blacklist RT) |
| GET    | /api/auth/me/              | Thông tin user hiện tại  |
| PATCH  | /api/auth/me/              | Cập nhật profile         |
| POST   | /api/auth/token/refresh/   | Refresh access token     |

### Users (Admin only)
| Method | URL                            | Mô tả                  |
|--------|--------------------------------|------------------------|
| GET    | /api/users/                    | Danh sách user         |
| POST   | /api/users/                    | Tạo user mới           |
| GET    | /api/users/{id}/               | Chi tiết user          |
| PATCH  | /api/users/{id}/               | Cập nhật user          |
| DELETE | /api/users/{id}/               | Xoá user               |
| POST   | /api/users/{id}/toggle-lock/   | Khoá / Mở khoá         |

### Videos
| Method | URL                                   | Mô tả                              | Quyền          |
|--------|---------------------------------------|------------------------------------|----------------|
| GET    | /api/videos/                          | Danh sách video (theo role)        | All            |
| POST   | /api/videos/                          | Upload video mới                   | BTV            |
| GET    | /api/videos/{id}/                     | Chi tiết video                     | All            |
| PATCH  | /api/videos/{id}/                     | Cập nhật metadata                  | BTV/Admin      |
| POST   | /api/videos/{id}/start-review/        | Bắt đầu review                     | Reviewer       |
| POST   | /api/videos/{id}/request-revision/    | Yêu cầu sửa (body: {note})         | Reviewer       |
| POST   | /api/videos/{id}/send-to-final/       | Chuyển lên Duyệt cuối              | Reviewer       |
| POST   | /api/videos/{id}/approve/             | Approve video                      | Final          |
| POST   | /api/videos/{id}/reject/              | Reject (body: {reason})            | Final          |
| POST   | /api/videos/{id}/reupload/            | Re-upload phiên bản mới            | BTV            |

Query params cho GET /api/videos/:
- `status`: pending | reviewing | reviewed | approved | rejected | needs_revision
- `search`: tìm theo title, file_id, tên BTV
- `page`: số trang (mặc định 20/trang)

### Comments
| Method | URL                                      | Mô tả                        |
|--------|------------------------------------------|------------------------------|
| GET    | /api/videos/{id}/comments/               | Danh sách comments của video |
| POST   | /api/videos/{id}/comments/               | Thêm comment                 |
| PATCH  | /api/comments/{id}/resolve/              | Đánh dấu comment đã xử lý   |

### Notifications
| Method | URL                              | Mô tả                            |
|--------|----------------------------------|----------------------------------|
| GET    | /api/notifications/              | Thông báo của user hiện tại      |
| PATCH  | /api/notifications/{id}/read/    | Đánh dấu đã đọc                  |
| POST   | /api/notifications/read-all/     | Đánh dấu tất cả đã đọc           |
| GET    | /api/notifications/unread-count/ | Số thông báo chưa đọc            |

### Audit Log (Admin only)
| Method | URL                  | Mô tả                               |
|--------|----------------------|-------------------------------------|
| GET    | /api/audit/          | Danh sách audit log                 |
| GET    | /api/audit/export/   | Xuất CSV                            |

Query params cho GET /api/audit/:
- `search`: tìm trong action, user name
- `resourceType`: video | user | system
- `resourceId`: ID của resource

### Dashboard
| Method | URL             | Mô tả                         |
|--------|-----------------|-------------------------------|
| GET    | /api/dashboard/ | Stats theo role của user      |

## Django Admin
Truy cập: http://127.0.0.1:8000/admin/
Đăng nhập bằng: admin@encycam.vn / encycam2026

## Authentication
API sử dụng JWT Bearer token.

**Login:**
```
POST /api/auth/login/
Content-Type: application/json
{
  "email": "hminh@encycam.vn",
  "password": "encycam2026"
}
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": 2,
    "name": "Hoàng Minh",
    "email": "hminh@encycam.vn",
    "role": "btv",
    "initials": "HM",
    "avatarBg": "#dbeafe",
    "avatarColor": "#1d4ed8",
    "locked": false,
    "createdAt": "2026-01-15T..."
  }
}
```

**Authenticated requests:**
```
Authorization: Bearer eyJ...
```

## Response Format
Tất cả response trả về **camelCase** (tự động convert từ snake_case).
Ví dụ: `file_id` → `fileId`, `current_version` → `currentVersion`, `avatar_bg` → `avatarBg`
