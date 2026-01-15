'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/play');
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

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
              Bấm nút bên dưới để bắt đầu chơi
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleStartGame}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Tham Gia'}
          </Button>

          <div className="text-center text-sm text-gray-400">
            5 câu hỏi • Trả lời nhanh • Ghi điểm cao
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
