#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'production';

if (!['local', 'production'].includes(env)) {
  console.error('❌ Invalid environment. Use "local" or "production"');
  console.log('Usage: node scripts/setup-env.js [local|production]');
  process.exit(1);
}

console.log(`🔧 Setting up database for ${env} environment...`);

if (env === 'local') {
  // Use SQLite for local development
  console.log('📱 Switching to SQLite for local development...');
  require('child_process').execSync('npm run db:local', { stdio: 'inherit' });
  
  console.log('✅ Local environment configured with SQLite');
  console.log('📝 Make sure your .env.local has:');
  console.log('   DATABASE_URL="file:./dev.db"');
  
} else {
  // Use PostgreSQL for production
  console.log('☁️  Switching to PostgreSQL for production...');
  require('child_process').execSync('npm run db:production', { stdio: 'inherit' });
  
  console.log('✅ Production environment configured with PostgreSQL');
  console.log('📝 Make sure your environment has:');
  console.log('   DATABASE_URL="your_POSTGRES_PRISMA_URL_value"');
}

console.log('');
console.log('🔄 Next steps:');
console.log('   1. Run: npm run db:generate-schemas');
console.log('   2. Set your DATABASE_URL environment variable');
console.log('   3. Run: npx prisma db push');
console.log('   4. Run: npx prisma generate');
