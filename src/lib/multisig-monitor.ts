// Multi-tenant multisig monitoring service
import SafeApiKit from '@safe-global/api-kit';
import { prisma } from '@/lib/db';
import { Multisig, NotificationSetting, SeenTransaction } from '@prisma/client';

interface CheckResult {
  multisigId: string;
  address: string;
  chainId: number;
  newTransactions: number;
  notificationsSent: number;
  errors: string[];
}

// Create Safe API instance for specific chain
function getSafeApi(chainId: number, apiKey?: string): SafeApiKit {
  const configOptions: any = {
    chainId: BigInt(chainId),
  };
  
  if (apiKey) {
    configOptions.apiKey = apiKey;
  }
  
  return new SafeApiKit(configOptions);
}

// Send Telegram notification
async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

// Format transaction notification message
function formatNotificationMessage(
  tx: any,
  confirmations: number,
  threshold: number,
  multisigName?: string | null
): string {
  const remaining = threshold - confirmations;
  const emoji = remaining === 1 ? '🚨' : '⏳';
  
  let message = `${emoji} <b>New Transaction Pending</b>\n`;
  
  if (multisigName) {
    message += `📍 Safe: ${multisigName}\n`;
  }
  
  message += `\n🔄 Status: ${confirmations}/${threshold} signatures\n`;
  
  if (remaining > 0) {
    message += `✍️ <b>Need ${remaining} more signature${remaining > 1 ? 's' : ''}</b>\n`;
  }
  
  message += `\n🔗 <a href="https://app.safe.global/transactions/tx?id=multisig_${tx.safe}_${tx.safeTxHash}">Sign Transaction</a>`;
  
  return message;
}

// Check a single multisig for new transactions
async function checkMultisig(
  multisig: Multisig,
  notificationSettings: NotificationSetting | null,
  apiKey?: string
): Promise<CheckResult> {
  const result: CheckResult = {
    multisigId: multisig.id,
    address: multisig.address,
    chainId: multisig.chainId,
    newTransactions: 0,
    notificationsSent: 0,
    errors: [],
  };

  try {
    const safeApi = getSafeApi(multisig.chainId, apiKey);
    
    // Get pending transactions
    const pendingTxs = await safeApi.getPendingTransactions(multisig.address);
    
    if (pendingTxs.results && pendingTxs.results.length > 0) {
      // Get Safe info for threshold
      const safeInfo = await safeApi.getSafeInfo(multisig.address);
      const threshold = safeInfo.threshold;
      
      for (const tx of pendingTxs.results) {
        const confirmations = tx.confirmations?.length || 0;
        
        // Check if we've seen this transaction before
        const seenTx = await prisma.seenTransaction.findUnique({
          where: {
            multisigId_safeTxHash: {
              multisigId: multisig.id,
              safeTxHash: tx.safeTxHash,
            },
          },
        });
        
        if (!seenTx) {
          result.newTransactions++;
          
          // Save to database
          await prisma.seenTransaction.create({
            data: {
              multisigId: multisig.id,
              safeTxHash: tx.safeTxHash,
              confirmations,
              threshold,
              notified: false,
            },
          });
          
          // Send notification if enabled
          if (notificationSettings?.enabled && 
              notificationSettings.telegramBotToken && 
              notificationSettings.telegramChatId) {
            
            const message = formatNotificationMessage(
              tx,
              confirmations,
              threshold,
              multisig.name
            );
            
            const sent = await sendTelegramNotification(
              notificationSettings.telegramBotToken,
              notificationSettings.telegramChatId,
              message
            );
            
            if (sent) {
              result.notificationsSent++;
              
              // Mark as notified
              await prisma.seenTransaction.update({
                where: {
                  multisigId_safeTxHash: {
                    multisigId: multisig.id,
                    safeTxHash: tx.safeTxHash,
                  },
                },
                data: { notified: true },
              });
            } else {
              result.errors.push(`Failed to send notification for ${tx.safeTxHash}`);
            }
          }
        } else {
          // Update confirmation count
          await prisma.seenTransaction.update({
            where: {
              multisigId_safeTxHash: {
                multisigId: multisig.id,
                safeTxHash: tx.safeTxHash,
              },
            },
            data: {
              confirmations,
              lastChecked: new Date(),
            },
          });
        }
      }
    }
  } catch (error) {
    result.errors.push(`Error checking multisig: ${error}`);
    console.error(`Error checking multisig ${multisig.address}:`, error);
  }

  return result;
}

// Check all enabled multisigs for new transactions
export async function checkAllMultisigs(): Promise<{
  totalChecked: number;
  totalNewTransactions: number;
  totalNotificationsSent: number;
  results: CheckResult[];
}> {
  const results: CheckResult[] = [];
  let totalNewTransactions = 0;
  let totalNotificationsSent = 0;

  try {
    // Get all enabled multisigs with their notification settings
    const multisigs = await prisma.multisig.findMany({
      where: { enabled: true },
      include: {
        user: {
          include: {
            notifications: true,
          },
        },
      },
    });

    console.log(`Checking ${multisigs.length} enabled multisigs...`);

    // Check each multisig
    for (const multisig of multisigs) {
      const notificationSettings = multisig.user.notifications[0] || null;
      const apiKey = process.env.SAFE_API_KEY; // Use global API key for now
      
      const result = await checkMultisig(multisig, notificationSettings, apiKey);
      results.push(result);
      
      totalNewTransactions += result.newTransactions;
      totalNotificationsSent += result.notificationsSent;
    }

    return {
      totalChecked: multisigs.length,
      totalNewTransactions,
      totalNotificationsSent,
      results,
    };
  } catch (error) {
    console.error('Error in checkAllMultisigs:', error);
    throw error;
  }
}
