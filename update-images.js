const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const placeholderUrl = 'https://placehold.co/400x300/png?text=Cau+hoi';
  const result = await prisma.question.updateMany({
    data: { imageUrl: placeholderUrl }
  });
  console.log('Updated', result.count, 'questions to placeholder');
}

main().finally(() => prisma.$disconnect());
