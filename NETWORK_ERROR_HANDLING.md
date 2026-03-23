# Network Error Handling Implementation

## Overview

Task 18.7 implements comprehensive network error handling for the VidyaSetu platform. This ensures users receive clear feedback when network issues occur and the system automatically retries failed requests when appropriate.

## Components

### 1. Network Error Handler (`lib/networkErrorHandler.ts`)

Core utility module providing:

- **Error Detection Functions**:
  - `isNetworkError()` - Detects network connectivity failures
  - `isTimeoutError()` - Detects request timeouts
  - `isServerError()` - Detects 5xx server errors
  - `isClientError()` - Detects 4xx client errors
  - `isRetryableError()` - Determines if an error should trigger a retry

- **Error Enhancement**:
  - `createNetworkError()` - Creates standardized NetworkError objects with metadata
  - `getNetworkErrorMessage()` - Converts technical errors to user-friendly messages

- **Retry Logic**:
  - `calculateBackoffDelay()` - Exponential backoff with jitter (1s, 2s, 4s, max 30s)
  - `retryWithBackoff()` - Automatic retry wrapper with configurable attempts
  - `withNetworkErrorHandling()` - Complete error handling wrapper for API calls

- **Network Status**:
  - `isOnline()` - Check current connectivity status
  - `waitForOnline()` - Wait for connection to restore
  - `monitorNetworkStatus()` - Subscribe to online/offline events

### 2. Network Status Hook (`lib/useNetworkStatus.ts`)

React hook for monitoring network connectivity:

```typescript
const { isOnline, wasOffline, lastOnlineTime, resetWasOffline } = useNetworkStatus();
```

Provides:
- Real-time online/offline status
- Timestamps of connectivity changes
- Flag to detect when connection is restored

### 3. Network Status Indicator (`components/NetworkStatusIndicator.tsx`)

Visual component that:
- Shows persistent notification when offline
- Displays "Connection restored" toast when back online
- Includes loading spinner during reconnection attempts
- Auto-dismisses after connection is stable

### 4. API Integration (`lib/api.ts`)

Critical API functions wrapped with network error handling:

- `login()` - 2 retries, 15s timeout
- `register()` - 2 retries, 15s timeout
- `generateQuizQuestions()` - 3 retries with exponential backoff (already implemented)

### 5. Auth Context Enhancement (`lib/auth.tsx`)

Login function enhanced to:
- Catch network errors
- Convert to user-friendly messages
- Preserve error context for debugging

## User Experience

### When Network Fails

1. **Immediate Feedback**: Red notification appears at bottom-left
2. **Clear Message**: "No internet connection. Please check your network."
3. **Visual Indicator**: Spinning loader shows reconnection attempt
4. **Persistent Display**: Notification stays until connection restored

### When Connection Restores

1. **Success Toast**: Green notification "Connection restored. You're back online!"
2. **Auto-dismiss**: Toast disappears after 5 seconds
3. **Offline indicator removed**: Bottom notification clears

### During API Calls

1. **Automatic Retries**: Failed requests retry with exponential backoff
2. **Timeout Protection**: Requests timeout after configured duration
3. **User-Friendly Errors**: Technical errors converted to readable messages

## Error Messages

### Network Errors
- "Network connection failed. Please check your internet connection and try again."
- "Request timed out. Please check your internet connection and try again."

### HTTP Status Codes
- 400: "Invalid request. Please check your input and try again."
- 401: "Authentication required. Please log in again."
- 403: "Access denied. You don't have permission to perform this action."
- 404: "Resource not found. The requested item may have been deleted."
- 429: "Too many requests. Please wait a moment and try again."
- 500: "Internal server error. Please try again later."
- 503: "Service unavailable. Please try again later."

## Configuration

### Retry Options

```typescript
interface NetworkErrorOptions {
  maxRetries?: number;      // Default: 3
  retryDelay?: number;      // Default: 1000ms
  timeout?: number;         // Default: 30000ms
  showToast?: boolean;      // Default: false
}
```

### Usage Example

```typescript
// Wrap any API call with network error handling
const result = await withNetworkErrorHandling(
  async () => {
    return await supabase.from('courses').select('*');
  },
  { maxRetries: 2, timeout: 10000 }
);
```

## Integration Points

### App.tsx
- `NetworkStatusIndicator` added to root component
- Monitors connectivity throughout app lifecycle

### lib/utils.ts
- Re-exports all network error handling utilities
- Provides single import point for error handling

### lib/api.ts
- Critical auth functions wrapped with error handling
- AI generation already has retry logic
- Ready for additional function wrapping as needed

## Testing Recommendations

### Manual Testing

1. **Offline Scenario**:
   - Disable network connection
   - Verify offline indicator appears
   - Re-enable network
   - Verify "Connection restored" toast

2. **Slow Network**:
   - Throttle network to 3G
   - Attempt login
   - Verify timeout handling

3. **Server Error**:
   - Mock 500 error response
   - Verify retry attempts
   - Verify user-friendly error message

### Browser DevTools

- Network tab: Throttle to "Offline" or "Slow 3G"
- Console: Monitor retry attempts and error logs
- Application tab: Toggle online/offline

## Future Enhancements

1. **Offline Queue**: Store failed requests and retry when online
2. **Request Cancellation**: Cancel pending requests on navigation
3. **Bandwidth Detection**: Adjust retry strategy based on connection speed
4. **Analytics**: Track network error frequency and patterns
5. **Service Worker**: Cache responses for offline access

## Requirements Validation

**Validates: Requirement 18.7 - Add network error handling**

This implementation provides:
- ✅ Network error detection and classification
- ✅ Automatic retry with exponential backoff
- ✅ User-friendly error messages
- ✅ Real-time connectivity monitoring
- ✅ Visual feedback for connection status
- ✅ Timeout protection for long-running requests
- ✅ Integration with existing error handling (Toast, ErrorBoundary)

## Files Modified/Created

### Created
- `lib/networkErrorHandler.ts` - Core error handling utilities
- `lib/useNetworkStatus.ts` - React hook for network monitoring
- `components/NetworkStatusIndicator.tsx` - Visual status component
- `NETWORK_ERROR_HANDLING.md` - This documentation

### Modified
- `lib/api.ts` - Added network error handling to auth functions
- `lib/auth.tsx` - Enhanced login with error messaging
- `lib/utils.ts` - Re-exported network utilities
- `App.tsx` - Added NetworkStatusIndicator component
