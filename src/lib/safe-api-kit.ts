// Simple Safe API service using the official Safe API Kit SDK directly

import SafeApiKit from '@safe-global/api-kit';
import { config } from '@/config/env';
import { getStorage } from './storage';
import { getTelegram } from './telegram';

// Lazy initialization to avoid build-time errors
let safeApi: SafeApiKit | null = null;

function getSafeApi(): SafeApiKit {
  if (!safeApi) {
    if (!config.safe.address) {
      throw new Error('SAFE_ADDRESS environment variable is required');
    }
    
    // SafeApiKit requires an API key for production use
    // You can get one at https://developer.safe.global
    const configOptions: { chainId: bigint; apiKey?: string } = {
      chainId: BigInt(config.safe.chainId),
    };
    
    if (config.safe.apiKey) {
      configOptions.apiKey = config.safe.apiKey;
    }
    
    safeApi = new SafeApiKit(configOptions);
  }
  return safeApi;
}

export async function checkForNewTransactions() {
  if (!config.safe.address) {
    throw new Error('SAFE_ADDRESS environment variable is required');
  }

  try {
    // Get pending transactions directly from Safe Transaction Service
    const pendingTxs = await getSafeApi().getPendingTransactions(config.safe.address);
    
    console.log(`Found ${pendingTxs.results.length} pending transactions`);
    
    let newTransactions = 0;
    let notificationsSent = 0;
    const errors: string[] = [];

    for (const tx of pendingTxs.results) {
      if (!tx.safeTxHash) continue;

      const confirmations = tx.confirmations?.length ?? 0;
      const threshold = tx.confirmationsRequired ?? 0;
      const needsSigs = confirmations < threshold;

      if (needsSigs) {
        // Check if we've seen this transaction
        const storage = getStorage();
        const seenTx = await storage.getSeenTransaction(tx.safeTxHash);
        
        if (!seenTx) {
          newTransactions++;
          
          // Save to storage
          await storage.setSeenTransaction({
            safeTxHash: tx.safeTxHash,
            firstSeen: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
            confirmations,
            threshold,
          });
          
          // Send notification with OG image
          try {
            const telegram = getTelegram();
            
            // Convert Safe API transaction to the format expected by telegram service
            const telegramTx = {
              safeTxHash: tx.safeTxHash,
              to: tx.to,
              receiver: tx.to, // Use 'to' as receiver
              value: tx.value,
              dataDecoded: tx.dataDecoded,
              operation: tx.operation,
              nonce: tx.nonce ? Number(tx.nonce) : undefined,
              detailedExecutionInfo: { nonce: tx.nonce ? Number(tx.nonce) : undefined },
              data: tx.data,
              confirmations: tx.confirmations,
            };
            
            const sent = await telegram.notifyNewTransaction(telegramTx, confirmations, threshold);
            
            if (sent) {
              notificationsSent++;
              console.log(`Notification sent for ${tx.safeTxHash}`);
            } else {
              errors.push(`Failed to send notification for ${tx.safeTxHash}`);
            }
          } catch (error) {
            errors.push(`Error sending notification for ${tx.safeTxHash}: ${error}`);
          }
        } else {
          // Update confirmation count
          await storage.updateSeenTransaction(tx.safeTxHash, {
            confirmations,
            lastChecked: new Date().toISOString(),
          });
        }
      }
    }

    return { newTransactions, notificationsSent, errors };
  } catch (error) {
    console.error('Failed to check transactions:', error);
    throw error;
  }
}

export async function getSafeInfo() {
  if (!config.safe.address) {
    throw new Error('SAFE_ADDRESS environment variable is required');
  }
  return await getSafeApi().getSafeInfo(config.safe.address);
}

// Export the getter function for direct use if needed
export { getSafeApi };
