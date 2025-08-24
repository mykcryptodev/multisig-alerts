// Multi-tenant multisig monitoring service
import SafeApiKit from '@safe-global/api-kit';
import { prisma } from '@/lib/db';
import { Multisig, NotificationSetting } from '@prisma/client';
import { checksumAddress } from 'thirdweb/utils';
import { TelegramService } from './telegram';

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
  const configOptions: { chainId: bigint; apiKey?: string } = {
    chainId: BigInt(chainId),
  };
  
  if (apiKey) {
    configOptions.apiKey = apiKey;
  }
  
  return new SafeApiKit(configOptions);
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
    
    // Convert address to checksummed format to avoid validation errors
    const checksummedAddress = checksumAddress(multisig.address);
    
    // Get pending transactions
    const pendingTxs = await safeApi.getPendingTransactions(checksummedAddress);
    
    if (pendingTxs.results && pendingTxs.results.length > 0) {
      // Get Safe info for threshold
      const safeInfo = await safeApi.getSafeInfo(checksummedAddress);
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
          console.log('🔔 Checking notification settings:', {
            enabled: notificationSettings?.enabled,
            hasBotToken: !!notificationSettings?.telegramBotToken,
            hasChatId: !!notificationSettings?.telegramChatId,
            botTokenLength: notificationSettings?.telegramBotToken?.length,
            chatId: notificationSettings?.telegramChatId
          });
          
          if (notificationSettings?.enabled && 
              notificationSettings.telegramBotToken && 
              notificationSettings.telegramChatId) {
            
            try {
              // Create TelegramService instance with user's credentials
              const telegramService = new TelegramService();
              telegramService.setCredentials(
                notificationSettings.telegramBotToken,
                notificationSettings.telegramChatId
              );
              
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

              console.log('📱 Attempting to send notification...');
              
              // Use the advanced notification system with AI description and OG image
              const sent = await telegramService.notifyNewTransaction(
                telegramTx,
                confirmations,
                threshold
              );
              
              console.log('📱 Notification result:', { sent, safeTxHash: tx.safeTxHash });
              
              if (sent) {
                result.notificationsSent++;
                console.log('✅ Notification sent successfully');
                
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
                console.log('❌ Notification failed to send');
                result.errors.push(`Failed to send notification for ${tx.safeTxHash}`);
              }
            } catch (error) {
              console.error('Error sending advanced notification:', error);
              result.errors.push(`Notification error: ${error}`);
            }
          } else {
            console.log('🔔 Notification skipped - missing settings or credentials');
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
