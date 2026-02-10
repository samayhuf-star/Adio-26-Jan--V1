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
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.userId || decoded.sub || decoded.id;

      if (userId) {
        return userId;
      }
    } catch (jwtError: any) {
      // Token is a valid JWT format but failed verification (expired, wrong secret, etc.)
    }

    return null;
  } catch (error: any) {
    console.error('[Auth] Error extracting userId from token:', error.message || error);
    return null;
  }
}
