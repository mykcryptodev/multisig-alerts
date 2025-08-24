import { NextResponse } from 'next/server';

// Test function to show before/after formatting
function formatAIResponseForTelegram(text: string): string {
  if (!text) return text;
  
  let formatted = text;
  
  // Convert markdown links [text](url) to HTML <a href="url">text</a>
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert backticks to code tags for inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert **bold** to HTML bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  
  // Convert *italic* to HTML italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  
  // Clean up excessive newlines and whitespace
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  formatted = formatted.replace(/^\s+|\s+$/g, '');
  
  // Replace newlines with spaces for better Telegram display
  formatted = formatted.replace(/\n/g, ' ');
  
  // Clean up multiple spaces
  formatted = formatted.replace(/\s+/g, ' ');
  
  return formatted;
}

export async function GET() {
  const sampleAIResponse = `This blockchain transaction calls the \`transfer\` function on the USD Coin (USDC) contract at [\`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\`](https://thirdweb.com/8453/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) on Base. 

It sends precisely **1.0 USDC** (with 6 decimals, value = 1,000,000 base units) to the recipient address [\`0x06b0a2c6beea3fd215d47324dd49e1ee3a4a9f25\`](https://thirdweb.com/8453/0x06b0a2c6beea3fd215d47324dd49e1ee3a4a9f25). 

This is a *standard* ERC20 token transfer operation.`;

  const formatted = formatAIResponseForTelegram(sampleAIResponse);

  return NextResponse.json({
    original: sampleAIResponse,
    formatted: formatted,
    explanation: "The formatted version converts markdown to HTML for Telegram display"
  });
}

export const runtime = 'edge';
