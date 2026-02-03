-- Create database if not exists
CREATE DATABASE botia_db;

-- Create user if not exists
CREATE USER botia_user WITH PASSWORD 'BotIA2025@Secure';

-- Grant permissions
ALTER USER botia_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE botia_db TO botia_user;
GRANT CONNECT ON DATABASE botia_db TO botia_user;

-- Verify
\l botia_db
\du botia_user
