#!/usr/bin/env node

// Script alternativo para iniciar o backend NestJS, contornando bug do npm
const { spawn } = require('child_process');
const path = require('path');

const isWatchMode = process.argv.includes('--watch');
const args = ['start', isWatchMode ? '--watch' : ''];

console.log('🚀 Iniciando backend NestJS...');
console.log(`Mode: ${isWatchMode ? 'development (watch)' : 'production'}`);

const nestCli = spawn('node', ['node_modules/.bin/nest', ...args], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

nestCli.on('error', (err) => {
  console.error('❌ Erro ao iniciar o backend:', err);
  process.exit(1);
});

nestCli.on('close', (code) => {
  process.exit(code);
});
