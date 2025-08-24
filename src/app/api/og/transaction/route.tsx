import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { formatAddress, formatEthValue, getChainConfig, chainConfig } from '@/config/env';
import { decodeERC20Transaction, createThirdwebClientIfConfigured } from '@/lib/erc20-decoder';
import { resolveMultipleProfiles, resolveSingleAddress } from '@/lib/profile-resolver';
import { TransactionImage } from '@/components/og/TransactionImage';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse transaction data from query parameters
    const safeTxHash = searchParams.get('safeTxHash');
    const safeAddress = searchParams.get('safeAddress');
    const chainId = searchParams.get('chainId') || '8453';
    const to = searchParams.get('to');
    const value = searchParams.get('value') || '0';
    const nonce = searchParams.get('nonce');
    const confirmations = searchParams.get('confirmations') || '0';
    const threshold = searchParams.get('threshold') || '1';
    const owners = searchParams.get('owners')?.split(',') || [];
    const confirmedSigners = searchParams.get('confirmedSigners')?.split(',') || [];
    const method = searchParams.get('method');
    const data = searchParams.get('data'); // Transaction data for decoding

    if (!safeTxHash || !safeAddress) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              color: 'white',
              fontSize: 24,
            }}
          >
            Missing required parameters
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Get chain configuration
    const chain = getChainConfig(chainId);
    const valueEth = formatEthValue(value);
    
    // Try to decode ERC-20 transaction (approve or transfer)
    let tokenDetails: any = null;
    const client = createThirdwebClientIfConfigured();
    if (client && data && to) {
      try {
        const chainIdNum = Number(chainId);
        const chainObj = chainConfig[chainIdNum as keyof typeof chainConfig];
        
        if (chainObj) {
          tokenDetails = await decodeERC20Transaction(data, to, client, chainObj);
        }
      } catch (error) {
        console.warn('Failed to decode ERC-20 transaction:', error);
      }
    }
    
    // Resolve profiles for owners and "to" address
    let ownerProfiles: any[] = [];
    let toAddressName = 'Unknown';
    
    if (client) {
      // Resolve owner profiles
      ownerProfiles = await resolveMultipleProfiles(owners, confirmedSigners, client);
      
      // Resolve "to" address name
      if (to) {
        const toProfile = await resolveSingleAddress(to, client, chainId);
        toAddressName = toProfile.name;
      }
    } else {
      // Fallback without client
      ownerProfiles = owners.map(owner => ({
        address: owner,
        name: formatAddress(owner),
        hasSigned: confirmedSigners.includes(owner.toLowerCase()) || confirmedSigners.includes(owner),
      }));
      toAddressName = to ? formatAddress(to) : 'Unknown';
    }

    return new ImageResponse(
      (
        <TransactionImage
          safeTxHash={safeTxHash}
          safeAddress={safeAddress}
          chainName={chain.name}
          toAddress={to || ''}
          toAddressName={toAddressName}
          valueEth={valueEth}
          confirmations={confirmations}
          threshold={threshold}
          method={method || undefined}
          nonce={nonce || undefined}
          tokenDetails={tokenDetails}
          ownerProfiles={ownerProfiles}
        />
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          Error generating image
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}