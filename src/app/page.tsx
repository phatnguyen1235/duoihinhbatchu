import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-600">
            Đuổi Hình Bắt Chữ
          </CardTitle>
          <p className="text-gray-500 mt-2">
            Nhìn hình đoán ca dao tục ngữ Việt Nam
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-sm text-gray-600">
              Quét mã Barcode để tham gia game
              <br />
              hoặc nhập mã thủ công
            </p>
          </div>

          <Link href="/qr-login">
            <Button className="w-full" size="lg">
              Quét / Nhập mã
            </Button>
          </Link>

          <div className="text-center text-sm text-gray-400">
            Multiplayer • 5 người/phòng • Real-time
          </div>

          <div className="border-t pt-4">
            <Link href="/admin/questions">
              <Button variant="outline" className="w-full" size="sm">
                Quản lý câu hỏi
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
