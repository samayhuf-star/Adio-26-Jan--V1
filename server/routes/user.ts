import { Hono } from 'hono';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

const userRoutes = new Hono();

// GET /api/user/profile - Get user profile
userRoutes.get('/profile', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const u = user[0];
    return c.json({
      success: true,
      data: {
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        avatar_url: u.avatarUrl,
        role: u.role,
        subscription_plan: u.subscriptionPlan,
        subscription_status: u.subscriptionStatus,
        google_ads_default_account: (u as any).google_ads_default_account || null,
      },
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return c.json({ error: 'Failed to fetch profile', message: error.message }, 500);
  }
});

// PUT /api/user/profile - Update user profile
userRoutes.put('/profile', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.full_name !== undefined) {
      updateData.fullName = updates.full_name;
    }
    if (updates.avatar_url !== undefined) {
      updateData.avatarUrl = updates.avatar_url;
    }
    if (updates.google_ads_default_account !== undefined) {
      // Store in metadata or settings field if available
      // For now, we'll store it in a JSONB field if the schema supports it
      // This is a simplified approach - adjust based on your schema
      updateData.google_ads_default_account = updates.google_ads_default_account;
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: updated[0].id,
        email: updated[0].email,
        full_name: updated[0].fullName,
        avatar_url: updated[0].avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return c.json({ error: 'Failed to update profile', message: error.message }, 500);
  }
});

// PUT /api/user/password - Change password
userRoutes.put('/password', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { newPassword, confirmPassword } = await c.req.json();

    if (!newPassword) {
      return c.json({ error: 'New password is required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return c.json({ error: 'Passwords do not match' }, 400);
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const pg = await import('pg');
    const { getDatabaseUrl } = await import('../dbConfig');
    const pool = new pg.default.Pool({ connectionString: getDatabaseUrl() });

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    await pool.end();

    return c.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return c.json({ error: 'Failed to change password', message: error.message }, 500);
  }
});

export { userRoutes };
