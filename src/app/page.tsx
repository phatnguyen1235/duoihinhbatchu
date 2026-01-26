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
    <main className="min-h-screen  from-blue-50 to-white flex items-center justify-center p-4">

        <Card className="w-full max-w-md shadow-2xl border-4 border-[#ffcc00] bg-white">
            <CardHeader className="text-center pb-2">
                {/* Tiêu đề giữ nguyên nhưng đổi màu đỏ */}
                <CardTitle className="text-3xl font-bold text-[#d32f2f] uppercase drop-shadow-sm">
                    Đuổi Hình Bắt Chữ
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Phần LƯU Ý QUAN TRỌNG (Mới thêm) */}
                <div className="border-2 border-dashed border-[#b91c1c] rounded-xl p-4 bg-[#fff5f5] text-left">
                    <h3 className="font-bold text-[#b91c1c] mb-3 uppercase text-sm tracking-wide">
                        Lưu ý quan trọng:
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-800">
                        <li className="flex items-start gap-2">
                            <span className="text-lg leading-none">🌸</span>
                            <span>
            Mỗi người chỉ có <strong>01 cơ hội</strong> duy nhất. Hãy đọc thật kỹ câu hỏi và trả lời cẩn thận.
          </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-lg leading-none">🌸</span>
                            <span>
            Nếu trả lời sai, bạn sẽ phải thực hiện <strong>THỬ THÁCH</strong> từ Ban tổ chức mới được đóng dấu hoàn thành!
          </span>
                        </li>
                    </ul>
                </div>

                {/* Thông báo lỗi (Giữ nguyên logic) */}
                {error && (
                    <div className="bg-red-100 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium animate-pulse">
                        {error}
                    </div>
                )}

                {/* Nút Bắt Đầu (Style Tết: Nền vàng, chữ đỏ) */}
                <Button
                    className="w-full bg-[#ffcc00] hover:bg-[#ffdb4d] text-[#cc0000] font-extrabold text-xl py-8 shadow-lg uppercase tracking-wider transition-all hover:scale-[1.02] border-b-4 border-[#e6b800] active:border-b-0 active:translate-y-1"
                    size="lg"
                    onClick={handleStartGame}
                    disabled={loading}
                >
                    {loading ? 'Đang tải...' : 'BẮT ĐẦU THI'}
                </Button>
                <div className="pt-2 text-center">
                    <Link href="/admin/questions">
                        <Button
                            variant="ghost"
                            className="text-gray-400 hover:text-[#d32f2f] hover:bg-red-50 text-xs font-normal"
                            size="sm"
                        >
                            ⚙️ Quản lý câu hỏi
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    </main>
  );
}
