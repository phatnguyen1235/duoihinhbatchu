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
    const image = formData.get('image') as File;
    const answer = formData.get('answer') as string;
    const hint = formData.get('hint') as string;
    const category = formData.get('category') as string;

    if (!image || !answer) {
      return NextResponse.json(
        { error: 'Thiếu hình ảnh hoặc câu trả lời' },
        { status: 400 }
      );
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'questions');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(image.name) || '.jpg';
    const filename = `q_${timestamp}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create question in database
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
    console.error('Create Question Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo câu hỏi' },
      { status: 500 }
    );
  }
}
