// Storage service for persisting seen transactions
// Using Upstash Redis for reliable, fast storage

import { Redis } from '@upstash/redis';
import { SeenTransaction } from '@/types/safe';
import { config } from '@/config/env';

class StorageService {
  private redis: Redis | null = null;
  private redisAvailable: boolean = false;

  constructor() {
    // Check if Upstash Redis is configured
    this.redisAvailable = !!(config.upstash.redisUrl && config.upstash.redisToken);
    
    if (this.redisAvailable) {
      this.redis = new Redis({
        url: config.upstash.redisUrl,
        token: config.upstash.redisToken,
      });
    }
  }

  // In-memory fallback storage
  private memoryStore: Map<string, SeenTransaction> = new Map();

  async getSeenTransaction(safeTxHash: string): Promise<SeenTransaction | null> {
    if (this.redis) {
      try {
        const data = await this.redis.get(`safe:tx:${safeTxHash}`);
        return data as SeenTransaction | null;
      } catch (error) {
        console.error('Error reading from Redis:', error);
        // Fallback to in-memory
        return this.memoryStore.get(safeTxHash) || null;
      }
    }
    
    return this.memoryStore.get(safeTxHash) || null;
  }

  async setSeenTransaction(transaction: SeenTransaction): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(`safe:tx:${transaction.safeTxHash}`, transaction);
        console.log(`Successfully stored transaction in Redis: ${transaction.safeTxHash}`);
        return;
      } catch (error) {
        console.error('Error writing to Redis:', error);
        // Fallback to in-memory
        this.memoryStore.set(transaction.safeTxHash, transaction);
      }
    } else {
      this.memoryStore.set(transaction.safeTxHash, transaction);
    }
  }

  async getAllSeenTransactions(): Promise<SeenTransaction[]> {
    if (this.redis) {
      try {
        // Get all keys matching our pattern
        const keys = await this.redis.keys('safe:tx:*');
        if (keys.length === 0) {
          return [];
        }
        
        // Get all transactions in one batch
        const transactions = await this.redis.mget(...keys);
        return transactions.filter(tx => tx !== null) as SeenTransaction[];
      } catch (error) {
        console.error('Error listing from Redis:', error);
        // Fallback to in-memory
        return Array.from(this.memoryStore.values());
      }
    }
    
    return Array.from(this.memoryStore.values());
  }

  async hasSeenTransaction(safeTxHash: string): Promise<boolean> {
    const tx = await this.getSeenTransaction(safeTxHash);
    return tx !== null;
  }

  async updateSeenTransaction(
    safeTxHash: string, 
    updates: Partial<SeenTransaction>
  ): Promise<void> {
    const existing = await this.getSeenTransaction(safeTxHash);
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        lastChecked: new Date().toISOString(),
      };
      
      await this.setSeenTransaction(updated);
    }
  }

  async deleteSeenTransaction(safeTxHash: string): Promise<boolean> {
    if (this.redis) {
      try {
        const result = await this.redis.del(`safe:tx:${safeTxHash}`);
        console.log(`Successfully deleted transaction from Redis: ${safeTxHash}`);
        return result > 0;
      } catch (error) {
        console.error('Error deleting from Redis:', error);
        // Fallback to in-memory
        return this.memoryStore.delete(safeTxHash);
      }
    }
    
    // Delete from in-memory store
    return this.memoryStore.delete(safeTxHash);
  }

  async clearAllTransactions(): Promise<number> {
    if (this.redis) {
      try {
        // Get all keys matching our pattern
        const keys = await this.redis.keys('safe:tx:*');
        const count = keys.length;
        
        if (count > 0) {
          // Delete all transaction keys
          await this.redis.del(...keys);
          console.log(`Successfully cleared ${count} transactions from Redis`);
        }
        
        return count;
      } catch (error) {
        console.error('Error clearing Redis:', error);
        // Fallback to in-memory
        const count = this.memoryStore.size;
        this.memoryStore.clear();
        return count;
      }
    }
    
    // Clear in-memory store
    const count = this.memoryStore.size;
    this.memoryStore.clear();
    return count;
  }


}

// Lazy initialization to avoid errors during build
let _storage: StorageService | null = null;

export function getStorage(): StorageService {
  if (!_storage) {
    _storage = new StorageService();
  }
  return _storage;
}
