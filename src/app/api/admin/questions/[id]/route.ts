import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlink, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const { id } = await params;
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
      // Handle FormData with image upload
      const formData = await request.formData();
      const image = formData.get('image') as File | null;
      const answer = formData.get('answer') as string;
      const hint = formData.get('hint') as string;
      const category = formData.get('category') as string;

      if (answer) updateData.answer = answer.trim();
      if (hint !== null) updateData.hint = hint?.trim() || null;
      if (category !== null) updateData.category = category?.trim() || null;

      // Handle new image upload
      if (image && image.size > 0) {
        // Create upload directory if not exists
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'questions');
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Delete old image
        if (question.imageUrl.startsWith('/images/questions/')) {
          const oldImagePath = path.join(process.cwd(), 'public', question.imageUrl);
          if (existsSync(oldImagePath)) {
            try {
              await unlink(oldImagePath);
            } catch (e) {
              console.error('Error deleting old image:', e);
            }
          }
        }

        // Save new image
        const timestamp = Date.now();
        const ext = path.extname(image.name) || '.jpg';
        const filename = `q_${timestamp}${ext}`;
        const filepath = path.join(uploadDir, filename);

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        updateData.imageUrl = `/images/questions/${filename}`;
      }
    } else {
      // Handle JSON body
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
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Không tìm thấy câu hỏi' },
        { status: 404 }
      );
    }

    // Delete image file if exists
    if (question.imageUrl.startsWith('/images/questions/')) {
      const imagePath = path.join(process.cwd(), 'public', question.imageUrl);
      if (existsSync(imagePath)) {
        try {
          await unlink(imagePath);
        } catch (e) {
          console.error('Error deleting image:', e);
        }
      }
    }

    // Delete related assignments first
    await prisma.questionAssignment.deleteMany({
      where: { questionId: id },
    });

    // Delete question
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
