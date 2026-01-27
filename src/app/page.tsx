'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Image from 'next/image';
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
        <main className="min-h-screen from-blue-50 to-white flex items-center justify-center p-4">

            {/* 👇 SỬA 1: max-w-md -> md:max-w-3xl (Trên tablet khung sẽ to ra gấp đôi) */}
            <Card className="w-full max-w-md md:max-w-3xl shadow-2xl border-4 border-[#ffcc00] bg-white transform transition-all">
                <CardHeader className="text-center pb-2">

                    <CardTitle className="flex items-center justify-center gap-2 md:gap-8 py-6">
                        {/* 🧧 Bao lì xì TRÁI */}
                        <span className="text-3xl md:text-5xl animate-bounce-slow pt-4">🧧</span>

                        {/* 👇 THAY KHỐI CHỮ CŨ BẰNG ẢNH NÀY */}
                        <div className="relative w-72 h-32 md:w-[500px] md:h-48 hover:scale-105 transition-transform duration-300 ease-in-out">
                            <Image
                                src="/images/ele/title_duoi_hinh_bat_chu.png"
                                alt="Đuổi Hình Bắt Chữ"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>

                        {/* 🧧 Bao lì xì PHẢI */}
                        <span className="text-3xl md:text-5xl animate-bounce-slow scale-x-[-1] pt-4">🧧</span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 md:space-y-10"> {/* Tăng khoảng cách các phần */}

                    {/* Phần LƯU Ý QUAN TRỌNG */}
                    <div className="border-2 border-dashed border-[#b91c1c] rounded-xl p-4 md:p-8 bg-[#fff5f5] text-left">
                        {/* Tiêu đề lưu ý to lên */}
                        <h3 className="font-bold text-[#b91c1c] mb-3 md:mb-5 uppercase text-sm md:text-xl tracking-wide">
                            Lưu ý quan trọng:
                        </h3>
                        {/* List text to lên: text-sm -> md:text-xl */}
                        <ul className="space-y-3 md:space-y-5 text-sm md:text-xl text-gray-800 leading-relaxed">
                            <li className="flex items-start gap-2 md:gap-4">
                                <span className="text-lg md:text-2xl leading-none">🌸</span>
                                <span>
                                  Mỗi người chỉ có <strong>01 cơ hội</strong> duy nhất. Hãy nhìn thật kỹ các ký tự, icon,...và gõ câu trả lời cẩn thận đầy đủ dấu câu.
                                </span>
                            </li>
                            <li className="flex items-start gap-2 md:gap-4">
                                <span className="text-lg md:text-2xl leading-none">🌸</span>
                                <span>
                                  Mỗi người sẽ trả lời <strong>3 câu</strong>, hoàn thành <strong>2/3 câu</strong> sẽ vượt qua trò chơi.
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Thông báo lỗi */}
                    {error && (
                        <div
                            className="bg-red-100 border border-red-200 text-red-600 p-3 md:p-4 rounded-lg text-sm md:text-lg text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    {/* Nút Bắt Đầu: text-xl -> md:text-3xl, py-8 -> md:py-10 */}
                    <Button
                        className="w-full bg-[#ffcc00] hover:bg-[#ffdb4d] text-[#cc0000] font-extrabold text-xl md:text-4xl py-8 md:py-12 shadow-lg uppercase tracking-wider transition-all hover:scale-[1.02] border-b-4 border-[#e6b800] active:border-b-0 active:translate-y-1 rounded-2xl"
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
                                className="text-gray-400 hover:text-[#d32f2f] hover:bg-red-50 text-xs md:text-lg font-normal"
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