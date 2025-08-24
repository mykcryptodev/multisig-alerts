# Database Setup Guide

This project supports both SQLite (for local development) and PostgreSQL (for production) databases.

## Quick Setup

### 1. Generate Database Schemas
First, generate the different database schemas:
```bash
npm run db:generate-schemas
```

This creates:
- `prisma/schema.sqlite` - SQLite configuration for local development
- `prisma/schema.postgres` - PostgreSQL configuration for production

### 2. Set Up Local Development (SQLite)
```bash
npm run db:local
```

This will:
- Switch to SQLite schema
- Generate Prisma client
- Set up for local development

**Environment Variables for Local:**
```bash
# .env.local
DATABASE_URL="file:./dev.db"
```

### 3. Set Up Production (PostgreSQL/Supabase)
```bash
npm run db:production
```

This will:
- Switch to PostgreSQL schema
- Generate Prisma client
- Set up for production

**Environment Variables for Production:**
```bash
# .env.production or your deployment platform
DATABASE_URL="your_POSTGRES_PRISMA_URL_value"
```

## Manual Commands

If you prefer to run commands manually:

### Switch to SQLite:
```bash
cp prisma/schema.sqlite prisma/schema.prisma
npx prisma generate
```

### Switch to PostgreSQL:
```bash
cp prisma/schema.postgres prisma/schema.prisma
npx prisma generate
```

## Environment-Specific Setup

### Local Development
```bash
# Set environment to local
NODE_ENV=local npm run db:local

# Or use the setup script
node scripts/setup-env.js local
```

### Production
```bash
# Set environment to production
NODE_ENV=production npm run db:production

# Or use the setup script
node scripts/setup-env.js production
```

## After Switching Databases

1. **Push the schema to your database:**
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### "Invalid `prisma.user.findUnique()` invocation" Error
This usually means your schema and DATABASE_URL don't match:
- **SQLite schema** needs `DATABASE_URL="file:./dev.db"`
- **PostgreSQL schema** needs `DATABASE_URL="your_postgres_url"`

### "Provider mismatch" Error
Make sure you've run the correct database switch command:
- `npm run db:local` for SQLite
- `npm run db:production` for PostgreSQL

### Database Connection Issues
- Check your `DATABASE_URL` environment variable
- Ensure your database is running and accessible
- Verify network/firewall settings for remote databases
