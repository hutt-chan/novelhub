# Novel Web Project

Một website đọc tiểu thuyết trực tuyến với đầy đủ chức năng quản lý truyện, chương, người dùng và tương tác như bookmark, favorite, comment, history…  

## Giới thiệu
Website này cho phép:
- Người dùng duyệt truyện, xem chi tiết chương, bookmark, đánh dấu yêu thích.
- Người quản trị (admin) thêm, sửa, xóa truyện, quản lý thể loại và chương.
- Theo dõi lịch sử đọc truyện và nhận thông báo mới.
- Tìm kiếm truyện theo tên, tác giả, thể loại.

## Công nghệ sử dụng
- **Backend:** Node.js, Express.js  
- **Database:** MySQL  
- **Middleware:** JWT authentication, CORS, dotenv  
- **Các thư viện khác:** mysql2, bcrypt, jsonwebtoken, cors, express

## Cài đặt và chạy dự án

1. Clone repo:
git clone https://github.com/hutt-chan/novelhub.git
cd novel-web-master/backend
2. Cài dependencies:
npm install
3. Tạo file .env ở thư mục backend với nội dung:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456789
DB_NAME=novel_db
JWT_SECRET=your_secret_key
4. Khởi động server:
node server.js
Server sẽ chạy tại: http://localhost:3000

## Cấu trúc API chính
| Method | Endpoint                         | Mô tả                           |
| ------ | -------------------------------- | ------------------------------- |
| GET    | `/api/novels`                    | Lấy danh sách tất cả truyện     |
| GET    | `/api/novels/:novel_id/chapters` | Lấy danh sách chương của truyện |
| GET    | `/api/novels/top-favorites`      | Lấy top 3 truyện được yêu thích |
| POST   | `/api/novels`                    | Thêm truyện (admin)             |
| PUT    | `/api/novels/:id`                | Cập nhật truyện (admin)         |
| DELETE | `/api/novels/:id`                | Xóa truyện (admin)              |
| POST   | `/api/auth/register`             | Đăng ký người dùng              |
| POST   | `/api/auth/login`                | Đăng nhập                       |
| GET    | `/api/users`                     | Quản lý người dùng (admin)      |
Toàn bộ API yêu cầu header Authorization: Bearer <token> với một số route admin.

## Chức năng nổi bật
- Tìm kiếm truyện theo tên, tác giả, thể loại.
- Bookmark & favorite truyện.
- Quản lý chương, thể loại, truyện cho admin.
- Comment và lưu lịch sử đọc.
- Thông báo cho người dùng khi có truyện mới hoặc cập nhật.

## License
Project này thuộc mục đích học tập. Không chịu trách nhiệm pháp lý cho việc sử dụng thương mại.
