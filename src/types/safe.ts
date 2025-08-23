// Type definitions for Safe Client API responses

export interface SafeTransaction {
  safeTxHash: string;
  to?: string;
  receiver?: string;
  value?: string;
  operation?: number;
  nonce?: number;
  confirmations?: Confirmation[];
  confirmationsRequired?: number;
  confirmationsRequiredFromSafe?: number;
  detailedExecutionInfo?: DetailedExecutionInfo;
  dataDecoded?: DataDecoded;
  executionDate?: string | null;
  submissionDate?: string;
}

export interface Confirmation {
  owner: string;
  submissionDate: string;
  transactionHash?: string;
  signature: string;
  signatureType?: string;
}

export interface DetailedExecutionInfo {
  nonce?: number;
  confirmations?: Confirmation[];
  confirmationsRequired?: number;
  confirmationsSubmitted?: number;
}

export interface DataDecoded {
  method?: string;
  parameters?: any[];
  value?: string;
}

export interface QueuedTransactionGroup {
  nonce: number;
  transactions: SafeTransaction[];
}

export interface QueuedTransactionsResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: QueuedTransactionGroup[];
}

export interface SeenTransaction {
  safeTxHash: string;
  firstSeen: string;
  lastChecked: string;
  confirmations: number;
  threshold: number;
}
