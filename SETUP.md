# Gnosis Safe Monitor - Setup Guide

This Next.js application monitors your Gnosis Safe for pending transactions and sends notifications to your Telegram group when signatures are needed. Built with the official Safe API Kit SDK for reliable and type-safe interactions.

## Features

- 🔔 Automatic monitoring of pending Safe transactions
- 📱 Telegram notifications when new transactions need signatures
- ⏰ Runs on Vercel cron (every 5 minutes)
- 💾 Persistent storage using Vercel Edge Config Store
- 🎛️ Web dashboard for monitoring and manual checks
- 🔗 Direct links to sign transactions in Safe App
- 🛠️ Uses official Safe API Kit SDK for robust Safe interactions
- 📊 Displays detailed Safe information (owners, threshold, nonce, etc.)
- 🔧 Built with Thirdweb SDK v5 utilities for blockchain operations

## Prerequisites

1. A Gnosis Safe multisig wallet
2. A Telegram bot token for the shared bot and a group/channel
3. A Vercel account for deployment
4. Node.js 18+ for local development

## Important Note: Storage Migration

**As of June 2025, this project has migrated from Vercel KV to Vercel Edge Config Store** due to Vercel KV being deprecated. The new implementation provides the same functionality with improved performance and reliability.

## Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Save the bot token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. This single bot token will be used by all app users
5. Add the bot to your group as an admin

### 3. Get Telegram Chat ID

Method 1 - Using getUpdates API:
1. Add your bot to the group
2. Send any message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":-100XXXXXXXXXX}` - this is your chat ID

Method 2 - Using @RawDataBot:
1. Add @RawDataBot to your group
2. The bot will send a message with the chat info
3. Look for `"id": -100XXXXXXXXXX`
4. Remove @RawDataBot from the group

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Safe Configuration
SAFE_CHAIN_ID=8453                          # Your chain ID
SAFE_ADDRESS=0xYourSafeAddress              # Your Safe address
SAFE_CLIENT_BASE=https://safe-client.safe.global

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-bot-token-here      # From @BotFather (shared bot)
TELEGRAM_CHAT_ID=-100XXXXXXXXXX             # Optional: default group/channel ID

# Cron Security (generate a random string)
CRON_SECRET=your-random-secret-here
```

**Supported Chain IDs:**
- Ethereum: 1
- Optimism: 10
- Polygon: 137
- Base: 8453
- Arbitrum: 42161

### 5. Test Locally

```bash
# Run the development server
npm run dev
```

1. Visit http://localhost:3000/dashboard
2. Click "Test Telegram Connection" to verify your bot setup
3. Click "Check for New Transactions" to manually test monitoring

### 6. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SAFE_CHAIN_ID
vercel env add SAFE_ADDRESS
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
vercel env add CRON_SECRET
vercel env add VERCEL_API_TOKEN  # Required for Edge Config writes
```

#### Option B: Using GitHub

1. Push your code to GitHub
2. Import the repository in Vercel Dashboard
3. Add environment variables in Project Settings → Environment Variables
4. Deploy

### 7. Enable Vercel Edge Config Store (Optional but Recommended)

Vercel Edge Config Store provides persistent storage for tracking seen transactions:

#### Step 1: Create Edge Config
1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database" → "Edge Config Store"
4. Follow the setup wizard
5. The EDGE_CONFIG environment variable will be automatically added to your project

#### Step 2: Create Vercel API Token (Required for Writes)
1. Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name like "Safe Monitor API Token"
4. Select appropriate scopes (needs write access to Edge Config)
5. Copy the token and add it to your environment variables as `VERCEL_API_TOKEN`

**Important:** According to the [Vercel Edge Config REST API documentation](https://vercel.com/docs/edge-config/vercel-api), you need two different tokens:
- **EDGE_CONFIG**: Contains read access token for fast reads via `edge-config.vercel.com`
- **VERCEL_API_TOKEN**: Separate API token for writes via `api.vercel.com`

Without both tokens, the app will use in-memory storage (resets on each deployment).

### 8. Verify Cron Job

After deployment:
1. Go to your Vercel project dashboard
2. Navigate to the "Functions" tab
3. Click on "Crons"
4. You should see the `/api/cron/check-safe` job scheduled for every 5 minutes

## Usage

### Dashboard

Visit `https://your-app.vercel.app/dashboard` to:
- View current configuration
- Manually trigger transaction checks
- Test Telegram connection
- Monitor system status

### Notifications

When a new transaction needs signatures, you'll receive a Telegram message like:

```
🔔 New Safe Transaction Needs Signatures

Safe: 0xABCD…1234 on base
Nonce: 42
Signatures: 1/3 required

To: 0xDEF0…5678
Operation: CALL
Value: 0.5 ETH
Method: transfer

✅ Sign Transaction in Safe App
```

The message includes a direct link to sign the transaction in the Safe web app.

## API Endpoints

- `GET /api/cron/check-safe` - Main cron endpoint (called every 5 minutes)
- `POST /api/cron/check-safe` - Manual trigger for transaction check
- `POST /api/test-telegram` - Test Telegram connection
- `GET /api/safe-info` - Get detailed Safe information using Safe API Kit

## Safe API Kit Integration

This project uses the official [@safe-global/api-kit](https://www.npmjs.com/package/@safe-global/api-kit) SDK directly for interacting with Safe services. The API Kit provides:

- **Type-safe API calls** - Full TypeScript support with proper types
- **Automatic network routing** - Handles different Safe Transaction Service endpoints automatically
- **Comprehensive API coverage** - Access to all Safe Transaction Service endpoints
- **Built-in error handling** - Proper error types and messages
- **Simple initialization** - Just provide the chainId and optionally an API key

The integration provides access to:
- Pending transactions monitoring via `getPendingTransactions()`
- Safe information (owners, threshold, modules) via `getSafeInfo()`
- Transaction history via `getMultisigTransactions()`
- Confirmation tracking and more

**Note:** For production use, you may want to obtain a Safe API key from [https://developer.safe.global](https://developer.safe.global) for higher rate limits.

## Thirdweb SDK Integration

This project leverages [Thirdweb SDK v5](https://portal.thirdweb.com/references/typescript/v5) utilities for blockchain operations:

- **Chain Management** - Uses `defineChain` for proper chain definitions with metadata
- **Address Formatting** - Uses `shortenAddress` for consistent address truncation
- **Token Conversion** - Uses `toTokens` and `toWei` for proper decimal handling
- **Social Profiles** - Uses `getSocialProfiles` to display human-readable names and avatars
- **Type Safety** - Full TypeScript support with proper chain types

The SDK provides battle-tested utilities that handle edge cases and provide consistent behavior across different blockchain networks.

## OG Image Generation

Transaction notifications now include rich visual cards generated using Vercel's OG Image API:

- **Transaction Details** - Safe address, destination, value, nonce, and signature requirements
- **Social Profiles** - Human-readable names and avatars for Safe owners using Thirdweb's social API
- **Visual Design** - Professional dark theme with gradient accents and proper typography
- **Fallback Support** - Gracefully falls back to text-only messages if image generation fails

### Required Environment Variables

```bash
# Thirdweb Client ID for social profiles
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id

# Your app's public URL for OG image generation
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Customization

### Change Cron Schedule

Edit `vercel.json` to adjust the checking frequency:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-safe",
      "schedule": "*/15 * * * *"  // Every 15 minutes
    }
  ]
}
```

[Cron expression reference](https://crontab.guru/)

### Add More Chains

Edit `src/config/env.ts` to add support for more chains:

```typescript
export const chainConfig = {
  // ... existing chains
  56: { name: 'bsc', explorer: 'https://bscscan.com' },
  // Add your chain here
}
```

## Troubleshooting

### Telegram not receiving messages
1. Verify bot token and chat ID are correct
2. Ensure bot is added to the group as an admin
3. Check Vercel function logs for errors

### Transactions not being detected
1. Verify Safe address and chain ID are correct
2. Check if the Safe has pending transactions
3. Review Vercel function logs

### Cron not running
1. Ensure `CRON_SECRET` is set in Vercel environment variables
2. Check Vercel Functions → Crons tab for execution logs
3. Verify deployment was successful

## Security Considerations

1. **Keep your bot token secret** - Never commit it to version control
2. **Use CRON_SECRET** - Prevents unauthorized access to your cron endpoint
3. **Restrict bot permissions** - Only give necessary permissions in Telegram
4. **Monitor function logs** - Check for any suspicious activity

## Support

For issues or questions:
1. Check the dashboard for configuration errors
2. Review Vercel function logs
3. Test individual components (Telegram, Safe API) separately
4. Ensure all environment variables are correctly set

## Additional Features to Consider

- Notification when transactions are executed
- Support for multiple Safes
- Slack integration
- Email notifications
- Custom notification templates
- Transaction detail decoding
- Gas price alerts
