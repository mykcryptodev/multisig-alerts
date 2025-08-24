#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

const mainSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.sqlite');
const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgres');

// Read the base schema content
const baseSchema = fs.readFileSync(mainSchemaPath, 'utf8');

// Create SQLite schema
const sqliteSchema = baseSchema.replace(
  /datasource db \{[^}]*\}/s,
  `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`
);

// Create PostgreSQL schema
const postgresSchema = baseSchema.replace(
  /datasource db \{[^}]*\}/s,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

// Write the schemas
fs.writeFileSync(sqliteSchemaPath, sqliteSchema);
fs.writeFileSync(postgresSchemaPath, postgresSchema);

console.log('✅ Database schemas generated:');
console.log('  - schema.sqlite (for local development)');
console.log('  - schema.postgres (for production)');
console.log('');
console.log('To use SQLite locally:');
console.log('  cp prisma/schema.sqlite prisma/schema.prisma');
console.log('');
console.log('To use PostgreSQL in production:');
console.log('  cp prisma/schema.postgres prisma/schema.prisma');
