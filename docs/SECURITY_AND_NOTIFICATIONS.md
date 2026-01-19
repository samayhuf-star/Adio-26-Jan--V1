# Security Guardrails and Notification System

This document outlines the security measures, rate limiting, usage tracking, and notification system implemented in the Adiology platform to prevent misuse and guide users at every step.

## Overview

The platform now includes comprehensive security guardrails and a user-friendly notification system to:
- Prevent bulk misuse and platform abuse
- Track user usage and enforce quotas
- Provide clear, helpful guidance at every step
- Validate inputs with helpful error messages
- Rate limit operations to prevent abuse

## Components

### 1. Notification System (`src/utils/notifications.ts`)

A centralized notification service using Sonner toast notifications.

**Features:**
- Success, error, warning, info, and loading notifications
- Configurable duration and priority
- Action buttons for user interaction
- Promise-based notifications for async operations

**Usage:**
```typescript
import { notifications } from '../utils/notifications';

// Success notification
notifications.success('Operation completed', {
  title: 'Success',
  description: 'Your action was successful',
});

// Error notification
notifications.error('Something went wrong', {
  title: 'Error',
  priority: 'high',
});

// Loading notification
const toast = notifications.loading('Processing...');
// Later: toast() to dismiss
```

### 2. Rate Limiter (`src/utils/rateLimiter.ts`)

Prevents abuse by limiting the number of requests per time window.

**Default Limits:**
- Keyword Generation: 10 requests per minute
- CSV Export: 20 requests per minute
- Ad Creation: 50 requests per minute
- Campaign Creation: 5 requests per 5 minutes
- API Calls: 100 requests per minute

**Features:**
- Time-window based limiting
- Automatic reset after window expires
- Customizable limits per action type
- Usage statistics tracking

**Usage:**
```typescript
import { rateLimiter } from '../utils/rateLimiter';

const result = rateLimiter.checkLimit('keyword-generation');
if (!result.allowed) {
  // Show error message
  notifications.error(result.message);
  return;
}
```

### 3. Usage Tracker (`src/utils/usageTracker.ts`)

Tracks daily and monthly usage quotas to prevent bulk misuse.

**Default Quotas:**
- Keyword Generation: 100/day, 2000/month, 500 per action
- CSV Export: 50/day, 1000/month, 1 per action
- Ad Creation: 200/day, 5000/month, 25 per action
- Campaign Creation: 20/day, 500/month, 1 per action

**Features:**
- Daily and monthly limits
- Per-action bulk limits
- Warning system when approaching limits
- LocalStorage-based tracking

**Usage:**
```typescript
import { usageTracker } from '../utils/usageTracker';

const usage = usageTracker.trackUsage('keyword-generation', 1);
if (!usage.allowed) {
  notifications.error(usage.message);
  return;
}

// Check for warnings
const warning = usageTracker.checkWarnings('keyword-generation');
if (warning) {
  notifications.warning(warning);
}
```

### 4. Input Validator (`src/utils/inputValidator.ts`)

Validates user inputs with helpful error messages.

**Validation Functions:**
- `validateEmail()` - Email format validation
- `validateURL()` - URL format validation
- `validateKeywords()` - Keyword input validation (min/max, suspicious patterns)
- `validateFileSize()` - File size limits
- `validateCSVRowCount()` - CSV row count limits
- `validatePhone()` - Phone number validation
- `validateRequired()` - Required field validation
- `validateLength()` - Text length validation

**Usage:**
```typescript
import { inputValidator } from '../utils/inputValidator';

const result = inputValidator.validateKeywords(keywords, 1, 50);
if (!result.valid) {
  notifications.error(result.message);
  return;
}
```

## Security Guardrails

### Rate Limiting

All major operations are rate-limited to prevent abuse:
- **Keyword Generation**: Limited to prevent bulk keyword scraping
- **CSV Export**: Limited to prevent excessive file downloads
- **Ad Creation**: Limited to prevent bulk ad creation abuse
- **Campaign Creation**: Limited to prevent bulk campaign creation

### Usage Quotas

Daily and monthly quotas prevent excessive platform usage:
- **Daily Limits**: Reset at midnight
- **Monthly Limits**: Reset at the start of each month
- **Per-Action Limits**: Prevent single bulk operations

### Input Validation

All user inputs are validated before processing:
- **Keywords**: Validated for format, count, and suspicious patterns
- **URLs**: Validated for proper format and accessibility
- **Files**: Validated for size and type
- **CSV Data**: Validated for row count and format

### Bulk Operation Prevention

Special checks prevent bulk misuse:
- Maximum keyword count per generation
- Maximum CSV row count
- Maximum ads per campaign
- Suspicious pattern detection

## Notification Integration

### Campaign Builder

All major operations in Campaign Builder now include notifications:

1. **Keyword Generation**
   - Loading notification during generation
   - Success notification with keyword count
   - Error notification if rate limit exceeded
   - Warning if approaching usage limits

2. **Ad Creation**
   - Success notification with ad type
   - Error notification if limit reached
   - Warning if no ad groups available

3. **CSV Export**
   - Success notification with row count
   - Error notification if validation fails
   - Warning if approaching limits

4. **Campaign Saving**
   - Success notification when saved
   - Info notification for drafts

5. **Ad Management**
   - Success notification when ad deleted
   - Success notification when ad duplicated

### User Guidance

Notifications provide clear guidance:
- **What happened**: Clear title and description
- **What to do**: Actionable next steps
- **Why it happened**: Context for errors and warnings
- **How to fix**: Specific instructions for errors

## Error Messages

All error messages are user-friendly and actionable:

- **Rate Limit Exceeded**: "Rate limit exceeded. You can [action] again in [time]. Please wait to avoid platform abuse."
- **Usage Limit Reached**: "Daily limit reached. You've used [X] of [Y] [action] operations today. Please try again tomorrow or contact support."
- **Validation Failed**: Specific field and reason for failure
- **Bulk Operation Blocked**: "Too many items. Maximum [X] items per operation. Please split your request into smaller batches."

## Implementation Details

### Notification Service Initialization

The notification service is initialized in `src/main.tsx`:

```typescript
import { notifications } from "./utils/notifications";
import { toast } from "sonner";

notifications.setToastInstance(toast);
```

### Toaster Component

The Toaster component is added to the app root in `src/main.tsx`:

```typescript
<Toaster position="top-right" richColors closeButton />
```

### Component Integration

All components import and use the services:

```typescript
import { notifications } from '../utils/notifications';
import { rateLimiter } from '../utils/rateLimiter';
import { usageTracker } from '../utils/usageTracker';
import { inputValidator } from '../utils/inputValidator';
```

## Best Practices

1. **Always check rate limits** before performing operations
2. **Track usage** for quota-limited operations
3. **Validate inputs** before processing
4. **Show loading states** for async operations
5. **Provide clear error messages** with actionable guidance
6. **Warn users** when approaching limits
7. **Celebrate successes** with confirmation messages

## Future Enhancements

Potential improvements:
- Server-side rate limiting
- User-specific quota management
- Advanced abuse detection
- Analytics dashboard for usage
- Customizable notification preferences
- Email notifications for important events

## Support

For questions or issues with security features or notifications, contact support or refer to the Help & Support section in the application.

