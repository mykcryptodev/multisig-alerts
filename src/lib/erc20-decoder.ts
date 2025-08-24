// ERC-20 transaction decoding utilities

import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { toTokens } from 'thirdweb/utils';
import { config, formatAddress } from '@/config/env';
import { getSocialProfiles } from 'thirdweb/social';
import { getZapperAccountInfo } from './zapper';

export interface ERC20TransactionDetails {
  isApprove: boolean;
  isTransfer: boolean;
  tokenName?: string;
  tokenSymbol?: string;
  spenderName?: string;
  spenderAddress?: string;
  recipientName?: string;
  recipientAddress?: string;
  amount?: string;
  formattedAmount?: string;
}

/**
 * Decode ERC-20 transactions (approve and transfer)
 * @param data Transaction data
 * @param to Contract address
 * @param client Thirdweb client
 * @param chain Chain configuration
 * @returns Decoded transaction details or null if not ERC-20
 */
export async function decodeERC20Transaction(
  data: string,
  to: string,
  client: ReturnType<typeof createThirdwebClient>,
  chain: { id: number; rpc: string }
): Promise<ERC20TransactionDetails | null> {
  try {
    const isApprove = data.startsWith('0x095ea7b3'); // approve(address,uint256)
    const isTransfer = data.startsWith('0xa9059cbb'); // transfer(address,uint256)
    
    if (!isApprove && !isTransfer) {
      return { isApprove: false, isTransfer: false };
    }

    // Both approve and transfer have the same parameter structure
    // approve(address spender, uint256 amount) or transfer(address to, uint256 amount)
    // data format: 0x[function_sig] + 32 bytes address + 32 bytes amount
    if (data.length < 138) { // 10 chars for function sig + 128 chars for params
      return { isApprove: false, isTransfer: false };
    }

    const targetAddress = '0x' + data.slice(34, 74); // Extract spender/recipient address
    const amountHex = data.slice(74, 138); // Extract amount
    const amountBigInt = BigInt('0x' + amountHex);

    // Get token info
    const tokenContract = getContract({
      client,
      chain,
      address: to,
    });

    const [tokenNameResult, tokenSymbolResult, tokenDecimalsResult] = await Promise.allSettled([
      readContract({
        contract: tokenContract,
        method: 'function name() view returns (string)',
        params: [],
      }),
      readContract({
        contract: tokenContract,
        method: 'function symbol() view returns (string)',
        params: [],
      }),
      readContract({
        contract: tokenContract,
        method: 'function decimals() view returns (uint8)',
        params: [],
      }),
    ]);

    const tokenName = tokenNameResult.status === 'fulfilled' ? tokenNameResult.value : 'Unknown Token';
    const tokenSymbol = tokenSymbolResult.status === 'fulfilled' ? tokenSymbolResult.value : 'UNKNOWN';
    const decimals = tokenDecimalsResult.status === 'fulfilled' ? Number(tokenDecimalsResult.value) : 18;

    // Format amount
    let formattedAmount = 'Unknown';
    try {
      if (amountBigInt === BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
        formattedAmount = 'Unlimited';
      } else {
        formattedAmount = toTokens(amountBigInt, decimals);
      }
    } catch (error) {
      console.warn('Failed to format token amount:', error);
    }

    // Resolve target address name (spender for approve, recipient for transfer)
    const targetName = await resolveAddressName(targetAddress, client, isApprove);

    if (isApprove) {
      return {
        isApprove: true,
        isTransfer: false,
        tokenName,
        tokenSymbol,
        spenderName: targetName,
        spenderAddress: targetAddress,
        amount: amountBigInt.toString(),
        formattedAmount,
      };
    } else {
      return {
        isApprove: false,
        isTransfer: true,
        tokenName,
        tokenSymbol,
        recipientName: targetName,
        recipientAddress: targetAddress,
        amount: amountBigInt.toString(),
        formattedAmount,
      };
    }

  } catch {
    console.warn('Failed to decode ERC-20 transaction');
    return { isApprove: false, isTransfer: false };
  }
}

/**
 * Resolve an address to a human-readable name using multiple sources
 * @param address Address to resolve
 * @param client Thirdweb client
 * @param isApproval Whether this is for an approval (affects contract name lookup)
 * @returns Resolved name or formatted address
 */
async function resolveAddressName(address: string, client: ReturnType<typeof createThirdwebClient>, isApproval: boolean = false): Promise<string> {
  const name = formatAddress(address);
  const targetLabel = isApproval ? 'spender' : 'recipient';
  
  // 1. Try Thirdweb social profiles first
  try {
    const profiles = await getSocialProfiles({
      address: address,
      client,
    });
    
    const farcasterProfile = profiles.find(p => p.type === 'farcaster');
    const lensProfile = profiles.find(p => p.type === 'lens');
    const ensProfile = profiles.find(p => p.type === 'ens');
    
    const bestProfile = farcasterProfile || lensProfile || ensProfile;
    if (bestProfile?.name) {
      return bestProfile.name;
    }
  } catch (error) {
    console.warn(`Failed to fetch ${targetLabel} social profile:`, error);
  }

  // 2. If no social profile and it's an approval, try to get contract name
  // Note: This would require a proper chain object to be passed in
  // Skipping for now to avoid type errors

  // 3. If still no name, try Zapper as final fallback
  if (name === formatAddress(address)) {
    try {
      const zapperInfo = await getZapperAccountInfo([address]);
      const zapperProfile = zapperInfo[address];
      if (zapperProfile?.name && zapperProfile.source !== 'address') {
        console.log(`Found Zapper name for ${targetLabel}: ${zapperProfile.name} (${zapperProfile.source})`);
        return zapperProfile.name;
      }
    } catch (error) {
      console.warn(`Failed to fetch Zapper profile for ${targetLabel}:`, error);
    }
  }

  return name;
}

/**
 * Create a Thirdweb client if configured
 * @returns Thirdweb client or null if not configured
 */
export function createThirdwebClientIfConfigured() {
  if (!config.thirdweb.clientId) {
    return null;
  }

  return createThirdwebClient({
    clientId: config.thirdweb.clientId,
  });
}
