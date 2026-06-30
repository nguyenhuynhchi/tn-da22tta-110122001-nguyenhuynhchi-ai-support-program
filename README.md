# AI Support Program for Moodle

## Giới thiệu

AI Support Program for Moodle là hệ thống hỗ trợ học tập được tích hợp vào nền tảng Moodle nhằm hỗ trợ sinh viên trong quá trình thực hành lập trình. Hệ thống cung cấp các chức năng như phân tích mã nguồn, gợi ý hướng dẫn thực hiện bài tập và hỗ trợ hỏi đáp thông qua chatbot AI, giúp nâng cao hiệu quả học tập và khả năng tự giải quyết vấn đề của người học.

---

## Mục tiêu

* Tích hợp chatbot AI trực tiếp vào Moodle.
* Hỗ trợ sinh viên phân tích bài làm và phát hiện lỗi.
* Cung cấp hướng dẫn thực hiện bài tập theo từng bước.
* Hỗ trợ hỏi đáp liên quan đến bài tập lập trình.
* Tăng khả năng tự học và giảm thời gian hỗ trợ từ giảng viên.

---

## Kiến trúc hệ thống

Hệ thống được xây dựng theo mô hình gồm các thành phần:

### Moodle

* Quản lý khóa học, bài tập và người dùng.
* Tích hợp giao diện chatbot vào trang bài tập lập trình.

### Backend AI Service

* Xử lý yêu cầu từ Moodle.
* Quản lý hội thoại và ngữ cảnh trao đổi.
* Kết nối mô hình AI để sinh phản hồi.

### Database

* Moodle Database (MySQL): lưu trữ dữ liệu khóa học, bài tập và người dùng.
* Chat Memory Database (PostgreSQL): lưu trữ lịch sử hội thoại phục vụ duy trì ngữ cảnh.

### Docker Environment

* Triển khai Backend AI Service và các dịch vụ liên quan bằng Docker Compose.

---

## Phần mềm cần thiết

Trước khi triển khai hệ thống, cần cài đặt:

* XAMPP
* Docker Desktop
* Git (khuyến nghị)

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

### Bước 4: Khởi động Backend và các dịch vụ AI

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

## Truy cập hệ thống

Sau khi hoàn tất triển khai:

### Moodle

```text
http://localhost/moodle
```

### Backend API

```text
http://localhost:8080
```

(Tùy theo cấu hình Docker Compose của dự án)

---

## Dừng hệ thống

Tại thư mục `src_BE_FE`, chạy:

```bash
docker compose down
```

Lệnh trên sẽ dừng toàn bộ container của hệ thống.

---

## Tác giả

Khóa luận tốt nghiệp: Tích hợp Chatbot AI hỗ trợ thực hành lập trình trên nền tảng Moodle.
