// API route for testing Telegram connection

import { NextResponse } from 'next/server';
import { getTelegram } from '@/lib/telegram';

export async function POST() {
  try {
    const telegram = getTelegram();
    
    // Test 1: Send a simple text message
    const textSent = await telegram.sendMessage('🧪 Testing Telegram connection...');
    
    if (!textSent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send text message. Check your Telegram configuration.',
        },
        { status: 500 }
      );
    }

    // Test 2: Try to send an OG image with realistic transaction data
    try {
      // Create realistic transaction data structure that matches Safe API responses
      const testTx = {
        safeTxHash: '0x94f814db70e0c388b400dc7d0e3e9c341ac32fb75b8693b70c102af3da918953',
        safe: '0x10f76316eB9f132a72E62481018F00cfEe326E15', // Use actual Safe address
        to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        value: '0', // No ETH value for token transaction
        data: '0xa9059cbb00000000000000000000000006b0a2c6beea3fd215d47324dd49e1ee3a4a9f2500000000000000000000000000000000000000000000000000000000001e8480', // ERC-20 transfer data
        nonce: 42,
        operation: 0, // 0 = CALL, 1 = DELEGATECALL
        confirmations: [
          {
            owner: '0x06b0A2C6beeA3fd215D47324DD49E1ee3a4a9F25', // Use actual owner
            signature: '0x94f814db70e0c388b400dc7d0e3e9c341ac32fb75b8693b70c102af3da918953',
          }
        ],
        confirmationsRequired: 2,
        dataDecoded: {
          method: 'transfer',
          parameters: [
            {
              name: 'to',
              type: 'address',
              value: '0x06b0A2C6beeA3fd215D47324DD49E1ee3a4a9F25' // Valid recipient
            },
            {
              name: 'amount',
              type: 'uint256',
              value: '2000000' // 2 USDC (6 decimals)
            }
          ]
        },
        detailedExecutionInfo: {
          confirmationsRequired: 2,
          confirmationsSubmitted: 1,
          nonce: 42,
        }
      };

      // Test the enhanced notification with OG image
      const imageSent = await telegram.notifyNewTransaction(testTx, 1, 2);
      
      if (imageSent) {
        return NextResponse.json({
          success: true,
          message: '✅ Telegram test successful! Both text message and OG image sent.',
          tests: {
            textMessage: 'Passed',
            ogImage: 'Passed',
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          message: '⚠️ Telegram text message sent, but OG image failed. Check console for details.',
          tests: {
            textMessage: 'Passed',
            ogImage: 'Failed',
          },
        });
      }
    } catch (imageError) {
      console.error('OG image test failed:', imageError);
      
      return NextResponse.json({
        success: true,
        message: '⚠️ Telegram text message sent, but OG image generation failed. Check console for details.',
        tests: {
          textMessage: 'Passed',
          ogImage: 'Error',
        },
        imageError: imageError instanceof Error ? imageError.message : 'Unknown error',
      });
    }
    
  } catch (error) {
    console.error('Error in Telegram test:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test Telegram connection. Check your configuration and console logs.',
      },
      { status: 500 }
    );
  }
}
