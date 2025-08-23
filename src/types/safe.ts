// Type definitions for Safe monitoring system

// Storage types for tracking seen transactions
export interface SeenTransaction {
  safeTxHash: string;
  firstSeen: string;
  lastChecked: string;
  confirmations: number;
  threshold: number;
}
