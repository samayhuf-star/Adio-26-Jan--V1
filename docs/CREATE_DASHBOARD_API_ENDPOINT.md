# Create Dashboard API Endpoint

## Overview

The Dashboard API endpoint provides comprehensive user dashboard data including statistics, recent campaigns, notifications, and workspace information.

## Implementation Status

✅ **Fully Implemented** - The dashboard API endpoint is already created and functional in `server/index.ts`

## Endpoints

### 1. General Dashboard Endpoint (Recommended)

**Endpoint:** `GET /api/dashboard`

**Authentication:** Required (uses authenticated user from session)

**Description:** Returns dashboard data for the currently authenticated user.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCampaigns": 0,
      "totalSearches": 0,
      "unreadNotifications": 0
    },
    "recentCampaigns": [
      {
        "id": "string",
        "campaign_name": "string",
        "structure_type": "string",
        "step": "number",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "workspaces": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "role": "string",
        "status": "string",
        "created_at": "timestamp"
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Server error with error message

### 2. Dashboard Endpoint with User ID (Backward Compatibility)

**Endpoint:** `GET /api/dashboard/:userId`

**Authentication:** Required

**Description:** Returns dashboard data for a specific user ID (for backward compatibility).

**Parameters:**
- `userId` (path parameter) - The user ID to fetch dashboard data for

**Response Format:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCampaigns": 0,
      "totalSearches": 0,
      "unreadNotifications": 0
    },
    "recentCampaigns": [
      {
        "id": "string",
        "campaign_name": "string",
        "structure_type": "string",
        "step": "number",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
}
```

**Note:** This endpoint does not include workspaces data.

## Data Sources

The dashboard endpoint aggregates data from the following database tables:

1. **campaign_history** - Campaign statistics and recent campaigns
2. **ad_search_requests** - Search request statistics
3. **user_notifications** - Unread notification count
4. **workspaces** + **workspace_members** - User workspace information

## Implementation Details

### Location
- **File:** `server/index.ts`
- **Lines:** 3720-3836

### Key Features

1. **Authentication:** Uses `getUserFromAuth(c)` helper function to extract authenticated user
2. **Error Handling:** Comprehensive try-catch with proper error responses
3. **Data Aggregation:** Multiple database queries combined into a single response
4. **Performance:** Efficient queries with proper indexing on user_id columns

### Database Queries

1. **Campaign Count:**
   ```sql
   SELECT COUNT(*) as count 
   FROM campaign_history 
   WHERE user_id = $1
   ```

2. **Search Requests Count:**
   ```sql
   SELECT COUNT(*) as count 
   FROM ad_search_requests 
   WHERE user_id = $1
   ```

3. **Recent Campaigns:**
   ```sql
   SELECT id, campaign_name, structure_type, step, created_at, updated_at
   FROM campaign_history 
   WHERE user_id = $1 
   ORDER BY updated_at DESC 
   LIMIT 10
   ```

4. **Unread Notifications:**
   ```sql
   SELECT COUNT(*) as count 
   FROM user_notifications 
   WHERE user_id = $1 AND read = FALSE
   ```

5. **User Workspaces:**
   ```sql
   SELECT w.*, wm.role, wm.status
   FROM workspaces w
   INNER JOIN workspace_members wm ON w.id = wm.workspace_id
   WHERE wm.user_id = $1 AND wm.status = 'active'
   ORDER BY w.created_at DESC
   ```

## Usage Examples

### Frontend Usage (JavaScript/TypeScript)

```typescript
// Fetch dashboard data
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}` // If using token auth
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Stats:', data.data.stats);
      console.log('Recent Campaigns:', data.data.recentCampaigns);
      console.log('Workspaces:', data.data.workspaces);
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error);
  }
}
```

### cURL Example

```bash
# Get dashboard data (requires authentication)
curl -X GET "https://your-domain.com/api/dashboard" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Testing

### Manual Testing Steps

1. **Authenticate** - Ensure you have a valid user session
2. **Call Endpoint** - Make a GET request to `/api/dashboard`
3. **Verify Response** - Check that:
   - Response status is 200
   - Response contains `success: true`
   - All expected data fields are present
   - Stats are accurate for the user

### Test Cases

- ✅ Authenticated user receives dashboard data
- ✅ Unauthenticated request returns 401
- ✅ Stats are calculated correctly
- ✅ Recent campaigns are limited to 10
- ✅ Workspaces are filtered by active status
- ✅ Error handling works for database failures

## Error Handling

The endpoint includes comprehensive error handling:

1. **Authentication Errors:** Returns 401 with error message
2. **Database Errors:** Catches exceptions and returns 500 with error details
3. **Missing Data:** Returns default values (0 for counts, empty arrays for lists)

## Security Considerations

1. **Authentication Required:** All endpoints require valid user authentication
2. **User Isolation:** Users can only access their own dashboard data
3. **SQL Injection Protection:** Uses parameterized queries ($1, $2, etc.)
4. **Error Message Sanitization:** Error messages don't expose sensitive database details

## Future Enhancements

Potential improvements:

1. **Caching:** Add Redis caching for frequently accessed dashboard data
2. **Pagination:** Add pagination for recent campaigns
3. **Filtering:** Add date range filters for campaigns
4. **Real-time Updates:** Use WebSockets for real-time dashboard updates
5. **Analytics:** Add more detailed analytics and metrics

## Related Files

- `server/index.ts` - Main server file with endpoint implementation
- `src/components/Dashboard.tsx` - Frontend component using this endpoint
- `src/App.tsx` - Frontend app that calls dashboard API

## Maintenance Notes

- The endpoint is part of the main Hono server application
- Database queries should be optimized if dashboard load times increase
- Consider adding database indexes on `user_id` columns if not already present
- Monitor error rates and response times in production

