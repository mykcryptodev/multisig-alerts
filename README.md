# Multisig Alert - Multi-tenant Gnosis Safe Monitor

A multi-tenant web application that allows users to monitor their Gnosis Safe multisigs and receive Telegram notifications when transactions need signatures.

## Features

- 🔐 **User Authentication**: Secure email/password authentication system
- 📊 **Multi-tenant Support**: Each user can monitor their own multisigs
- 🔔 **Real-time Notifications**: Telegram alerts for pending transactions
- ⛓️ **Multi-chain Support**: Monitor Safes on Ethereum, Base, Polygon, Arbitrum, and Optimism
- ⏰ **Automated Monitoring**: Checks all registered Safes every 5 minutes
- 🎛️ **Web Dashboard**: Manage multisigs and notification settings
- 💾 **Persistent Storage**: Track seen transactions to prevent duplicate alerts

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: SQLite with Prisma ORM (easily switchable to PostgreSQL)
- **Authentication**: NextAuth.js
- **Safe Integration**: Safe API Kit SDK
- **Notifications**: Telegram Bot API
- **Deployment**: Optimized for Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- A Telegram bot (create via @BotFather)
- A Vercel account (for deployment)

### Local Development

1. **Clone and Install**
```bash
git clone <repository-url>
cd multisig-alert
npm install
```

2. **Configure Environment**
```bash
cp env.local.example .env.local
```

Edit `.env.local`:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# Optional: Safe API Key for better rate limits
SAFE_API_KEY=your-safe-api-key  # Get from https://developer.safe.global

# Cron Security (for production)
CRON_SECRET=your-random-secret
```

3. **Initialize Database**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Run Development Server**
```bash
npm run dev
```

Visit http://localhost:3000 to access the application.

## User Guide

### Getting Started

1. **Sign Up**: Create an account with your email and password
2. **Add Multisigs**: Add your Safe addresses and select the appropriate chains
3. **Configure Telegram**:
   - Create a bot via @BotFather on Telegram
   - Add the bot to your group/channel as admin
   - Get your chat ID (see instructions below)
   - Enter bot token and chat ID in notification settings
4. **Start Monitoring**: Enable monitoring for your multisigs

### Getting Your Telegram Chat ID

**Method 1 - Using Bot API:**
1. Add your bot to the group
2. Send any message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":-100XXXXXXXXXX}`

**Method 2 - Using @RawDataBot:**
1. Add @RawDataBot to your group
2. The bot will send the chat info
3. Look for `"id": -100XXXXXXXXXX`
4. Remove @RawDataBot from the group

## Deployment to Vercel

### 1. Deploy the Application

```bash
# Using Vercel CLI
vercel

# Or connect GitHub repository via Vercel Dashboard
```

### 2. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

- `DATABASE_URL` - Your production database URL (e.g., PostgreSQL)
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `SAFE_API_KEY` - Optional, for better API rate limits
- `CRON_SECRET` - Random string for cron authentication

### 3. Set Up Database (Production)

For production, use a cloud database like:
- **Vercel Postgres** (recommended)
- **PlanetScale**
- **Supabase**
- **Railway**

Update your `DATABASE_URL` and run migrations:
```bash
npx prisma migrate deploy
```

### 4. Enable Cron Job

Create `vercel.json` if not exists:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-safe",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This checks all registered multisigs every 5 minutes.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Multisigs
- `GET /api/multisigs` - List user's multisigs
- `POST /api/multisigs` - Add new multisig
- `PATCH /api/multisigs/[id]` - Update multisig
- `DELETE /api/multisigs/[id]` - Delete multisig

### Notifications
- `GET /api/notifications` - Get notification settings
- `PUT /api/notifications` - Update notification settings
- `POST /api/notifications/test` - Test Telegram connection

### Monitoring
- `GET /api/cron/check-safe` - Cron endpoint (protected)
- `POST /api/cron/check-safe` - Manual check trigger

## Database Schema

The application uses Prisma ORM with the following models:

- **User**: Authentication and user data
- **Multisig**: Safe configurations per user
- **NotificationSetting**: Telegram settings per user
- **SeenTransaction**: Track processed transactions

## Migrating from Single-tenant

If you're upgrading from the single-tenant version:

1. Back up your existing data
2. Run database migrations
3. Create user accounts for existing Safe owners
4. Import Safe configurations into the new schema
5. Update notification settings per user

## Security Considerations

- All user passwords are hashed with bcrypt
- API endpoints are protected with authentication
- Telegram credentials are stored per user
- Cron endpoint is protected with secret token
- Database queries use parameterized statements

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Ensure DATABASE_URL is correctly configured
- Run `npx prisma generate` after schema changes

**Authentication Issues**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain

**Telegram Not Working**
- Verify bot token is correct
- Ensure bot is admin in the group
- Check chat ID format (should start with -)

**Cron Not Running**
- Verify cron configuration in vercel.json
- Check CRON_SECRET matches in environment

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the setup guide for detailed instructions
