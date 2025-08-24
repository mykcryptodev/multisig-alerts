// API endpoints for managing notification settings
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// GET /api/notifications - Get user's notification settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.notificationSetting.findUnique({
      where: { userId: session.user.id },
    });

    // Return empty settings if none exist
    if (!settings) {
      return NextResponse.json({
        telegramBotToken: null,
        telegramChatId: null,
        enabled: false,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { telegramBotToken, telegramChatId, enabled } = await request.json();

    // Upsert notification settings
    const settings = await prisma.notificationSetting.upsert({
      where: { userId: session.user.id },
      update: {
        telegramBotToken,
        telegramChatId,
        enabled: enabled ?? true,
      },
      create: {
        userId: session.user.id,
        telegramBotToken,
        telegramChatId,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/test - Test Telegram connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { telegramBotToken, telegramChatId } = await request.json();

    if (!telegramBotToken || !telegramChatId) {
      return NextResponse.json(
        { error: 'Bot token and chat ID are required' },
        { status: 400 }
      );
    }

    // Test the Telegram connection
    const testMessage = '🔔 Test notification from Multisig Alert\n\nYour Telegram integration is working correctly!';
    
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: testMessage,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${result.description}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}