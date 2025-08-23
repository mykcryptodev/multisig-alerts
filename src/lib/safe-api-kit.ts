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
    const configOptions: any = {
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
            const sent = await telegram.notifyNewTransaction(tx, confirmations, threshold);
            
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

function formatNotificationMessage(tx: any, confirmations: number, threshold: number) {
  const chainName = getChainName(config.safe.chainId);
  const safeUrl = `https://app.safe.global/${chainName}:${config.safe.address}/transactions/tx?id=multisig_${config.safe.address}_${tx.safeTxHash}`;
  
  return [
    `<b>🔔 New Safe Transaction Needs Signatures</b>`,
    '',
    `<b>Safe:</b> ${config.safe.address.slice(0, 6)}…${config.safe.address.slice(-4)} on ${chainName}`,
    `<b>Nonce:</b> ${tx.nonce || 'unknown'}`,
    `<b>Signatures:</b> ${confirmations}/${threshold} required`,
    '',
    `<b>To:</b> ${tx.to ? `${tx.to.slice(0, 6)}…${tx.to.slice(-4)}` : 'unknown'}`,
    `<b>Value:</b> ${tx.value === '0' ? '0' : formatEthValue(tx.value)} ETH`,
    '',
    `<a href="${safeUrl}">✅ Sign Transaction in Safe App</a>`
  ].join('\n');
}

function getChainName(chainId: string): string {
  const chains: Record<string, string> = {
    '1': 'ethereum',
    '10': 'optimism', 
    '137': 'polygon',
    '8453': 'base',
    '42161': 'arbitrum'
  };
  return chains[chainId] || `chain-${chainId}`;
}

function formatEthValue(valueWei: string): string {
  if (!valueWei || valueWei === '0') return '0';
  try {
    const wei = BigInt(valueWei);
    const eth = Number(wei / BigInt(10 ** 14)) / 10000;
    return eth.toFixed(4).replace(/\.?0+$/, '');
  } catch {
    return '0';
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
