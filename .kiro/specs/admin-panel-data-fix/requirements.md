# Requirements Document

## Introduction

The admin panel is currently showing blank data (all zeros) because of missing database tables, incomplete migrations, and configuration issues. This feature will fix all data connectivity issues and ensure the admin panel displays real data from the correct database tables.

## Glossary

- **Admin_Panel**: The SuperAdminPanel component that provides administrative interface
- **Supabase**: The backend database service used for data storage
- **RLS**: Row Level Security policies in Supabase
- **Service_Role_Key**: Administrative key for bypassing RLS policies
- **Migration**: Database schema change script
- **Stats_Endpoint**: The /api/admin/stats API endpoint that returns dashboard metrics

## Requirements

### Requirement 1: Database Schema Completion

**User Story:** As a system administrator, I want all required database tables to exist, so that the admin panel can fetch real data.

#### Acceptance Criteria

1. WHEN the system starts, THE Database SHALL contain a subscriptions table with proper schema
2. WHEN the system starts, THE Database SHALL contain a payments table with proper schema  
3. WHEN the system starts, THE Database SHALL contain an emails table with proper schema
4. WHEN the system starts, THE Database SHALL contain an audit_logs table with proper schema
5. WHEN the system starts, THE Database SHALL contain a security_rules table with proper schema
6. WHEN migrations are run, THE Database SHALL create all tables with appropriate indexes and constraints

### Requirement 2: Admin Authentication and Authorization

**User Story:** As a system administrator, I want proper admin authentication, so that admin queries can bypass RLS policies and access all data.

#### Acceptance Criteria

1. WHEN admin endpoints are called, THE System SHALL verify the user has super admin privileges
2. WHEN database queries are made, THE System SHALL use the service role key to bypass RLS policies
3. WHEN authentication fails, THE System SHALL return appropriate error messages instead of zeros
4. THE System SHALL validate the SUPABASE_SERVICE_ROLE_KEY environment variable is configured
5. WHEN service role key is missing, THE System SHALL log configuration errors clearly

### Requirement 3: Dashboard Statistics Data Connectivity

**User Story:** As a system administrator, I want to see accurate dashboard statistics, so that I can monitor system health and usage.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Stats_Endpoint SHALL return the actual count of users from the users table
2. WHEN the dashboard loads, THE Stats_Endpoint SHALL return the actual count of active subscriptions from the subscriptions table
3. WHEN the dashboard loads, THE Stats_Endpoint SHALL return the actual monthly revenue sum from the payments table
4. WHEN the dashboard loads, THE Stats_Endpoint SHALL return the actual error count from audit_logs for the last 24 hours
5. WHEN the dashboard loads, THE Stats_Endpoint SHALL return the actual count of trials from the feedback table
6. WHEN the dashboard loads, THE Stats_Endpoint SHALL return the actual count of emails sent from the emails table
7. WHEN database queries fail, THE Stats_Endpoint SHALL return specific error messages instead of default zeros

### Requirement 4: User Management Data Connectivity

**User Story:** As a system administrator, I want to manage users effectively, so that I can view, search, and modify user accounts.

#### Acceptance Criteria

1. WHEN the user management section loads, THE System SHALL display all users from the users table
2. WHEN searching for users, THE System SHALL filter users by email, name, or subscription status
3. WHEN blocking a user, THE System SHALL update the user record in the users table
4. WHEN updating user roles, THE System SHALL modify the role field in the users table
5. WHEN user data changes, THE System SHALL log the action in the audit_logs table

### Requirement 5: Billing Data Connectivity

**User Story:** As a system administrator, I want to view billing information, so that I can track subscriptions and revenue.

#### Acceptance Criteria

1. WHEN the billing section loads, THE System SHALL display subscription data from the subscriptions table
2. WHEN viewing payments, THE System SHALL show payment records from the payments table
3. WHEN calculating revenue, THE System SHALL aggregate payment amounts by time period
4. WHEN subscription status changes, THE System SHALL update the subscriptions table
5. THE System SHALL display subscription plans, billing cycles, and payment methods

### Requirement 6: System Logs Data Connectivity

**User Story:** As a system administrator, I want to view system logs, so that I can monitor system activity and troubleshoot issues.

#### Acceptance Criteria

1. WHEN the logs section loads, THE System SHALL display entries from the audit_logs table
2. WHEN filtering logs, THE System SHALL filter by log level, timestamp, or message content
3. WHEN new system events occur, THE System SHALL create entries in the audit_logs table
4. WHEN viewing log details, THE System SHALL show complete log entry information
5. THE System SHALL support pagination for large log datasets

### Requirement 7: Email Management Data Connectivity

**User Story:** As a system administrator, I want to track email delivery, so that I can monitor communication effectiveness.

#### Acceptance Criteria

1. WHEN the email section loads, THE System SHALL display email records from the emails table
2. WHEN emails are sent, THE System SHALL log delivery status in the emails table
3. WHEN viewing email statistics, THE System SHALL calculate delivery rates and bounce rates
4. WHEN managing email templates, THE System SHALL store templates in the database
5. THE System SHALL track email opens, clicks, and unsubscribes

### Requirement 8: Security Rules Data Connectivity

**User Story:** As a system administrator, I want to manage security rules, so that I can control access and prevent abuse.

#### Acceptance Criteria

1. WHEN the security section loads, THE System SHALL display rules from the security_rules table
2. WHEN adding security rules, THE System SHALL insert new rules into the security_rules table
3. WHEN deleting security rules, THE System SHALL remove rules from the security_rules table
4. WHEN rules are modified, THE System SHALL log changes in the audit_logs table
5. THE System SHALL validate rule syntax before saving

### Requirement 9: Database Browser Data Connectivity

**User Story:** As a system administrator, I want to browse database tables directly, so that I can inspect data and troubleshoot issues.

#### Acceptance Criteria

1. WHEN the database section loads, THE System SHALL list all available tables from information_schema
2. WHEN selecting a table, THE System SHALL display table data with pagination
3. WHEN viewing table structure, THE System SHALL show column names, types, and constraints
4. WHEN querying tables, THE System SHALL limit results to prevent performance issues
5. THE System SHALL provide search and filter capabilities for table data

### Requirement 10: Error Handling and Logging

**User Story:** As a system administrator, I want clear error messages, so that I can identify and fix configuration issues.

#### Acceptance Criteria

1. WHEN database connections fail, THE System SHALL log specific error messages
2. WHEN tables don't exist, THE System SHALL report missing table errors
3. WHEN authentication fails, THE System SHALL log authentication errors
4. WHEN environment variables are missing, THE System SHALL report configuration errors
5. WHEN API calls fail, THE System SHALL return meaningful error responses instead of zeros