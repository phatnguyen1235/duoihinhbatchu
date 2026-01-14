const { PrismaClient } = require('@prisma/client');

// Local database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:root@localhost:3306/qr_game'
    }
  }
});

// Remote database
const remotePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:RfUvnciEkDMqehQAbEaAEGfQXJEzgCvD@switchback.proxy.rlwy.net:12711/railway'
    }
  }
});

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Migrate GameSettings
    console.log('Migrating GameSettings...');
    const settings = await localPrisma.gameSettings.findMany();
    for (const item of settings) {
      await remotePrisma.gameSettings.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`  - ${settings.length} settings migrated`);

    // Migrate QrCodes
    console.log('Migrating QrCodes...');
    const qrCodes = await localPrisma.qrCode.findMany();
    for (const item of qrCodes) {
      await remotePrisma.qrCode.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`  - ${qrCodes.length} QR codes migrated`);

    // Migrate Questions
    console.log('Migrating Questions...');
    const questions = await localPrisma.question.findMany();
    for (const item of questions) {
      await remotePrisma.question.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`  - ${questions.length} questions migrated`);

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
  }
}

migrateData();
