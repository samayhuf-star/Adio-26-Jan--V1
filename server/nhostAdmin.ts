import { Pool } from 'pg';
import { getDatabaseUrl } from './dbConfig';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'adiology-jwt-secret-key';

function getPool(): Pool {
  return new Pool({ connectionString: getDatabaseUrl() });
}

function mapUser(row: any) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.full_name || '',
    emailVerified: row.email_verified || false,
    disabled: row.is_blocked || false,
    metadata: {
      full_name: row.full_name,
      role: row.role,
      subscription_plan: row.subscription_plan,
    },
    createdAt: row.created_at,
    lastSeen: row.last_sign_in,
  };
}

export const nhostAdmin = {
  isConfigured(): boolean {
    return true;
  },

  getConfigStatus() {
    return {
      configured: true,
      database: true,
      message: 'Using local PostgreSQL database',
    };
  },

  async getUserCount(): Promise<number> {
    const pool = getPool();
    try {
      const result = await pool.query('SELECT COUNT(*)::int AS count FROM users');
      return result.rows[0]?.count || 0;
    } finally {
      await pool.end();
    }
  },

  async getBlockedUserCount(): Promise<number> {
    const pool = getPool();
    try {
      const result = await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE is_blocked = true');
      return result.rows[0]?.count || 0;
    } finally {
      await pool.end();
    }
  },

  async getUsers(limit: number, offset: number): Promise<any[]> {
    const pool = getPool();
    try {
      const result = await pool.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows.map(mapUser);
    } finally {
      await pool.end();
    }
  },

  async getUsersWithFilter(limit: number, offset: number, search?: string): Promise<{ users: any[]; total: number }> {
    const pool = getPool();
    try {
      let whereClause = '';
      const params: any[] = [];

      if (search) {
        whereClause = 'WHERE email ILIKE $1 OR full_name ILIKE $1';
        params.push(`%${search}%`);
      }

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM users ${whereClause}`,
        params
      );
      const total = countResult.rows[0]?.count || 0;

      const limitIdx = params.length + 1;
      const offsetIdx = params.length + 2;
      const dataResult = await pool.query(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        [...params, limit, offset]
      );

      return {
        users: dataResult.rows.map(mapUser),
        total,
      };
    } finally {
      await pool.end();
    }
  },

  async getUserById(userId: string): Promise<any | null> {
    const pool = getPool();
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) return null;
      return mapUser(result.rows[0]);
    } finally {
      await pool.end();
    }
  },

  async updateUserDisplayName(userId: string, displayName: string): Promise<boolean> {
    const pool = getPool();
    try {
      const result = await pool.query(
        'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2',
        [displayName, userId]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      await pool.end();
    }
  },

  async updateUserEmail(userId: string, email: string): Promise<boolean> {
    const pool = getPool();
    try {
      const result = await pool.query(
        'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
        [email, userId]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      await pool.end();
    }
  },

  async updateUserMetadata(userId: string, metadata: any): Promise<boolean> {
    const pool = getPool();
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (metadata.role !== undefined) {
        updates.push(`role = $${idx++}`);
        values.push(metadata.role);
      }
      if (metadata.subscription_plan !== undefined) {
        updates.push(`subscription_plan = $${idx++}`);
        values.push(metadata.subscription_plan);
      }
      if (metadata.full_name !== undefined) {
        updates.push(`full_name = $${idx++}`);
        values.push(metadata.full_name);
      }

      if (updates.length === 0) return true;

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
      return (result.rowCount || 0) > 0;
    } finally {
      await pool.end();
    }
  },

  async setUserDisabled(userId: string, disabled: boolean): Promise<boolean> {
    const pool = getPool();
    try {
      const result = await pool.query(
        'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2',
        [disabled, userId]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      await pool.end();
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    const pool = getPool();
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      return (result.rowCount || 0) > 0;
    } finally {
      await pool.end();
    }
  },

  async verifyAdminToken(token: string): Promise<any | null> {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub || decoded.id || decoded.userId;
      const email = decoded.email;

      if (!userId && !email) return null;

      const pool = getPool();
      try {
        let result;
        if (userId) {
          result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        } else {
          result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        }

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        const role = user.role || '';
        if (!['superadmin', 'super_admin', 'admin'].includes(role)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      } finally {
        await pool.end();
      }
    } catch {
      return null;
    }
  },

  async verifyAdminUser(email: string): Promise<any | null> {
    const pool = getPool();
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      const role = user.role || '';
      if (!['superadmin', 'super_admin', 'admin'].includes(role)) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } finally {
      await pool.end();
    }
  },

  async query(_graphqlQuery: string, _variables?: any): Promise<any> {
    return { data: {}, errors: null };
  },
};
