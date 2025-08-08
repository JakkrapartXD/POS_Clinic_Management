# Logging Implementation Guide

This document describes the comprehensive logging system implemented for the SN Medical project, addressing production-ready logging requirements.

## Overview

The logging system has been redesigned to replace all `console.log` statements with a proper, environment-aware logging utility that provides:

- **Environment-based log levels** (development vs production)
- **Structured logging** for production environments
- **Context-aware logging** with proper categorization
- **Security audit logging** for sensitive operations
- **Performance logging** capabilities

## Architecture

### Frontend Logging (`frontend/src/lib/logger.ts`)

**Features:**
- Environment-based configuration (debug in dev, error-only in prod)
- Structured JSON logging for production
- Context categorization (AUTH, API, USER, etc.)
- Specialized logging methods for common operations

**Usage Examples:**
```typescript
import { logger } from '@/lib/logger'

// Basic logging
logger.debug('Debug message', { data }, 'CONTEXT')
logger.info('Info message', { data }, 'CONTEXT')
logger.warn('Warning message', { data }, 'CONTEXT')
logger.error('Error message', error, 'CONTEXT')

// Specialized loggers
logger.auth.login(userId, success)
logger.api.request(endpoint, method)
logger.user.action('button_click', { buttonId })
```

### Backend Logging (`backend/src/lib/logger.ts`)

**Features:**
- Comprehensive backend logging with service context
- Security audit logging
- Database and Redis operation logging
- GraphQL operation tracking
- Structured production output

**Usage Examples:**
```typescript
import { logger } from './lib/logger'

// Server lifecycle
logger.server.starting(4000)
logger.server.ready(4000, endpoints)

// Database operations
logger.database.connected()
logger.database.error('query failed', error)

// Authentication
logger.auth.attempt(username, success, ip)
logger.security.auditLog(userId, operation, entityType, entityId)
```

## Configuration

### Development Environment
- **Frontend:** All log levels enabled with colorful console output
- **Backend:** Debug through error levels with detailed formatting
- **Output:** Human-readable console logs with emojis and context

### Production Environment
- **Frontend:** Error-level only with structured JSON
- **Backend:** Info through error levels with structured JSON
- **Output:** Machine-readable JSON for log aggregation

### Configuration Files
- `frontend/src/config/logging.ts` - Frontend logging configuration
- `backend/src/config/logging.ts` - Backend logging configuration
- `.logging.prod.yml` - Docker production logging setup

## Implementation Status

### ✅ Completed
1. **Logger Utilities Created**
   - Frontend logger with environment awareness
   - Backend logger with comprehensive contexts
   - Configuration management

2. **Frontend Files Updated**
   - `components/guards/page-guard.tsx` - Authentication logging
   - `hooks/use-user.tsx` - User state management logging
   - `clients/graphql.ts` - API request logging
   - `components/layout/sidebar.tsx` - Navigation logging

3. **Backend Files Updated**
   - `lib/database.ts` - Database connection logging
   - `index.ts` - Server lifecycle logging (partial)

### 🔄 In Progress
4. **Remaining Backend Files** (console.log statements to replace):
   - `models/SessionModel.ts` - Session management
   - `graphql/security.ts` - Security operations
   - `prisma/seed.ts` - Database seeding
   - `scripts/verify-setup.ts` - Setup verification

### 📋 Pending
5. **Production Configuration**
   - Environment variable setup
   - Log rotation configuration
   - Remote logging integration (if needed)

## Log Levels by Environment

| Environment | Frontend | Backend | Output Format |
|-------------|----------|---------|---------------|
| Development | debug, info, warn, error | debug, info, warn, error | Console with colors |
| Production | error only | info, warn, error | Structured JSON |
| Test | warn, error | warn, error | Minimal/silent |

## Security Considerations

### Sensitive Data Handling
- User passwords and tokens are never logged
- Personal data is anonymized in logs
- Error objects are sanitized in production

### Audit Logging
- All authentication attempts
- Permission checks and failures
- Sensitive data operations
- Administrative actions

### Rate Limiting Logs
- Failed login attempts
- API rate limit violations
- Suspicious activity patterns

## Docker & Production Deployment

### Log Management
- Logs are written to `/var/log/sn-medical/` in production
- Docker log driver configured for rotation
- Structured JSON format for log aggregation

### Monitoring Integration
- Compatible with ELK stack (Elasticsearch, Logstash, Kibana)
- Can integrate with cloud logging services (AWS CloudWatch, etc.)
- Supports log streaming to external services

## Migration from console.log

### Before (❌ Not Production Ready)
```typescript
console.log('User logged in:', user)
console.error('API Error:', error)
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

### After (✅ Production Ready)
```typescript
logger.auth.login(user.id, true)
logger.api.error('endpoint', error)
logger.debug('Debug info', data, 'CONTEXT')
```

## Best Practices

1. **Use appropriate log levels**
   - `debug`: Development debugging information
   - `info`: General operational information
   - `warn`: Warning conditions that should be noted
   - `error`: Error conditions that require attention

2. **Provide context**
   - Always include relevant context (AUTH, API, DATABASE, etc.)
   - Include user IDs for audit trails
   - Add operation identifiers for troubleshooting

3. **Structure data**
   - Use objects for complex data instead of string concatenation
   - Include timestamps and request IDs when available
   - Keep sensitive data out of logs

4. **Performance considerations**
   - Avoid expensive operations in log calls
   - Use appropriate log levels to reduce production overhead
   - Consider async logging for high-volume scenarios

## Troubleshooting

### Common Issues
1. **Missing logs in production**: Check log level configuration
2. **Too many logs**: Adjust log levels per environment
3. **Performance impact**: Review log frequency and data size

### Debug Commands
```bash
# Check current log configuration
grep -r "console\." --include="*.ts" --include="*.tsx" .

# View production logs (Docker)
docker-compose logs -f backend frontend

# Test logging configuration
NODE_ENV=production npm run build
```

## Next Steps

1. Complete migration of remaining backend files
2. Set up log rotation in production
3. Configure monitoring and alerting
4. Implement log aggregation if needed
5. Add performance metrics logging
