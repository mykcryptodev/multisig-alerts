import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test parameters for OG image generation using the specific Safe address mentioned by the user
    const testParams = new URLSearchParams({
      safeTxHash: '0x94f814db70e0c388b400dc7d0e3e9c341ac32fb75b8693b70c102af3da918953',
      safeAddress: '0x3de0ba94a1f291a7c44bb029b765adb2c487063f', // User's specific Safe address
      chainId: '8453',
      to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      value: '0', // No ETH for token transaction
      nonce: '42',
      confirmations: '1',
      threshold: '1',
      owners: '0x3de0ba94a1f291a7c44bb029b765adb2c487063f', // Only 1 owner as expected
      confirmedSigners: '0x3de0ba94a1f291a7c44bb029b765adb2c487063f', // One confirmed signer
      method: 'approve',
      data: '0x095ea7b3000000000000000000000000111111125421ca6dc452d289314280a0f8842a6500000000000000000000000000000000000000000000000000000000001e8480', // Real approve data
    });

    const ogImageUrl = `/api/og/transaction?${testParams.toString()}`;
    
    return NextResponse.json({
      success: true,
      message: '🦜 Siggy OG Image Test Endpoint',
      ogImageUrl,
      testParams: Object.fromEntries(testParams.entries()),
      instructions: [
        '🖼️ Visit the ogImageUrl to see Siggy\'s beautiful new tropical-themed OG image!',
        '🦜 This tests the OG image generation with Siggy\'s vibrant gradient design',
        '🎨 Look for the new cyan-to-yellow tropical gradient and Lilita One font',
        '👥 The image should show 1 owner with Siggy\'s colorful styling',
        '🔍 Check the browser console for any errors',
        '✨ The new design matches the playful Siggy theme throughout the app!',
      ],
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: '🦜 Siggy couldn\'t generate test parameters! Something went squawk...',
      },
      { status: 500 }
      );
  }
}
