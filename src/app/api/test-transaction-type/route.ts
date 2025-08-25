// API route for testing different transaction types

import { NextRequest, NextResponse } from 'next/server';
import { getTelegram } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { transactionType } = await request.json();
    
    if (!transactionType || !['transfer', 'approval', 'contract'].includes(transactionType)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid transaction type. Must be: transfer, approval, or contract',
        },
        { status: 400 }
      );
    }

    const telegram = getTelegram();
    
    // Test 1: Send a simple text message
    const textSent = await telegram.sendMessage(`🧪 Testing ${transactionType} transaction type...`);
    
    if (!textSent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send text message. Check your Telegram configuration.',
        },
        { status: 500 }
      );
    }

    // Test 2: Try to send an OG image with transaction type specific data
    try {
      const testTx = createTestTransaction(transactionType);
      
      // Test the enhanced notification with OG image
      const imageSent = await telegram.notifyNewTransaction(testTx, 1, 2, '0x10f76316eB9f132a72E62481018F00cfEe326E15', '8453');
      
      if (imageSent) {
        return NextResponse.json({
          success: true,
          message: `✅ ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction test successful! Both text message and OG image sent.`,
          tests: {
            textMessage: 'Passed',
            ogImage: 'Passed',
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          message: `⚠️ ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction text message sent, but OG image failed. Check console for details.`,
          tests: {
            textMessage: 'Passed',
            ogImage: 'Failed',
          },
        });
      }
    } catch (imageError) {
      console.error(`${transactionType} transaction OG image test failed:`, imageError);
      
      return NextResponse.json({
        success: true,
        message: `⚠️ ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction text message sent, but OG image generation failed. Check console for details.`,
        tests: {
          textMessage: 'Passed',
          ogImage: 'Error',
        },
        imageError: imageError instanceof Error ? imageError.message : 'Unknown error',
      });
    }
    
  } catch (error) {
    console.error('Error in transaction type test:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test transaction type. Check your configuration and console logs.',
      },
      { status: 500 }
    );
  }
}

function createTestTransaction(transactionType: 'transfer' | 'approval' | 'contract') {
  const baseTransaction = {
    safeTxHash: '0x94f814db70e0c388b400dc7d0e3e9c341ac32fb75b8693b70c102af3da918953',
    safe: '0x10f76316eB9f132a72E62481018F00cfEe326E15', // Real Safe address
    value: '0', // No ETH value for token transactions
    nonce: 42,
    operation: 0, // 0 = CALL, 1 = DELEGATECALL
    confirmations: [
      {
        owner: '0x06b0A2C6beeA3fd215D47324DD49E1ee3a4a9F25', // Real owner
        signature: '0x94f814db70e0c388b400dc7d0e3e9c341ac32fb75b8693b70c102af3da918953',
      }
    ],
    confirmationsRequired: 2,
    detailedExecutionInfo: {
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      nonce: 42,
    }
  };

  switch (transactionType) {
    case 'transfer':
      return {
        ...baseTransaction,
        to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        dataDecoded: {
          method: 'transfer',
          parameters: [
            {
              name: 'to',
              type: 'address',
              value: '0x06b0A2C6beeA3fd215D47324DD49E1ee3a4a9F25'
            },
            {
              name: 'amount',
              type: 'uint256',
              value: '1000000' // 1 USDC (6 decimals)
            }
          ]
        },
        data: '0xa9059cbb00000000000000000000000006b0a2c6beea3fd215d47324dd49e1ee3a4a9f2500000000000000000000000000000000000000000000000000000000000f4240', // transfer(address,uint256)
      };

    case 'approval':
      return {
        ...baseTransaction,
        to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        dataDecoded: {
          method: 'approve',
          parameters: [
            {
              name: 'spender',
              type: 'address',
              value: '0x111111125421ca6dc452d289314280a0f8842a65' // 1inch router
            },
            {
              name: 'amount',
              type: 'uint256',
              value: '2000000' // 2 USDC (6 decimals)
            }
          ]
        },
        data: '0x095ea7b3000000000000000000000000111111125421ca6dc452d289314280a0f8842a6500000000000000000000000000000000000000000000000000000000001e8480', // approve(address,uint256)
      };

    case 'contract':
      return {
        ...baseTransaction,
        to: '0x4200000000000000000000000000000000000006', // WETH on Base
        dataDecoded: {
          method: 'deposit',
          parameters: []
        },
        data: '0xd0e30db0', // deposit() - WETH deposit function
        value: '1000000000000000000', // 1 ETH
      };

    default:
      return baseTransaction;
  }
}
