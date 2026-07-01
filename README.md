# XÂY DỰNG CHATBOT HỖ TRỢ GIẢI BÀI TẬP LẬP TRÌNH VÀ GỢI Ý LỖI SAI CHO SINH VIÊN NGÀNH CÔNG NGHỆ THÔNG TIN

## Giới thiệu

CHATBOT HỖ TRỢ GIẢI BÀI TẬP LẬP TRÌNH VÀ GỢI Ý LỖI SAI CHO SINH VIÊN NGÀNH CÔNG NGHỆ THÔNG TIN là hệ thống hỗ trợ học tập được tích hợp với nền tảng Moodle nhằm hỗ trợ sinh viên trong quá trình thực hành lập trình. Hệ thống cung cấp các chức năng như phân tích mã nguồn, gợi ý hướng dẫn thực hiện bài tập và hỗ trợ hỏi đáp thông qua chatbot AI, giúp nâng cao hiệu quả học tập và khả năng tự giải quyết vấn đề của người học.

---

## Mục tiêu

* Tích hợp AI API Key vào hệ thống 
* Thiết kế backend làm trung gian giữa Moodle và mô hình AI.
* Cung cấp hướng dẫn thực hiện bài tập theo từng bước.
* Hỗ trợ sinh viên phân tích bài làm và phát hiện lỗi.
* Hỗ trợ hỏi đáp liên quan đến bài tập lập trình.
* Tăng khả năng tự học và giảm thời gian hỗ trợ từ giảng viên.

---

## Kiến trúc hệ thống

Hệ thống được xây dựng theo mô hình gồm các thành phần:

### Moodle

* Quản lý khóa học, bài tập và người dùng.
* Mở rộng giao diện bài tập Moodle để thêm nút chuyển hướng đến trang chức năng.

### Backend AI Service

* Xử lý yêu cầu từ giao diện chức năng.
* Tương tác với hệ thống Moodle để lấy dữ liệu thông qua Web Service API.
* Xử lý lọc và chuẩn hóa dữ liệu nhận được từ Moodle phục vụ xây dựng prompt chức năng.  
* Xây dựng prompt và gửi đến mô hình AI để sinh phản hồi.
* Quản lý hội thoại và ngữ cảnh trao đổi.

### Database

* MySQL: được thiết kế sẳn của hệ thống Moodle lưu trữ dữ liệu khóa học, bài tập và người dùng.
* MongoDB: Lưu trữ phản hồi của AI (nội dung gợi ý, kết quả phân tích) và quản lý các cuộc hội thoại giữa sinh viên và AI.
* PostgreSQL: lưu trữ lịch sử hội thoại phục vụ duy trì ngữ cảnh (Chatmemory).

### Docker Environment

* Dockerize hệ thống backend, frontend và các cơ sở dữ liệu cần thiết bằng Docker Compose.

---

## Phần mềm cần thiết

Trước khi triển khai hệ thống, cần cài đặt:

* XAMPP
* Docker Desktop

---

## Hướng dẫn triển khai

### Bước 1: Triển khai Moodle

1. Truy cập thư mục `src`.
2. Sao chép thư mục `moodle`.
3. Dán thư mục vừa sao chép vào:

```text
xampp/htdocs/
```

Kết quả:

```text
xampp/
└── htdocs/
    └── moodle/
```

---

### Bước 2: Khởi động XAMPP

Mở XAMPP Control Panel và khởi động hai dịch vụ:

* Apache
* MySQL

---

### Bước 3: Khôi phục cơ sở dữ liệu Moodle

1. Mở giao diện quản trị MySQL (phpMyAdmin).
2. Tạo cơ sở dữ liệu mới với tên:

```sql
moodle
```

3. Chọn cơ sở dữ liệu vừa tạo.
4. Chọn tab **Import (Nhập)**.
5. Chọn tệp:

```text
moodle.sql
```

6. Thực hiện Import để khôi phục dữ liệu Moodle.

---

### Bước 4: Khởi động hệ thống (Backend, Frontend, MongoDB và PostgreSQL)

1. Mở Docker Desktop.
2. Mở Command Prompt hoặc PowerShell.
3. Di chuyển đến thư mục:

```text
src_BE_FE
```

4. Chạy lệnh:

```bash
docker compose up -d --build
```

Docker sẽ tự động build và khởi động các container cần thiết.

---

## Truy cập và sử dụng hệ thống

### Truy cập vào hệ thống Moodle

```text
http://localhost/moodle
```

### Đăng nhập vào hệ thống

Sử dụng tài khoản sinh viên đã được cấu hình sẵn:

```text
Tên tài khoản: student-test-01
Mật khẩu: Student@123
```

### Truy cập khóa học

1. Sau khi đăng nhập thành công, chọn một khóa học đã được tạo sẵn trong hệ thống.
2. Trong khóa học, chọn một bài tập lập trình để thực hiện.

### Truy cập các chức năng hỗ trợ AI

Tại trang bài tập lập trình, hệ thống sẽ hiển thị các nút chức năng hỗ trợ AI. Sinh viên có thể lựa chọn một trong các chức năng sau:

#### Chatbot gợi ý và hỏi đáp

Cho phép sinh viên:

* Nhận gợi ý từng bước để thực hiện bài tập.
* Đặt câu hỏi liên quan đến yêu cầu đề bài.
* Trao đổi với AI trong suốt quá trình thực hiện bài tập.

#### Phân tích và sửa lỗi

Cho phép sinh viên:

* Tải lên bài làm hoặc mã nguồn cần phân tích.
* Nhận kết quả phân tích từ AI.
* Xem các lỗi được phát hiện trong bài làm.
* Nhận các gợi ý cải thiện và chỉnh sửa mã nguồn.
* Tiếp tục trao đổi với AI về kết quả phân tích.


