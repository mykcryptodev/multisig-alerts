import { NextResponse } from 'next/server';
import { config, getChainConfig } from '@/config/env';

export async function GET() {
  try {
    const chainConfig = getChainConfig(config.safe.chainId);
    
    // Only expose non-sensitive configuration to the client
    const clientConfig = {
      safe: {
        address: config.safe.address,
        chainId: config.safe.chainId,
        chainName: chainConfig.name,
        explorer: chainConfig.explorer,
      },
      telegram: {
        isConfigured: !!config.telegram.botToken,
        hasBotToken: !!config.telegram.botToken,
        hasChatId: !!config.telegram.chatId,
      },
      isFullyConfigured: !!(config.safe.address && config.telegram.botToken),
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
