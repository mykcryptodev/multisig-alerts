// API route for testing Telegram connection

import { NextRequest, NextResponse } from 'next/server';
import { getTelegram } from '@/lib/telegram';

export async function POST(request: NextRequest) {
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
        safeTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        safe: '0x1234567890123456789012345678901234567890',
        to: '0xabcdef1234567890abcdef1234567890abcdef1234',
        value: '1000000000000000000', // 1 ETH in wei
        nonce: 42,
        operation: 0, // 0 = CALL, 1 = DELEGATECALL
        confirmations: [
          {
            owner: '0x1234567890123456789012345678901234567890',
            signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          }
        ],
        confirmationsRequired: 2,
        dataDecoded: {
          method: 'transfer',
          parameters: [
            {
              name: 'to',
              type: 'address',
              value: '0xabcdef1234567890abcdef1234567890abcdef1234'
            },
            {
              name: 'amount',
              type: 'uint256',
              value: '1000000000000000000'
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
