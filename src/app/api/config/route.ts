import { NextResponse } from 'next/server';
import { config } from '@/config/env';

export async function GET() {
  try {
    // Only expose non-sensitive configuration to the client
    const clientConfig = {
      telegram: {
        isConfigured: !!(config.telegram.botToken && config.telegram.chatId),
        hasBotToken: !!config.telegram.botToken,
        hasChatId: !!config.telegram.chatId,
      },
      isFullyConfigured: !!(config.telegram.botToken && config.telegram.chatId),
    };

    return NextResponse.json({
      success: true,
      data: clientConfig,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load configuration',
      },
      { status: 500 }
    );
  }
}
