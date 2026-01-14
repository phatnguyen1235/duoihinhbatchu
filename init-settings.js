const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:RfUvnciEkDMqehQAbEaAEGfQXJEzgCvD@switchback.proxy.rlwy.net:12711/railway'
    }
  }
});

async function init() {
  // Create default game settings
  const settings = await prisma.gameSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      questionTime: 30,
      waitingTime: 60,
      totalRounds: 5,
    },
  });
  console.log('Settings:', settings);

  // Check questions
  const questions = await prisma.question.count();
  console.log('Questions count:', questions);

  await prisma.$disconnect();
}

init();
