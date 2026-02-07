import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'adiology-jwt-secret-key';

export async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[Auth] No Bearer token found in Authorization header');
      return null;
    }

    const token = authHeader.substring(7);

    if (!token || token.length < 10) {
      console.warn('[Auth] Invalid token format');
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.userId || decoded.sub || decoded.id;

      if (userId) {
        return userId;
      } else {
        console.warn('[Auth] User ID not found in JWT payload');
      }
    } catch (jwtError: any) {
      console.warn('[Auth] JWT verification failed:', jwtError.message);
    }

    return null;
  } catch (error: any) {
    console.error('[Auth] Error extracting userId from token:', error.message || error);
    return null;
  }
}
