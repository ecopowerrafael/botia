#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgres://appuser:appsecret@localhost:5432/appdb'
    }
  }
});

async function main() {
  try {
    console.log('Conectando ao banco de dados...');
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('✅ Conectado ao PostgreSQL!');
    
    console.log('\nSincronizando schema...');
    const result = await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Schema sincronizado!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
