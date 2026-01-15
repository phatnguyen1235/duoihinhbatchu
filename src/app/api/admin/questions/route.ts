import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// 1. Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
    try {
        const questions = await prisma.question.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Get Questions Error:', error);
        return NextResponse.json(
            { error: 'Lỗi khi lấy danh sách câu hỏi' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File | null;
        const answer = formData.get('answer') as string;
        const hint = formData.get('hint') as string;
        const category = formData.get('category') as string;

        // Validate dữ liệu
        if (!answer) {
            return NextResponse.json(
                { error: 'Thiếu câu trả lời' },
                { status: 400 }
            );
        }

        if (!image || typeof image.arrayBuffer !== 'function') {
            return NextResponse.json(
                { error: 'File ảnh không hợp lệ hoặc bị thiếu' },
                { status: 400 }
            );
        }

        // --- BẮT ĐẦU UPLOAD LÊN CLOUDINARY ---
        // Chuyển File thành Buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload stream lên Cloudinary
        const uploadResult: any = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'qr-game-questions', // Gom hết vào thư mục này cho gọn
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });
        // -------------------------------------

        // Lưu vào DB (Lưu link Cloudinary thay vì đường dẫn local)
        const question = await prisma.question.create({
            data: {
                imageUrl: uploadResult.secure_url, // Link ảnh trên mạng
                answer: answer.trim(),
                hint: hint?.trim() || null,
                category: category?.trim() || null,
                isActive: true,
            },
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        console.error('Create Question Error Details:', error);
        return NextResponse.json(
            { error: 'Lỗi khi tạo câu hỏi: ' + (error as any).message },
            { status: 500 }
        );
    }
}