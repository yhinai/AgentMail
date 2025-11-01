# Hyperspell and JWT Integration

This document describes the Hyperspell API and JWT authentication integration for the "nihal" application.

## Configuration

### Environment Variables Required

Add these to your `.env` file:

```bash
# Hyperspell Configuration
HYPERSPELL_API_KEY=hs2-240-bvno22rND0Q093Rn18OARHqqQtyQTo8W
HYPERSPELL_NAMESPACE=nihal
HYPERSPELL_API_URL=https://api.hyperspell.com

# JWT Authentication
JWT_SECRET=kOAdlta/XP5eujHU8fGT+V+YxAvlurQv
```

## Features Implemented

### 1. JWT Authentication Service

The `AuthenticationService` class in `src/security/index.ts` now includes:

- **generateToken(payload)**: Generates a JWT token with user data
- **validateToken(token)**: Validates and decodes a JWT token
- **decodeToken(token)**: Decodes a token without verification (for debugging)

The SecurityManager exposes:
- **generateToken(payload)**: Public method to generate tokens
- **validateToken(token)**: Public method to validate tokens
- **jwtMiddleware()**: Express middleware to protect routes

### 2. Hyperspell Integration

The Hyperspell integration is configured with:
- API key authentication via Bearer token
- Namespace set to "nihal"
- Endpoints for memory operations:
  - `store()`: Store memory entries
  - `retrieve()`: Retrieve memory entries
  - `search()`: Search memory entries
  - `update()`: Update memory entries
  - `delete()`: Delete memory entries
  - `incrementAccess()`: Track access counts
  - `healthCheck()`: Verify API connectivity

## Usage Examples

### Generate JWT Token

```typescript
import { SecurityManager } from './src/security';

const securityManager = new SecurityManager();
const token = securityManager.generateToken({
  userId: 'user123',
  email: 'user@example.com'
});
```

### Validate JWT Token

```typescript
try {
  const decoded = await securityManager.validateToken(token);
  console.log('User:', decoded.userId);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

### Protect Express Routes

```typescript
import express from 'express';
import { SecurityManager } from './src/security';

const app = express();
const securityManager = new SecurityManager();

// Protect a route with JWT
app.get('/api/protected', securityManager.jwtMiddleware(), (req, res) => {
  // req.user contains decoded token payload
  res.json({ user: req.user });
});
```

### Use Hyperspell Memory

```typescript
import { IntegrationManager } from './src/integrations';

const integrations = new IntegrationManager();

if (integrations.hyperspell) {
  // Store memory
  await integrations.hyperspell.store('key1', {
    seller: 'John Doe',
    negotiationHistory: []
  }, {
    type: 'seller',
    category: 'negotiations'
  });

  // Retrieve memory
  const memory = await integrations.hyperspell.retrieve('key1');

  // Search memory
  const results = await integrations.hyperspell.search('seller preferences', {
    limit: 10,
    threshold: 0.7
  });
}
```

## Security Notes

1. **JWT Secret**: The JWT secret key is stored in environment variables and should never be committed to version control.

2. **API Keys**: All API keys should be stored securely in environment variables.

3. **Token Expiry**: Default token expiry is set to 24 hours. This can be configured in the `AuthenticationService` constructor.

4. **Algorithm**: JWT tokens use HS256 algorithm for signing and verification.

## Testing

To test the integration:

1. Set the environment variables in your `.env` file
2. Start the server: `npm run server`
3. Generate a token using the SecurityManager
4. Use the token in the `Authorization` header: `Bearer <token>`
5. Test Hyperspell operations through the IntegrationManager

## Status

✅ JWT authentication implemented
✅ Hyperspell integration configured
✅ Namespace set to "nihal"
✅ Environment variables configured
✅ Changes pushed to `nihal-branch`

