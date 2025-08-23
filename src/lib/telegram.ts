// Telegram notification service

import { config, formatAddress, formatEthValue, getChainConfig } from '@/config/env';
import { SafeTransaction } from '@/types/safe';

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

  formatTransactionMessage(
    tx: SafeTransaction,
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
    tx: SafeTransaction,
    confirmations: number,
    threshold: number
  ): Promise<boolean> {
    const message = this.formatTransactionMessage(tx, confirmations, threshold);
    return await this.sendMessage(message);
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
