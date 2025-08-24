# Multisig Alert - Multi-Tenant Multisig Monitoring

A web3-native application that allows users to monitor their Gnosis Safe multisigs and receive instant Telegram notifications when transactions require their signatures. Built with Next.js, Prisma, and thirdweb for secure wallet-based authentication.

## Features

- **🔐 Web3-Native Authentication**: Sign in with Ethereum using any wallet (MetaMask, WalletConnect, etc.)
- **🏗️ Multi-Tenant Architecture**: Each user can manage their own multisigs and notification settings
- **⛓️ Multi-Chain Support**: Monitor safes on Ethereum, Base, Polygon, Arbitrum, Optimism, and more
- **📱 Instant Notifications**: Get Telegram alerts immediately when signatures are needed
- **🔄 Automated Monitoring**: Cron jobs check for new transactions every 5 minutes
- **🛡️ Secure & Private**: No passwords or personal data required - just your wallet

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Authentication**: thirdweb Sign-In with Ethereum (SIWE)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **Blockchain**: Safe API Kit for Gnosis Safe integration
- **Notifications**: Telegram Bot API
- **Deployment**: Vercel with cron jobs
- **Styling**: Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A thirdweb account and API keys
- A Telegram bot (optional, for notifications)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd multisig-alert
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp env.local.example .env
```

Update `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"           # SQLite for development

# Thirdweb Configuration
THIRDWEB_SECRET_KEY=your-thirdweb-secret-key-here
THIRDWEB_ADMIN_PRIVATE_KEY=your-admin-private-key-here

# App Configuration
NEXTAUTH_URL=http://localhost:3000     # Your app URL
```

### 3. Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## User Guide

### Getting Started

1. **Connect Your Wallet**: Click "Connect Wallet" and sign in with Ethereum
2. **Add Your Multisigs**: Configure the Safe addresses you want to monitor
3. **Set Up Telegram**: Add your bot token and chat ID for notifications
4. **Start Monitoring**: The app will automatically check for new transactions

### Managing Multisigs

- **Add New**: Click "Add Multisig" and enter chain ID, address, and optional name
- **Enable/Disable**: Toggle monitoring for specific multisigs
- **Delete**: Remove multisigs you no longer want to monitor

### Notification Settings

- **Telegram Bot**: Create a bot with @BotFather and get your token
- **Chat ID**: Add the bot to your group/channel and get the chat ID
- **Test Connection**: Use the "Test Telegram" button to verify setup

## API Endpoints

### Authentication
- `POST /api/auth/login` - Sign in with Ethereum
- `POST /api/auth/logout` - Sign out

### Multisigs
- `GET /api/multisigs` - List user's multisigs
- `POST /api/multisigs` - Create new multisig
- `PATCH /api/multisigs/[id]` - Update multisig
- `DELETE /api/multisigs/[id]` - Delete multisig

### Notifications
- `GET /api/notifications` - Get notification settings
- `PUT /api/notifications` - Update notification settings
- `POST /api/notifications` - Test Telegram connection

### Monitoring
- `GET /api/cron/check-safe` - Cron endpoint for transaction checking
- `POST /api/cron/check-safe` - Manual transaction check

## Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  multisigs     Multisig[]
  notifications NotificationSetting[]
}

model Multisig {
  id          String    @id @default(cuid())
  userId      String
  chainId     Int
  address     String
  name        String?
  enabled     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions SeenTransaction[]
  
  @@unique([userId, chainId, address])
}

model NotificationSetting {
  id              String    @id @default(cuid())
  userId          String    @unique
  telegramBotToken String?
  telegramChatId  String?
  enabled         Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SeenTransaction {
  id            String    @id @default(cuid())
  multisigId    String
  safeTxHash    String
  firstSeen     DateTime  @default(now())
  lastChecked   DateTime  @default(now())
  confirmations Int       @default(0)
  threshold     Int
  notified      Boolean   @default(false)
  
  multisig      Multisig  @relation(fields: [multisigId], references: [id], onDelete: Cascade)
  
  @@unique([multisigId, safeTxHash])
}
```

## Deployment

### Vercel Deployment

1. **Push to GitHub**: Commit and push your changes
2. **Connect to Vercel**: Import your repository
3. **Environment Variables**: Set all required environment variables
4. **Deploy**: Vercel will automatically deploy your app

### Environment Variables for Production

```env
# Database
DATABASE_URL="postgresql://..."

# Thirdweb
THIRDWEB_SECRET_KEY=your-production-secret-key
THIRDWEB_ADMIN_PRIVATE_KEY=your-production-admin-key

# App
NEXTAUTH_URL=https://yourdomain.com
```

### Cron Job Setup

The app includes a Vercel cron job that runs every 5 minutes to check for new transactions. This is automatically configured when you deploy to Vercel.

## Security Considerations

- **Wallet Authentication**: Users authenticate by signing messages with their private keys
- **JWT Tokens**: Secure session management with HTTP-only cookies
- **Route Protection**: Middleware protects all sensitive routes and API endpoints
- **Data Isolation**: Each user can only access their own data
- **Input Validation**: All user inputs are validated and sanitized

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure your `DATABASE_URL` is correct
2. **Thirdweb Keys**: Verify your `THIRDWEB_SECRET_KEY` and `THIRDWEB_ADMIN_PRIVATE_KEY`
3. **Telegram Bot**: Make sure your bot is added to the group/channel
4. **Wallet Connection**: Try refreshing the page if wallet connection fails

### Development Tips

- Use the browser console to debug authentication issues
- Check the Network tab for API request/response details
- Verify environment variables are loaded correctly
- Test with different wallet providers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Open an issue on GitHub
