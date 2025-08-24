import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromJWT } from '@/lib/thirdweb-auth';

// Send Telegram notification directly
async function sendTelegramNotification(
  chatId: string,
  message: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('Telegram bot token not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

// Get user's notification settings
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = await getUserFromJWT(authToken);
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let settings = await prisma.notificationSetting.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.notificationSetting.create({
        data: {
          userId: user.id,
          enabled: true,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = await getUserFromJWT(authToken);
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { telegramChatId, enabled } = await request.json();

    // Update or create notification settings
    const settings = await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      update: {
        ...(telegramChatId !== undefined && { telegramChatId: telegramChatId || null }),
        ...(enabled !== undefined && { enabled }),
      },
      create: {
        userId: user.id,
        telegramChatId: telegramChatId || null,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

// Test Telegram connection
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = await getUserFromJWT(authToken);
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { notifications: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notificationSettings = user.notifications[0];
    if (!notificationSettings || !notificationSettings.telegramChatId) {
      return NextResponse.json(
        { error: 'Telegram chat ID must be configured first' },
        { status: 400 }
      );
    }

    // Send test message
    const testMessage = `🧪 Test notification from Multisig Alert!\n\nThis is a test message to verify your Telegram integration is working correctly.\n\nWallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\nTime: ${new Date().toLocaleString()}`;

    await sendTelegramNotification(
      notificationSettings.telegramChatId,
      testMessage
    );

    return NextResponse.json({
      message: 'Test message sent successfully',
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    return NextResponse.json(
      { error: 'Failed to send test message' },
      { status: 500 }
    );
  }
}
