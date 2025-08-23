import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test parameters for OG image generation
    const testParams = new URLSearchParams({
      safeTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      safeAddress: '0x1234567890123456789012345678901234567890',
      chainId: '8453',
      to: '0xabcdef1234567890abcdef1234567890abcdef1234',
      value: '1000000000000000000', // 1 ETH
      nonce: '42',
      confirmations: '1',
      threshold: '2',
      owners: '0x1234567890123456789012345678901234567890,0xabcdef1234567890abcdef1234567890abcdef1234,0x987654321098765432109876543210987654321098',
      method: 'transfer',
    });

    const ogImageUrl = `/api/og/transaction?${testParams.toString()}`;
    
    return NextResponse.json({
      success: true,
      message: 'OG Image test endpoint',
      ogImageUrl,
      testParams: Object.fromEntries(testParams.entries()),
      instructions: [
        'Visit the ogImageUrl to see the generated image',
        'This tests the OG image generation with sample data',
        'Check the browser console for any errors',
        'The image should show transaction details and owner profiles',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate test parameters',
      },
      { status: 500 }
    );
  }
}
