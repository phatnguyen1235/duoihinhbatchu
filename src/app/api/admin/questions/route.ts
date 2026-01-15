import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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
        const image = formData.get('image') as File | null; // Cho phép null để check
        const answer = formData.get('answer') as string;
        const hint = formData.get('hint') as string;
        const category = formData.get('category') as string;

        // 1. Validate dữ liệu đầu vào kỹ hơn
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

        // 2. Tạo đường dẫn an toàn
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'questions');

        // Tạo thư mục nếu chưa có
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // 3. Tạo tên file unique
        const timestamp = Date.now();
        // Lấy đuôi file an toàn, mặc định là .jpg nếu không có tên
        const ext = image.name ? path.extname(image.name) : '.jpg';
        const filename = `q_${timestamp}${ext}`;
        const filepath = path.join(uploadDir, filename);

        // 4. Lưu file
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // 5. Lưu DB
        const question = await prisma.question.create({
            data: {
                imageUrl: `/images/questions/${filename}`,
                answer: answer.trim(),
                hint: hint?.trim() || null,
                category: category?.trim() || null,
                isActive: true,
            },
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        // Log lỗi chi tiết ra terminal để debug
        console.error('Create Question Error Details:', error);
        return NextResponse.json(
            { error: 'Lỗi khi tạo câu hỏi (Xem terminal để biết chi tiết)' },
            { status: 500 }
        );
    }
}