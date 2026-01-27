import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"; // 👈 1. Import thêm font này
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import Image from "next/image";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// 👇 2. Cấu hình font cho Câu Đối (Hỗ trợ tiếng Việt chuẩn)
const playfair = Playfair_Display({
    subsets: ["vietnamese"],
    weight: ["700"], // Dùng nét đậm cho rõ
});

// src/app/layout.tsx

export const metadata: Metadata = {
    title: "Đuổi Hình Bắt Chữ - Tết 2026",
    description: "Vui Xuân Bính Ngọ",
    icons: {
        // 1. Icon chính cho trình duyệt (Chrome trên Lenovo ưu tiên cái này)
        // Thêm type và sizes="any" để nó hiểu đây là Vector
        icon: [
            { url: '/logo/lixco-logo-1.svg', type: 'image/svg+xml', sizes: 'any' }
        ],

        // 2. Shortcut (cho các trình duyệt cũ hơn)
        shortcut: '/logo/lixco-logo-1.svg',

        // 3. Apple Touch Icon (Cho iPad/iPhone - giữ nguyên)
        apple: '/logo/lixco-logo-1.svg',

        // 4. (Quan trọng cho Android) Khai báo thêm mục 'other' này để ép nó nhận
        other: [
            {
                rel: 'icon',
                type: 'image/svg+xml',
                url: '/logo/lixco-logo-1.svg',
            },
        ],
    },
    // Thêm dòng này để khi "Add to Home Screen" trên Android nó hiện tên app đẹp hơn

};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-tet-pattern min-h-screen flex flex-col`}
        >
        <ReduxProvider>
            {/* 1. HEADER */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-[#990000] border-b-4 border-[#ffcc00] flex items-center justify-center z-50 shadow-lg">
                <h1 className="text-[#ffcc00] font-bold uppercase text-xl tracking-widest drop-shadow-md">
                    ĐỐ VUI CÙNG LIXCO
                </h1>
            </header>

            {/* ========================================================= */}
            {/* 👇 CÂU ĐỐI (Đã thay font Playfair Display bao đẹp) */}
            {/* ========================================================= */}

            {/* --- TRÁI: CHÚC TẾT ĐẾN TRĂM ĐIỀU NHƯ Ý --- */}
            <div className="fixed top-20 left-2 lg:left-8 z-0 hidden md:flex flex-col items-center animate-swing origin-top">
                <div className="h-8 w-1 bg-[#ffcc00]"></div>
                <div className="h-3 w-3 rounded-full bg-[#ffcc00] -mt-1"></div>

                <div className="bg-[#b91c1c] border-2 border-[#ffcc00] px-3 py-4 rounded-b-lg shadow-2xl mt-1">
                    {/* 👇 3. Áp dụng font playfair.className vào đây */}
                    <div className={`flex flex-col gap-3 text-[#ffcc00] text-sm lg:text-lg text-center border border-[#ffcc00]/30 p-2 ${playfair.className}`}>
                        <span className="whitespace-nowrap font-bold">CHÚC</span>
                        <span className="whitespace-nowrap font-bold">TẾT</span>
                        <span className="whitespace-nowrap font-bold">ĐẾN</span>
                        <span className="whitespace-nowrap font-bold">TRĂM</span>
                        <span className="whitespace-nowrap font-bold">ĐIỀU</span>
                        <span className="whitespace-nowrap font-bold">NHƯ</span>
                        <span className="whitespace-nowrap font-bold">Ý</span>
                    </div>
                </div>

                <div className="flex flex-col items-center -mt-1">
                    <div className="w-10 lg:w-14 h-4 bg-[#ffcc00] rounded-b-xl"></div>
                    <div className="w-6 lg:w-8 h-12 lg:h-16 bg-red-600 rounded-b-full opacity-90 blur-[1px]"></div>
                </div>
            </div>

            {/* --- PHẢI: MỪNG XUÂN SANG VẠN SỰ THÀNH CÔNG --- */}
            <div
                className="fixed top-20 right-2 lg:right-8 z-0 hidden md:flex flex-col items-center animate-swing origin-top"
                style={{ animationDelay: "1s" }}
            >
                <div className="h-8 w-1 bg-[#ffcc00]"></div>
                <div className="h-3 w-3 rounded-full bg-[#ffcc00] -mt-1"></div>

                <div className="bg-[#b91c1c] border-2 border-[#ffcc00] px-3 py-4 rounded-b-lg shadow-2xl mt-1">
                    {/* 👇 Áp dụng font playfair.className */}
                    <div className={`flex flex-col gap-3 text-[#ffcc00] text-sm lg:text-lg text-center border border-[#ffcc00]/30 p-2 ${playfair.className}`}>
                        <span className="whitespace-nowrap font-bold">MỪNG</span>
                        <span className="whitespace-nowrap font-bold">XUÂN</span>
                        <span className="whitespace-nowrap font-bold">SANG</span>
                        <span className="whitespace-nowrap font-bold">VẠN</span>
                        <span className="whitespace-nowrap font-bold">SỰ</span>
                        <span className="whitespace-nowrap font-bold">THÀNH</span>
                        <span className="whitespace-nowrap font-bold">CÔNG</span>
                    </div>
                </div>

                <div className="flex flex-col items-center -mt-1">
                    <div className="w-10 lg:w-14 h-4 bg-[#ffcc00] rounded-b-xl"></div>
                    <div className="w-6 lg:w-8 h-12 lg:h-16 bg-red-600 rounded-b-full opacity-90 blur-[1px]"></div>
                </div>
            </div>
            {/* ========================================================= */}

            {/* 2. MAIN CONTENT */}
            <main className="flex-1 w-full pt-20 pb-20 relative z-10 flex flex-col items-center">
                {children}
            </main>

            {/* 3. FOOTER TRANG TRÍ */}
            <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none w-full grid grid-cols-3 items-end px-4 pb-2">
                <div className="justify-self-start w-24 md:w-32 animate-bounce-slow">
                    <Image
                        src="/images/ele/hoa_mai_corner.png"
                        alt="Bao lì xì"
                        width={150}
                        height={150}
                        className="object-contain"
                    />
                </div>

                <div className="justify-self-center w-32 md:w-48 opacity-80 mb-2">
                    <Image
                        src="/images/ele/title_tet_2026.png"
                        alt="Tết 2026"
                        width={200}
                        height={100}
                        className="object-contain"
                    />
                </div>

                <div className="justify-self-end w-28 md:w-40">
                    <Image
                        src="/images/ele/hoa_dao_corner.png"
                        alt="Hoa Tết"
                        width={200}
                        height={200}
                        className="object-contain scale-x-[-1]"
                    />
                </div>
            </div>
        </ReduxProvider>
        </body>
        </html>
    );
}