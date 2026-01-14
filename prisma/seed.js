const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const questions = [
  {
    imageUrl: '/images/questions/q1.jpg',
    answer: 'Ăn quả nhớ kẻ trồng cây',
    hint: 'Lòng biết ơn',
    category: 'Ca dao',
  },
  {
    imageUrl: '/images/questions/q2.jpg',
    answer: 'Có công mài sắt có ngày nên kim',
    hint: 'Kiên trì',
    category: 'Tục ngữ',
  },
  {
    imageUrl: '/images/questions/q3.jpg',
    answer: 'Đường đi khó không khó vì ngăn sông cách núi',
    hint: 'Ý chí',
    category: 'Ca dao',
  },
  {
    imageUrl: '/images/questions/q4.jpg',
    answer: 'Gần mực thì đen gần đèn thì sáng',
    hint: 'Môi trường',
    category: 'Tục ngữ',
  },
  {
    imageUrl: '/images/questions/q5.jpg',
    answer: 'Lá lành đùm lá rách',
    hint: 'Đoàn kết',
    category: 'Tục ngữ',
  },
  {
    imageUrl: '/images/questions/q6.jpg',
    answer: 'Một cây làm chẳng nên non',
    hint: 'Đoàn kết',
    category: 'Ca dao',
  },
  {
    imageUrl: '/images/questions/q7.jpg',
    answer: 'Uống nước nhớ nguồn',
    hint: 'Lòng biết ơn',
    category: 'Tục ngữ',
  },
  {
    imageUrl: '/images/questions/q8.jpg',
    answer: 'Tốt gỗ hơn tốt nước sơn',
    hint: 'Nội dung quan trọng hơn hình thức',
    category: 'Tục ngữ',
  },
  {
    imageUrl: '/images/questions/q9.jpg',
    answer: 'Học ăn học nói học gói học mở',
    hint: 'Học hỏi',
    category: 'Tục ngữ',
  },
  {
    imageUrl: '/images/questions/q10.jpg',
    answer: 'Công cha như núi Thái Sơn',
    hint: 'Cha mẹ',
    category: 'Ca dao',
  },
];

const qrCodes = [
  { code: 'QR001', maxPlays: 1 },
  { code: 'QR002', maxPlays: 1 },
  { code: 'QR003', maxPlays: 1 },
  { code: 'QR004', maxPlays: 1 },
  { code: 'QR005', maxPlays: 1 },
  { code: 'DEMO01', maxPlays: 1 },
  { code: 'DEMO02', maxPlays: 1 },
  { code: 'DEMO03', maxPlays: 1 },
  { code: 'DEMO04', maxPlays: 1 },
  { code: 'DEMO05', maxPlays: 1 },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.questionAssignment.deleteMany();
  await prisma.roomPlayer.deleteMany();
  await prisma.room.deleteMany();
  await prisma.session.deleteMany();
  await prisma.question.deleteMany();
  await prisma.qrCode.deleteMany();

  // Seed questions
  for (const q of questions) {
    await prisma.question.create({
      data: q,
    });
  }
  console.log(`Created ${questions.length} questions`);

  // Seed QR codes
  for (const qr of qrCodes) {
    await prisma.qrCode.create({
      data: qr,
    });
  }
  console.log(`Created ${qrCodes.length} QR codes`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
