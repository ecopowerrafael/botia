#!/usr/bin/env node

/**
 * Script de inicialização do backend NestJS
 * Contorna bugs do npm em ambiente Windows/OneDrive
 */

const path = require('path');
const { execSync } = require('child_process');

const backendDir = __dirname;
const nestCliPath = path.join(backendDir, 'node_modules/.bin/nest');

console.log('🚀 Iniciando backend NestJS...');
console.log(`📁 Diretório: ${backendDir}`);
console.log(`🔧 CLI: ${nestCliPath}`);

try {
  // Tentar executar o Nest CLI diretamente
  execSync(`"${nestCliPath}" start --watch`, {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
  });
} catch (error) {
  console.error('❌ Erro ao iniciar o backend:', error.message);
  process.exit(1);
}
