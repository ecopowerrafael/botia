import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgres://appuser:appsecret@localhost:5432/appdb';

module.exports = {
  datasource: {
    provider: 'postgresql',
    url: databaseUrl,
  },
};
