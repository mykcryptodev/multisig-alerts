import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET() {
  try {
    const storage = getStorage();
    
    // Get all seen transactions from storage
    const allTransactions = await storage.getAllSeenTransactions();
    
    // Also check the storage configuration status
    const redisAvailable = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    
    // Get some additional stats
    const totalTransactions = allTransactions.length;
    const oldestTransaction = allTransactions.length > 0 
      ? allTransactions.reduce((oldest, current) => 
          new Date(current.firstSeen) < new Date(oldest.firstSeen) ? current : oldest
        )
      : null;
    
    const newestTransaction = allTransactions.length > 0 
      ? allTransactions.reduce((newest, current) => 
          new Date(current.firstSeen) > new Date(newest.firstSeen) ? current : newest
        )
      : null;

    return NextResponse.json({
      success: true,
      storage: {
        type: redisAvailable ? 'Upstash Redis' : 'In-Memory',
        redisAvailable,
        redisUrl: process.env.UPSTASH_REDIS_REST_URL ? '[CONFIGURED]' : '[NOT SET]'
      },
      stats: {
        totalTransactions,
        oldestTransaction: oldestTransaction ? {
          hash: oldestTransaction.safeTxHash,
          firstSeen: oldestTransaction.firstSeen,
          confirmations: oldestTransaction.confirmations,
          threshold: oldestTransaction.threshold
        } : null,
        newestTransaction: newestTransaction ? {
          hash: newestTransaction.safeTxHash,
          firstSeen: newestTransaction.firstSeen,
          confirmations: newestTransaction.confirmations,
          threshold: newestTransaction.threshold
        } : null
      },
      transactions: allTransactions.map(tx => ({
        safeTxHash: tx.safeTxHash,
        firstSeen: tx.firstSeen,
        lastChecked: tx.lastChecked,
        confirmations: tx.confirmations,
        threshold: tx.threshold,
        age: Math.round((Date.now() - new Date(tx.firstSeen).getTime()) / (1000 * 60 * 60 * 24) * 10) / 10 // days with 1 decimal
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('Error reading storage:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to read storage',
      details: error instanceof Error ? error.message : 'Unknown error',
      storage: {
        type: process.env.UPSTASH_REDIS_REST_URL ? 'Upstash Redis' : 'In-Memory',
        redisAvailable: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        redisUrl: process.env.UPSTASH_REDIS_REST_URL ? '[CONFIGURED]' : '[NOT SET]'
      }
    }, { status: 500 });
  }
}

// Optional: Add a POST endpoint to manually add test data for debugging
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'add-test-data') {
      const storage = getStorage();
      
      // Add some test transaction data
      const testTransaction = {
        safeTxHash: `test-${Date.now()}`,
        firstSeen: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        confirmations: Math.floor(Math.random() * 5),
        threshold: 3
      };
      
      await storage.setSeenTransaction(testTransaction);
      
      return NextResponse.json({
        success: true,
        message: 'Test transaction added',
        transaction: testTransaction
      });
    }
    
    if (action === 'delete-transaction') {
      const { safeTxHash } = body;
      
      if (!safeTxHash) {
        return NextResponse.json({
          success: false,
          error: 'safeTxHash is required for delete operation'
        }, { status: 400 });
      }
      
      const storage = getStorage();
      const deleted = await storage.deleteSeenTransaction(safeTxHash);
      
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Transaction deleted successfully' : 'Transaction not found',
        safeTxHash
      });
    }
    
    if (action === 'clear-all') {
      const storage = getStorage();
      const deletedCount = await storage.clearAllTransactions();
      
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${deletedCount} transactions`,
        deletedCount
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Supported actions: add-test-data, delete-transaction, clear-all'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in POST /api/test-storage:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
