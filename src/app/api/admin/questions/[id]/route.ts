import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlink, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Helper để xử lý params trong Next.js 15+ (Promise) và 14 (Object)
async function getParamsId(params: any): Promise<number> {
    const resolvedParams = await params;
    return Number(resolvedParams.id);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = await getParamsId(params);

        const question = await prisma.question.findUnique({
            where: { id },
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Không tìm thấy câu hỏi' },
                { status: 404 }
            );
        }

        return NextResponse.json({ question });
    } catch (error) {
        console.error('Get Question Error:', error);
        return NextResponse.json(
            { error: 'Lỗi khi lấy câu hỏi' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = await getParamsId(params);
        const contentType = request.headers.get('content-type') || '';

        const question = await prisma.question.findUnique({
            where: { id },
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Không tìm thấy câu hỏi' },
                { status: 404 }
            );
        }

        const updateData: {
            answer?: string;
            hint?: string | null;
            category?: string | null;
            isActive?: boolean;
            imageUrl?: string;
        } = {};

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const image = formData.get('image') as File | null;
            const answer = formData.get('answer') as string;
            const hint = formData.get('hint') as string;
            const category = formData.get('category') as string;

            if (answer) updateData.answer = answer.trim();
            // Xử lý null/undefined cẩn thận hơn
            if (hint !== undefined && hint !== null) updateData.hint = hint.trim() || null;
            if (category !== undefined && category !== null) updateData.category = category.trim() || null;

            // Xử lý upload ảnh mới
            if (image && typeof image.arrayBuffer === 'function' && image.size > 0) {
                const uploadDir = path.join(process.cwd(), 'public', 'images', 'questions');
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                // --- FIX LỖI XÓA ẢNH CŨ ---
                // Cần bỏ dấu '/' ở đầu chuỗi URL để path.join hoạt động đúng
                if (question.imageUrl && question.imageUrl.startsWith('/images/questions/')) {
                    // Xóa dấu / ở đầu: "/images/..." thành "images/..."
                    const relativePath = question.imageUrl.replace(/^\//, '');
                    const oldImagePath = path.join(process.cwd(), 'public', relativePath);

                    if (existsSync(oldImagePath)) {
                        try {
                            await unlink(oldImagePath);
                        } catch (e) {
                            console.warn('Không thể xóa ảnh cũ (có thể file không tồn tại):', e);
                        }
                    }
                }

                // Lưu ảnh mới
                const timestamp = Date.now();
                const ext = image.name ? path.extname(image.name) : '.jpg';
                const filename = `q_${timestamp}${ext}`;
                const filepath = path.join(uploadDir, filename);

                const bytes = await image.arrayBuffer();
                const buffer = Buffer.from(bytes);
                await writeFile(filepath, buffer);

                updateData.imageUrl = `/images/questions/${filename}`;
            }
        } else {
            // JSON body
            const body = await request.json();
            if (body.answer !== undefined) updateData.answer = body.answer.trim();
            if (body.hint !== undefined) updateData.hint = body.hint?.trim() || null;
            if (body.category !== undefined) updateData.category = body.category?.trim() || null;
            if (body.isActive !== undefined) updateData.isActive = body.isActive;
        }

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ question: updatedQuestion });
    } catch (error) {
        console.error('Update Question Error:', error);
        return NextResponse.json(
            { error: 'Lỗi khi cập nhật câu hỏi' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = await getParamsId(params);

        const question = await prisma.question.findUnique({
            where: { id },
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Không tìm thấy câu hỏi' },
                { status: 404 }
            );
        }

        // --- FIX LỖI XÓA ẢNH ---
        if (question.imageUrl && question.imageUrl.startsWith('/images/questions/')) {
            const relativePath = question.imageUrl.replace(/^\//, '');
            const imagePath = path.join(process.cwd(), 'public', relativePath);

            if (existsSync(imagePath)) {
                try {
                    await unlink(imagePath);
                } catch (e) {
                    console.error('Error deleting image file:', e);
                }
            }
        }

        await prisma.questionAssignment.deleteMany({
            where: { questionId: id },
        });

        await prisma.question.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Question Error:', error);
        return NextResponse.json(
            { error: 'Lỗi khi xóa câu hỏi' },
            { status: 500 }
        );
    }
}