import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import Image from "next/image"; // Nhớ import cái này

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Đuổi Hình Bắt Chữ - Tết 2026",
    description: "Vui Xuân Bính Ngọ",
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

            {/* 1. HEADER ĐỎ ĐẬM */}
            <header className="fixed top-0 left-0 right-0 h-12 bg-[#990000] border-b-2 border-[#ffcc00] flex items-center justify-center z-50 shadow-md">
                <h1 className="text-[#ffcc00] font-bold uppercase text-lg tracking-wider">
                    ĐỐ VUI CÙNG LIXCO
                </h1>
            </header>

            {/* 2. MAIN CONTENT (Có padding-top để không bị header che) */}
            <main className="flex-1 w-full pt-16 pb-20 relative z-10">
                {children}
            </main>

            {/* 3. FOOTER TRANG TRÍ (Fixed dính đáy màn hình) */}
            <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none w-full grid grid-cols-3 items-end px-4 pb-2">

                {/* 1. Bên Trái (Căn trái) */}
                <div className="justify-self-start w-24 md:w-32 animate-bounce-slow">
                    <Image
                        src="/images/ele/hoa_mai_corner.png" // Lưu ý: Next.js tự hiểu public là gốc, bác bỏ ../../public đi nhé
                        alt="Bao lì xì"
                        width={150}
                        height={150}
                        className="object-contain"
                    />
                </div>

                {/* 2. Ở Giữa (Căn giữa) */}
                <div className="justify-self-center w-32 md:w-48 opacity-80 mb-2">
                    <Image
                        src="/images/ele/title_tet_2026.png"
                        alt="Tết 2026"
                        width={200}
                        height={100}
                        className="object-contain"
                    />
                </div>

                {/* 3. Bên Phải (Căn phải) */}
                <div className="justify-self-end w-28 md:w-40">
                    <Image
                        src="/images/ele/hoa_dao_corner.png"
                        alt="Hoa Tết"
                        width={200}
                        height={200}
                        className="object-contain scale-x-[-1]" // Mẹo: Lật ngược ảnh hoa đào bên phải cho đối xứng
                    />
                </div>

            </div>

        </ReduxProvider>
        </body>
        </html>
    );
}