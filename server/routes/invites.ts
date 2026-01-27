import { Hono } from 'hono';
import { db } from '../db';
import { organizationInvites, organizations, organizationMembers } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

const invitesRoutes = new Hono();

// GET /api/invites/:code - Get invite info
invitesRoutes.get('/:code', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase();

    const invite = await db
      .select({
        id: organizationInvites.id,
        organizationId: organizationInvites.organizationId,
        code: organizationInvites.code,
        email: organizationInvites.email,
        role: organizationInvites.role,
        status: organizationInvites.status,
        expiresAt: organizationInvites.expiresAt,
        useCount: organizationInvites.useCount,
        maxUses: organizationInvites.maxUses,
      })
      .from(organizationInvites)
      .where(eq(organizationInvites.code, code))
      .limit(1);

    if (invite.length === 0) {
      return c.json({ error: 'Invite not found' }, 404);
    }

    const inv = invite[0];

    // Check if expired
    if (new Date(inv.expiresAt) < new Date()) {
      return c.json({ error: 'Invite has expired' }, 400);
    }

    // Check if already used
    if (inv.status !== 'pending') {
      return c.json({ error: 'Invite has already been used' }, 400);
    }

    // Check if max uses reached
    if (inv.maxUses && inv.useCount && inv.useCount >= inv.maxUses) {
      return c.json({ error: 'Invite has reached maximum uses' }, 400);
    }

    // Get organization name
    const org = await db
      .select({
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, inv.organizationId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        organizationName: org[0].name,
        role: inv.role,
        email: inv.email || undefined,
        expiresAt: inv.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Get invite error:', error);
    return c.json({ error: 'Failed to fetch invite', message: error.message }, 500);
  }
});

// POST /api/invites/:code/join - Join organization via invite
invitesRoutes.post('/:code/join', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const code = c.req.param('code').toUpperCase();

    const invite = await db
      .select()
      .from(organizationInvites)
      .where(eq(organizationInvites.code, code))
      .limit(1);

    if (invite.length === 0) {
      return c.json({ error: 'Invite not found' }, 404);
    }

    const inv = invite[0];

    // Check if expired
    if (new Date(inv.expiresAt) < new Date()) {
      return c.json({ error: 'Invite has expired' }, 400);
    }

    // Check if already used
    if (inv.status !== 'pending') {
      return c.json({ error: 'Invite has already been used' }, 400);
    }

    // Check if max uses reached
    if (inv.maxUses && inv.useCount && inv.useCount >= inv.maxUses) {
      return c.json({ error: 'Invite has reached maximum uses' }, 400);
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, inv.organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return c.json({ error: 'You are already a member of this organization' }, 400);
    }

    // Get user email from auth (simplified - in production get from users table)
    // For now, we'll use a placeholder
    const userEmail = 'user@example.com'; // TODO: Get from users table or auth

    // Add user as member
    await db.insert(organizationMembers).values({
      organizationId: inv.organizationId,
      userId,
      email: inv.email || userEmail,
      role: inv.role,
      status: 'active',
      invitedAt: new Date(),
    });

    // Update invite status
    const newUseCount = (inv.useCount || 0) + 1;
    const shouldMarkAsUsed = inv.maxUses && newUseCount >= inv.maxUses;

    await db
      .update(organizationInvites)
      .set({
        useCount: newUseCount,
        status: shouldMarkAsUsed ? 'used' : 'pending',
        usedAt: shouldMarkAsUsed ? new Date() : null,
        usedBy: shouldMarkAsUsed ? userId : null,
      })
      .where(eq(organizationInvites.id, inv.id));

    // Get organization name
    const org = await db
      .select({
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, inv.organizationId))
      .limit(1);

    return c.json({
      success: true,
      message: `Successfully joined ${org[0]?.name || 'the organization'}!`,
    });
  } catch (error: any) {
    console.error('Join invite error:', error);
    return c.json({ error: 'Failed to join organization', message: error.message }, 500);
  }
});

export { invitesRoutes };
