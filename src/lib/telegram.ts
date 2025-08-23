// Telegram notification service

import { config, formatAddress, formatEthValue, getChainConfig } from '@/config/env';
// No need to import SafeTransaction since we're using Safe API Kit types directly

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = config.telegram.botToken;
    this.chatId = config.telegram.chatId;
    
    if (!this.botToken || !this.chatId) {
      console.warn('Telegram credentials not configured');
    }
  }

  async sendMessage(text: string, extra: Partial<TelegramMessage> = {}): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.error('Telegram not configured');
      return false;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    
    const body: TelegramMessage = {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Telegram API error:', response.status, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  async sendPhoto(photoUrl: string, caption?: string): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.error('Telegram not configured');
      return false;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
    
    const body = {
      chat_id: this.chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Telegram API error:', response.status, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram photo:', error);
      return false;
    }
  }

  formatTransactionMessage(
    tx: any, // Using any since we're getting this from Safe API Kit
    confirmations: number,
    threshold: number
  ): string {
    const chainId = config.safe.chainId;
    const safeAddress = config.safe.address;
    const chain = getChainConfig(chainId);
    
    const destination = tx.to || tx.receiver || 'unknown';
    const valueWei = tx.value || tx.dataDecoded?.value || '0';
    const operation = tx.operation === 1 ? 'DELEGATECALL' : 'CALL';
    const nonce = tx.nonce ?? tx.detailedExecutionInfo?.nonce ?? 'unknown';
    const valueEth = formatEthValue(valueWei);

    // Build explorer URLs
    const explorerBase = chain.explorer;
    const safeUrl = explorerBase ? `${explorerBase}/address/${safeAddress}` : '';
    const destUrl = explorerBase && destination !== 'unknown' 
      ? `${explorerBase}/address/${destination}` 
      : '';
    
    // Safe Web App URL (more user-friendly than API URL)
    const safeWebUrl = `https://app.safe.global/${chain.name}:${safeAddress}/transactions/tx?id=multisig_${safeAddress}_${tx.safeTxHash}`;

    const lines = [
      `<b>🔔 New Safe Transaction Needs Signatures</b>`,
      '',
      `<b>Safe:</b> ${safeUrl ? `<a href="${safeUrl}">${formatAddress(safeAddress)}</a>` : formatAddress(safeAddress)} on ${chain.name}`,
      `<b>Nonce:</b> ${nonce}`,
      `<b>Signatures:</b> ${confirmations}/${threshold} required`,
      '',
      `<b>To:</b> ${destUrl ? `<a href="${destUrl}">${formatAddress(destination)}</a>` : formatAddress(destination)}`,
      `<b>Operation:</b> ${operation}`,
      `<b>Value:</b> ${valueEth} ETH`,
    ];

    // Add method info if available
    if (tx.dataDecoded?.method) {
      lines.push(`<b>Method:</b> <code>${tx.dataDecoded.method}</code>`);
    }

    // Add Safe Web App link
    lines.push('');
    lines.push(`<a href="${safeWebUrl}">✅ Sign Transaction in Safe App</a>`);

    return lines.join('\n');
  }

  async notifyNewTransaction(
    tx: any, // Using any since we're getting this from Safe API Kit
    confirmations: number,
    threshold: number
  ): Promise<boolean> {
    try {
      console.log('🔍 Attempting to generate OG image for transaction:', tx.safeTxHash);
      
      // First, try to send the OG image
      const ogImageUrl = await this.generateOGImageUrl(tx, confirmations, threshold);
      
      if (ogImageUrl) {
        console.log('✅ OG image URL generated:', ogImageUrl);
        const caption = this.formatTransactionMessage(tx, confirmations, threshold);
        console.log('📝 Sending photo with caption...');
        const photoSent = await this.sendPhoto(ogImageUrl, caption);
        
        if (photoSent) {
          console.log('✅ Photo sent successfully');
          return true;
        } else {
          console.log('❌ Photo sending failed, falling back to text message');
        }
      } else {
        console.log('❌ Failed to generate OG image URL, falling back to text message');
      }
      
      // Fallback to text-only message if image fails
      console.log('📝 Sending text-only message...');
      const message = this.formatTransactionMessage(tx, confirmations, threshold);
      return await this.sendMessage(message);
    } catch (error) {
      console.error('❌ Failed to send transaction notification:', error);
      
      // Final fallback to text-only message
      console.log('📝 Final fallback to text-only message...');
      const message = this.formatTransactionMessage(tx, confirmations, threshold);
      return await this.sendMessage(message);
    }
  }

  private async generateOGImageUrl(
    tx: any,
    confirmations: number,
    threshold: number
  ): Promise<string | null> {
    try {
      console.log('🔍 generateOGImageUrl called with:', {
        safeTxHash: tx.safeTxHash,
        to: tx.to,
        value: tx.value,
        nonce: tx.nonce,
        method: tx.dataDecoded?.method
      });
      
      const chainId = config.safe.chainId;
      const safeAddress = config.safe.address;
      
      console.log('🔍 Config values:', { chainId, safeAddress });
      
      // Validate required transaction data
      if (!tx.safeTxHash) {
        console.warn('❌ Missing safeTxHash in transaction data');
        return null;
      }
      
      // Get Safe info to get owners - use absolute URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      console.log('🔍 Using base URL:', baseUrl);
      
      const safeInfoUrl = `${baseUrl}/api/safe-info`;
      console.log('🔍 Fetching Safe info from:', safeInfoUrl);
      
      const safeInfoResponse = await fetch(safeInfoUrl);
      
      if (!safeInfoResponse.ok) {
        console.warn(`❌ Failed to fetch Safe info: ${safeInfoResponse.status} ${safeInfoResponse.statusText}`);
        return null;
      }
      
      const safeInfo = await safeInfoResponse.json();
      console.log('🔍 Safe info response:', safeInfo);
      
      if (!safeInfo.success || !safeInfo.data?.owners || safeInfo.data.owners.length === 0) {
        console.warn('❌ No owners found in Safe info or invalid response');
        return null;
      }

      console.log('🔍 Found owners:', safeInfo.data.owners);

      // Extract confirmed signers from transaction confirmations
      const confirmedSigners = tx.confirmations?.map((conf: any) => conf.owner) || [];
      console.log('🔍 Confirmed signers:', confirmedSigners);

      // Build query parameters for OG image
      const params = new URLSearchParams({
        safeTxHash: tx.safeTxHash,
        safeAddress: safeAddress,
        chainId: chainId,
        to: tx.to || tx.receiver || '',
        value: tx.value || '0',
        nonce: tx.nonce?.toString() || '',
        confirmations: confirmations.toString(),
        threshold: threshold.toString(),
        owners: safeInfo.data.owners.join(','),
        confirmedSigners: confirmedSigners.join(','),
        method: tx.dataDecoded?.method || '',
        data: tx.data || '', // Add transaction data for ERC-20 decoding
      });

      const ogImageUrl = `${baseUrl}/api/og/transaction?${params.toString()}`;
      console.log('✅ Generated OG image URL:', ogImageUrl);
      
      return ogImageUrl;
    } catch (error) {
      console.error('❌ Failed to generate OG image URL:', error);
      return null;
    }
  }

  async sendTestMessage(): Promise<boolean> {
    const message = [
      '<b>✅ Safe Monitor Connected</b>',
      '',
      `Monitoring Safe: <code>${config.safe.address}</code>`,
      `Chain: ${getChainConfig(config.safe.chainId).name}`,
      '',
      'You will receive notifications when new transactions need signatures.',
    ].join('\n');
    
    return await this.sendMessage(message);
  }
}

// Lazy initialization to avoid errors during build
let _telegram: TelegramService | null = null;

export function getTelegram(): TelegramService {
  if (!_telegram) {
    _telegram = new TelegramService();
  }
  return _telegram;
}
