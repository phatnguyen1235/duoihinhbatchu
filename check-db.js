const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    take: 5,
    select: { id: true, imageUrl: true, answer: true }
  });
  console.log('Questions:', JSON.stringify(questions, null, 2));
}

main().finally(() => prisma.$disconnect());
