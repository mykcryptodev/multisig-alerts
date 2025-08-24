# Vercel Serverless Function Timeout Strategies

## Problem
Thirdweb AI API calls can take a long time to return, potentially causing Vercel serverless functions to timeout before receiving a response.

## Implemented Solutions

### 1. **Request-Level Timeout (8 seconds)**
- Added `AbortController` to AI API requests
- Automatically cancels requests after 8 seconds
- Prevents hanging requests from blocking the function

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000);
```

### 2. **Promise Race Timeout (9 seconds)**
- Added a fallback timeout at the Telegram service level
- Uses `Promise.race()` to ensure AI description doesn't block message sending
- Gracefully continues without AI description if it takes too long

```typescript
const aiDescription = await Promise.race([
  generateTransactionDescription(tx),
  new Promise<null>((resolve) => setTimeout(() => resolve(null), 9000))
]);
```

### 3. **Vercel Function Configuration**
- Extended function timeout limits in `vercel.json`
- Critical functions get longer timeouts:
  - Cron job: 60 seconds
  - Test endpoints: 30 seconds

```json
{
  "functions": {
    "src/app/api/cron/check-safe/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 4. **Graceful Degradation**
- AI descriptions are now optional
- If AI fails or times out, message still sends
- Users get transaction details even without AI description

## Vercel Timeout Limits

| Plan | Timeout Limit |
|------|---------------|
| Hobby | 10 seconds |
| Pro | 60 seconds |
| Enterprise | 300 seconds |

## Best Practices

1. **Always use timeouts** for external API calls
2. **Make AI features optional** - don't block core functionality
3. **Use Promise.race()** for fallback behavior  
4. **Configure appropriate function timeouts** in vercel.json
5. **Log timeout events** for monitoring and debugging

## Monitoring

Watch for these log messages:
- `🤖 AI API request timed out after 8 seconds` - Request-level timeout
- `AI description failed, continuing without it` - Service-level fallback
- Check Vercel function logs for overall timeout issues

## Fallback Behavior

When AI description fails:
1. Request continues without AI section
2. All other transaction details are included
3. User still gets notification and can sign transaction
4. No impact on core Safe monitoring functionality
