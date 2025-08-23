// Safe Client API service

import { config } from '@/config/env';
import { 
  SafeTransaction, 
  QueuedTransactionsResponse,
  SeenTransaction 
} from '@/types/safe';
import { getStorage } from './storage';
import { getTelegram } from './telegram';

export class SafeApiService {
  private baseUrl: string;
  private chainId: string;
  private safeAddress: string;

  constructor() {
    this.baseUrl = config.safe.clientBase;
    this.chainId = config.safe.chainId;
    this.safeAddress = config.safe.address;
  }

  private validateConfig() {
    if (!this.safeAddress) {
      throw new Error('SAFE_ADDRESS environment variable is required');
    }
  }

  async getQueuedTransactions(): Promise<SafeTransaction[]> {
    this.validateConfig();
    const url = `${this.baseUrl}/v1/chains/${this.chainId}/safes/${this.safeAddress}/transactions/queued`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Safe API error:', response.status, error);
        throw new Error(`Safe API returned ${response.status}`);
      }

      const data: QueuedTransactionsResponse = await response.json();
      
      // Flatten the grouped transactions
      const transactions = (data.results ?? []).flatMap(
        group => group.transactions ?? []
      );

      return transactions;
    } catch (error) {
      console.error('Failed to fetch queued transactions:', error);
      throw error;
    }
  }

  getTransactionConfirmations(tx: SafeTransaction): number {
    return tx.confirmations?.length ?? 
           tx.detailedExecutionInfo?.confirmations?.length ?? 
           0;
  }

  getTransactionThreshold(tx: SafeTransaction): number {
    return tx.confirmationsRequired ??
           tx.confirmationsRequiredFromSafe ??
           tx.detailedExecutionInfo?.confirmationsRequired ??
           tx.detailedExecutionInfo?.confirmationsSubmitted ??
           0;
  }

  needsSignatures(tx: SafeTransaction): boolean {
    const confirmations = this.getTransactionConfirmations(tx);
    const threshold = this.getTransactionThreshold(tx);
    return confirmations < threshold;
  }

  async checkForNewTransactions(): Promise<{
    newTransactions: number;
    notificationsSent: number;
    errors: string[];
  }> {
    const result = {
      newTransactions: 0,
      notificationsSent: 0,
      errors: [] as string[],
    };

    try {
      const transactions = await this.getQueuedTransactions();
      console.log(`Found ${transactions.length} queued transactions`);

      for (const tx of transactions) {
        if (!tx.safeTxHash) continue;

        const confirmations = this.getTransactionConfirmations(tx);
        const threshold = this.getTransactionThreshold(tx);
        const needsSigs = this.needsSignatures(tx);

        console.log(`Transaction ${tx.safeTxHash}: ${confirmations}/${threshold} signatures`);

        // Check if we've seen this transaction before
        const storage = getStorage();
        const seenTx = await storage.getSeenTransaction(tx.safeTxHash);
        
        if (!seenTx && needsSigs) {
          // New transaction that needs signatures
          result.newTransactions++;
          
          // Save to storage
          const newSeenTx: SeenTransaction = {
            safeTxHash: tx.safeTxHash,
            firstSeen: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
            confirmations,
            threshold,
          };
          
          await storage.setSeenTransaction(newSeenTx);
          
          // Send notification
          try {
            const telegram = getTelegram();
            const sent = await telegram.notifyNewTransaction(
              tx,
              confirmations,
              threshold
            );
            
            if (sent) {
              result.notificationsSent++;
              console.log(`Notification sent for ${tx.safeTxHash}`);
            } else {
              result.errors.push(`Failed to send notification for ${tx.safeTxHash}`);
            }
          } catch (error) {
            const errorMsg = `Error sending notification for ${tx.safeTxHash}: ${error}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        } else if (seenTx) {
          // Update the last checked time and current confirmation count
          await storage.updateSeenTransaction(tx.safeTxHash, {
            confirmations,
            lastChecked: new Date().toISOString(),
          });
          
          // Optional: Notify if confirmations increased
          if (confirmations > seenTx.confirmations && needsSigs) {
            console.log(`Transaction ${tx.safeTxHash} has new confirmations: ${confirmations}/${threshold}`);
            // You could send an update notification here if desired
          }
        }
      }
    } catch (error) {
      const errorMsg = `Failed to check transactions: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }
}

// Lazy initialization to avoid errors during build
let _safeApi: SafeApiService | null = null;

export function getSafeApi(): SafeApiService {
  if (!_safeApi) {
    _safeApi = new SafeApiService();
  }
  return _safeApi;
}
