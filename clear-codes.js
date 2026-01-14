const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:RfUvnciEkDMqehQAbEaAEGfQXJEzgCvD@switchback.proxy.rlwy.net:12711/railway'
    }
  }
});

async function clearCodes() {
  // Delete in order due to foreign keys
  const assignments = await prisma.questionAssignment.deleteMany({});
  console.log('Deleted', assignments.count, 'assignments');

  const roomPlayers = await prisma.roomPlayer.deleteMany({});
  console.log('Deleted', roomPlayers.count, 'room players');

  const rooms = await prisma.room.deleteMany({});
  console.log('Deleted', rooms.count, 'rooms');

  const sessions = await prisma.session.deleteMany({});
  console.log('Deleted', sessions.count, 'sessions');
  
  const codes = await prisma.qrCode.deleteMany({});
  console.log('Deleted', codes.count, 'QR codes');
  
  await prisma.$disconnect();
  console.log('Done!');
}

clearCodes();
