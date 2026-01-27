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

// POST /api/user/password - Change password (stub - handled by auth provider)
userRoutes.post('/password', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password are required' }, 400);
    }

    // Password changes are handled by the auth provider (Nhost)
    // This endpoint is a stub that returns success
    // In production, you would call the auth provider's password change API

    return c.json({
      success: true,
      message: 'Password change request received. Please use your auth provider to change your password.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return c.json({ error: 'Failed to change password', message: error.message }, 500);
  }
});

export { userRoutes };
