import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// 1. Config Cloudinary (Bắt buộc phải có đoạn này)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper lấy ID từ URL ảnh để xóa trên Cloud
const getPublicIdFromUrl = (url: string) => {
    try {
        const parts = url.split('/');
        const filename = parts.pop()?.split('.')[0];
        const folder = parts.pop();
        return folder && filename ? `${folder}/${filename}` : null;
    } catch (e) {
        return null;
    }
};

async function getParamsId(params: any): Promise<number> {
    const resolvedParams = await params;
    return Number(resolvedParams.id);
}

// GET: Lấy chi tiết câu hỏi
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = await getParamsId(params);
        const question = await prisma.question.findUnique({ where: { id } });

        if (!question) {
            return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        }
        return NextResponse.json({ question });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

// PUT: Cập nhật câu hỏi (Logic Upload Cloudinary nằm ở đây)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = await getParamsId(params);
        const contentType = request.headers.get('content-type') || '';

        const oldQuestion = await prisma.question.findUnique({ where: { id } });
        if (!oldQuestion) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updateData: any = {};

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const image = formData.get('image') as File | null;
            const answer = formData.get('answer') as string;
            const hint = formData.get('hint') as string;
            const category = formData.get('category') as string;

            if (answer) updateData.answer = answer.trim();
            if (hint !== undefined) updateData.hint = hint?.trim() || null;
            if (category !== undefined) updateData.category = category?.trim() || null;

            // --- KHÚC QUAN TRỌNG: UPLOAD CLOUDINARY ---
            if (image && image.size > 0) {
                // 1. Xóa ảnh cũ trên Cloud (nếu có) cho sạch rác
                if (oldQuestion.imageUrl && oldQuestion.imageUrl.includes('cloudinary')) {
                    const publicId = getPublicIdFromUrl(oldQuestion.imageUrl);
                    if (publicId) await cloudinary.uploader.destroy(publicId);
                }

                // 2. Upload ảnh mới lên Cloudinary (thay vì ổ cứng)
                const bytes = await image.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const uploadResult: any = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'qr-game-questions', resource_type: 'image' },
                        (error, result) => error ? reject(error) : resolve(result)
                    ).end(buffer);
                });

                // 3. Lấy link từ Cloud lưu vào DB
                updateData.imageUrl = uploadResult.secure_url;
            }
            // ------------------------------------------
        } else {
            // Xử lý JSON body thường
            const body = await request.json();
            if (body.answer) updateData.answer = body.answer;
            if (body.isActive !== undefined) updateData.isActive = body.isActive;
            if (body.hint !== undefined) updateData.hint = body.hint;
            if (body.category !== undefined) updateData.category = body.category;
        }

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ question: updatedQuestion });
    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: 'Lỗi cập nhật: ' + (error as any).message }, { status: 500 });
    }
}

// DELETE: Xóa câu hỏi (Xóa luôn ảnh trên Cloud)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = await getParamsId(params);
        const question = await prisma.question.findUnique({ where: { id } });

        // Xóa ảnh trên Cloudinary nếu có
        if (question && question.imageUrl.includes('cloudinary')) {
            const publicId = getPublicIdFromUrl(question.imageUrl);
            if (publicId) await cloudinary.uploader.destroy(publicId);
        }

        await prisma.questionAssignment.deleteMany({ where: { questionId: id } });
        await prisma.question.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi xóa' }, { status: 500 });
    }
}