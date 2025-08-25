// AI-powered transaction description utilities using Thirdweb AI
// Note: Using the Thirdweb AI API via their REST endpoint

import { config } from '@/config/env';

export interface TransactionData {
  data: string;
  to: string;
  value?: string;
  chainId: string;
  method?: string;
}

/**
 * Generate an AI description for a blockchain transaction
 * @param tx Transaction data
 * @returns AI-generated description or null if failed
 */
export async function generateTransactionDescription(tx: TransactionData): Promise<string | null> {
  if (!config.thirdweb.secretKey || !tx.data || tx.data === '0x') {
    return null;
  }

  try {
    console.log('🤖 Getting AI description for transaction...');
    
    // Build context for the AI
    const valueInfo = tx.value && tx.value !== '0' ? ` Value: ${tx.value} ETH` : '';
    const methodInfo = tx.method ? ` Method: ${tx.method}` : '';
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = 55000; // 55 second timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const aiResponse = await fetch('https://api.thirdweb.com/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': config.thirdweb.secretKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Provide a clear 1-3 sentence explanation of what this blockchain transaction does. Be specific about the action being performed and any tokens or contracts involved. Transaction data: ${tx.data}, Contract: ${tx.to}, Chain: ${tx.chainId}${valueInfo}${methodInfo}`
          }
        ],
        context: {
          chain_ids: [Number(tx.chainId)],
          from: tx.to
        }
      })
    });
    
      // Clear timeout on successful response
      clearTimeout(timeoutId);
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        
        // Thirdweb AI API returns the response in the 'message' field
        if (aiData.message) {
          const aiDescription = formatAIResponseForTelegram(aiData.message.trim());
          console.log('🤖 AI description generated successfully');
          return aiDescription;
        } else {
          console.warn('🤖 AI response missing expected structure:', aiData);
        }
      } else {
        const errorText = await aiResponse.text();
        console.warn('Thirdweb AI API request failed:', aiResponse.status, aiResponse.statusText, errorText);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn(`🤖 AI API request timed out after ${timeout / 1000} seconds`);
      } else {
        console.warn('🤖 AI API fetch error:', fetchError);
      }
    }
  } catch (error) {
    console.warn('Failed to get AI description:', error);
  }
  
  return null;
}

/**
 * Format AI response for Telegram HTML display
 * Converts markdown links to HTML and cleans up formatting
 * @param text Raw AI response text
 * @returns Telegram HTML formatted text
 */
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
