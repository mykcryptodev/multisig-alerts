// API route for testing Telegram connection

import { NextRequest, NextResponse } from 'next/server';
import { getTelegram } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const telegram = getTelegram();
    const sent = await telegram.sendTestMessage();
    
    if (sent) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test message. Check your Telegram configuration.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test message:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
