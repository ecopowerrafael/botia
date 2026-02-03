import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({
  path: ['.env.local', '.env'],
});

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres2024@localhost:5432/botia_db',
    },
  },
  generator: {
    client: {
      provider: 'prisma-client-js',
    },
  },
};
