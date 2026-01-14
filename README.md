# QR Game - Đuổi Hình Bắt Chữ

Game "Nhìn hình đoán ca dao tục ngữ" với đăng nhập QR code, multiplayer real-time 5 người/phòng.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Redux Toolkit
- **Database**: MySQL 8.0+
- **ORM**: Prisma 5
- **Auth**: JWT + HTTP-only Cookies
- **Validation**: Zod

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình database

Tạo database MySQL và cập nhật file `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/qr_game"
JWT_SECRET="your-secret-key-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Chạy migration và seed data

```bash
npx prisma db push
npm run db:seed
```

### 4. Thêm hình ảnh câu hỏi

Đặt hình ảnh vào thư mục `public/images/questions/` với tên file tương ứng:
- q1.jpg, q2.jpg, q3.jpg, ...

### 5. Chạy ứng dụng

```bash
npm run dev
```

Truy cập http://localhost:3000

## Cách chơi

1. Quét QR code hoặc nhập mã QR (demo: DEMO01, DEMO02, ...)
2. Chờ đủ 5 người hoặc 60 giây
3. Xem hình và đoán ca dao/tục ngữ
4. Gửi câu trả lời và xem kết quả

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/auth/qr?code=xxx | Đăng nhập bằng QR |
| POST | /api/rooms/join | Tham gia/tạo phòng |
| GET | /api/rooms/[roomId] | Lấy thông tin phòng |
| GET | /api/game/question | Lấy câu hỏi |
| POST | /api/game/answer | Gửi câu trả lời |
| GET | /api/game/results | Lấy kết quả |

## Scripts

```bash
npm run dev          # Chạy development
npm run build        # Build production
npm run start        # Chạy production
npm run db:push      # Đẩy schema lên database
npm run db:seed      # Seed dữ liệu mẫu
npm run db:studio    # Mở Prisma Studio
```

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (auth)/qr-login/    # Trang đăng nhập QR
│   ├── (game)/
│   │   ├── lobby/          # Phòng chờ
│   │   ├── play/           # Màn chơi
│   │   └── result/         # Kết quả
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn components
│   ├── game/               # Game components
│   └── providers/          # Redux & Socket providers
├── lib/                    # Utilities
├── store/                  # Redux store
└── server/                 # Server services
```
