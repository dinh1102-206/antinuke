# 🛡️ Discord Anti-Nuke Bot (Node.js & discord.js v14)

Hệ thống bot bảo vệ máy chủ Discord toàn diện, tự động phát hiện, ngăn chặn và xử lý tức thì các hành vi phá hoại (nuking), raid máy chủ, bot độc hại và quản trị viên biến chất.

---

## 🚀 Các Tính Năng Bảo Vệ Nổi Bật

| Tính năng | Mô tả hoạt động |
| :--- | :--- |
| **🔨 Anti-Ban** | Phát hiện và cấm ngay kẻ ban thành viên hàng loạt; tự động gỡ cấm cho nạn nhân. |
| **👢 Anti-Kick** | Phát hiện và xử lý kẻ kick thành viên hàng loạt. |
| **📁 Anti-Channel Delete** | Xử lý kẻ xoá kênh + **Tự động tạo lại kênh** với toàn bộ cài đặt & quyền hạn cũ. |
| **➕ Anti-Channel Create** | Xử lý kẻ spam tạo kênh hàng loạt + tự động xoá kênh spam. |
| **✏️ Anti-Channel Update** | Ngăn chặn đổi tên kênh trái phép, khôi phục lại tên ban đầu. |
| **🎭 Anti-Role Delete** | Xử lý kẻ xoá vai trò + **Tự động tạo lại vai trò** (tên, màu sắc, quyền). |
| **➕ Anti-Role Create** | Xử lý kẻ spam tạo vai trò hàng loạt + tự động xoá vai trò spam. |
| **👑 Anti-Admin Role** | Phát hiện và tước ngay vai trò quản trị (Administrator) nếu được cấp lén lút cho người lạ; phạt người cấp. |
| **🤖 Anti-Bot Add** | **Tức thì ban bất kỳ bot lạ nào** được thêm vào server bởi người không thuộc Whitelist; phạt người mời bot. |
| **🌐 Anti-Server Update** | Ngăn chặn đổi tên máy chủ, xoá avatar hoặc đổi Vanity URL. |
| **🔗 Anti-Webhook** | Phát hiện và xoá webhook tạo lén để spam tin nhắn; phạt người tạo. |
| **📦 Backup & Snapshot** | Sao lưu toàn bộ danh sách kênh và vai trò vào file JSON để phục hồi khẩn cấp. |

---

## ⚙️ Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Chuẩn bị Bot trên Discord Developer Portal
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications).
2. Bấm **New Application** và đặt tên cho Bot.
3. Vào tab **Bot**:
   - Bấm **Reset Token** để lấy `DISCORD_TOKEN`.
   - Kéo xuống mục **Privileged Gateway Intents** và BẬT:
     - ✅ **Server Members Intent** *(Bắt buộc)*
4. Vào tab **OAuth2** -> **OAuth2 URL Generator**:
   - Chọn scope: `bot`, `applications.commands`
   - Chọn Bot Permissions: `Administrator` (hoặc tối thiểu: Manage Channels, Manage Roles, Ban Members, Kick Members, View Audit Log, Manage Webhooks, Manage Server).
   - Dùng liên kết tạo ra để mời Bot vào máy chủ của bạn.

---

### 2. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example` trong thư mục bot:
```env
DISCORD_TOKEN=token_cua_bot_o_day
CLIENT_ID=application_id_cua_bot_o_day
BOT_OWNER_ID=id_discord_cua_ban
PREFIX=!
```

---

### 3. Đăng ký Slash Command & Chạy Bot
Mở terminal trong thư mục bot và chạy các lệnh sau:

```bash
# Đăng ký các lệnh gạch chéo (/) lên Discord API (chỉ cần chạy lần đầu hoặc khi sửa lệnh)
npm run deploy

# Khởi động Bot
npm start
```

---

## 🎮 Danh Sách Lệnh (Slash Commands `/`)

- `/antinuke status`: Xem tình trạng hoạt động của toàn bộ 11 lớp bảo vệ.
- `/antinuke toggle [trang_thai: True/False]`: Bật hoặc tắt hệ thống Anti-Nuke (Chỉ Server Owner).
- `/antinuke restore [trang_thai: True/False]`: Bật/tắt tự động khôi phục kênh và vai trò khi bị xoá.
- `/whitelist add [nguoi_dung]`: Thêm quản trị viên đáng tin cậy vào danh sách miễn trừ.
- `/whitelist remove [nguoi_dung]`: Xoá người dùng khỏi danh sách tin cậy.
- `/whitelist list`: Xem danh sách tất cả những người đang được miễn trừ.
- `/punishment [hinh_phat]`: Tuỳ chỉnh hình phạt khi bắt quả tang phá hoại:
  - `ban`: Cấm vĩnh viễn khỏi máy chủ.
  - `kick`: Đuổi khỏi máy chủ.
  - `strip_roles`: Tước toàn bộ vai trò (cách ly / quarantine).
- `/setlogs [kenh]`: Chọn kênh văn bản để nhận cảnh báo đỏ kèm thông tin chi tiết kẻ tấn công.
- `/backup create`: Chụp bản sao lưu (snapshot) cấu trúc kênh & vai trò hiện tại vào file JSON.
- `/backup info`: Xem thông tin bản sao lưu gần nhất.
- `/help`: Xem menu hướng dẫn chi tiết.

---

## ⚠️ 3 NGUYÊN TẮC BẮT BUỘC ĐỂ BOT PHÁT HUY HIỆU QUẢ 100%

1. **KÉO ROLE CỦA BOT LÊN CAO NHẤT**:
   - Discord áp dụng cơ chế phân cấp vai trò (Role Hierarchy).
   - Bạn cần vào: **Cài đặt máy chủ (Server Settings) -> Vai trò (Roles)** -> **Kéo Role của Anti-Nuke Bot lên phía trên tất cả các Role của Admin và Mod khác**.
   - *Nếu Role của bot thấp hơn kẻ phá hoại, bot sẽ không thể ban hay tước quyền kẻ đó!*
2. **CẤU HÌNH KÊNH LOGS**:
   - Hãy chạy `/setlogs #tên-kênh` để bot gửi cảnh báo ngay khi phát hiện hành vi khả nghi.
3. **CẤP QUYỀN WHITELIST CẨN THẬN**:
   - Chỉ thêm những người bạn thực sự tin tưởng bằng lệnh `/whitelist add`. Mọi tài khoản khác khi thực hiện thao tác nhạy cảm (xoá kênh, ban hàng loạt) sẽ bị xử phạt ngay lập tức.
