import { Hono } from 'hono';
import { db } from '../db';
import { organizations, organizationMembers, organizationInvites } from '../../shared/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

const organizationsRoutes = new Hono();

// Helper to get user ID from token
async function getUserId(c: any): Promise<string | null> {
  return await getUserIdFromToken(c);
}

// GET /api/organizations/my - Get user's organization
organizationsRoutes.get('/my', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Find organization where user is owner or member
    const orgMembership = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (orgMembership.length === 0) {
      // Check if user owns an organization
      const ownedOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.ownerId, userId))
        .limit(1);

      if (ownedOrg.length === 0) {
        return c.json({ success: false, data: null });
      }

      const org = ownedOrg[0];
      const memberCount = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, org.id));

      return c.json({
        success: true,
        data: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          owner_id: org.ownerId,
          member_count: memberCount.length + 1, // +1 for owner
        },
      });
    }

    const orgId = orgMembership[0].organizationId;
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ success: false, data: null });
    }

    const memberCount = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    return c.json({
      success: true,
      data: {
        id: org[0].id,
        name: org[0].name,
        slug: org[0].slug,
        owner_id: org[0].ownerId,
        member_count: memberCount.length + 1,
      },
    });
  } catch (error: any) {
    console.error('Get my organization error:', error);
    return c.json({ error: 'Failed to fetch organization', message: error.message }, 500);
  }
});

// GET /api/organizations - List all organizations (admin only or user's orgs)
organizationsRoutes.get('/', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // For now, return user's organizations
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        owner_id: organizations.ownerId,
      })
      .from(organizations)
      .where(eq(organizations.ownerId, userId));

    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const memberCount = await db
          .select()
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, org.id));
        return {
          ...org,
          member_count: memberCount.length + 1,
        };
      })
    );

    return c.json({ success: true, data: orgsWithCounts });
  } catch (error: any) {
    console.error('List organizations error:', error);
    return c.json({ error: 'Failed to fetch organizations', message: error.message }, 500);
  }
});

// GET /api/organizations/:id/members - Get organization members
organizationsRoutes.get('/:id/members', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');

    // Verify user is member or owner
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    const isOwner = org[0].ownerId === userId;
    const isMember = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!isOwner && isMember.length === 0) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const members = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    // Add owner as member with owner role
    const ownerMember = {
      id: 'owner',
      user_id: org[0].ownerId,
      email: '', // Will need to fetch from users table
      name: '',
      role: 'owner' as const,
      status: 'active' as const,
      joined_at: org[0].createdAt,
    };

    const formattedMembers = members.map((m) => ({
      id: m.id,
      user_id: m.userId,
      email: m.email,
      name: m.name || '',
      role: m.role,
      status: m.status,
      joined_at: m.joinedAt,
      invited_at: m.invitedAt,
    }));

    return c.json({ success: true, data: [ownerMember, ...formattedMembers] });
  } catch (error: any) {
    console.error('Get members error:', error);
    return c.json({ error: 'Failed to fetch members', message: error.message }, 500);
  }
});

// GET /api/organizations/:id/invites - Get organization invites
organizationsRoutes.get('/:id/invites', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');

    // Verify user is owner or admin
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    const isOwner = org[0].ownerId === userId;
    if (!isOwner) {
      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, userId),
            or(eq(organizationMembers.role, 'admin'), eq(organizationMembers.role, 'owner'))
          )
        )
        .limit(1);

      if (member.length === 0) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    const invites = await db
      .select()
      .from(organizationInvites)
      .where(
        and(
          eq(organizationInvites.organizationId, orgId),
          eq(organizationInvites.status, 'pending')
        )
      )
      .orderBy(desc(organizationInvites.createdAt));

    const formattedInvites = invites.map((inv) => ({
      id: inv.id,
      code: inv.code,
      email: inv.email || undefined,
      role: inv.role,
      status: inv.status,
      expires_at: inv.expiresAt,
      use_count: inv.useCount || 0,
      max_uses: inv.maxUses || 1,
      created_at: inv.createdAt,
    }));

    return c.json({ success: true, data: formattedInvites });
  } catch (error: any) {
    console.error('Get invites error:', error);
    return c.json({ error: 'Failed to fetch invites', message: error.message }, 500);
  }
});

// POST /api/organizations/:id/invites - Create invite
organizationsRoutes.post('/:id/invites', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const { email, role = 'viewer' } = await c.req.json();

    // Verify user is owner or admin
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    const isOwner = org[0].ownerId === userId;
    if (!isOwner) {
      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, userId),
            or(eq(organizationMembers.role, 'admin'), eq(organizationMembers.role, 'owner'))
          )
        )
        .limit(1);

      if (member.length === 0) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    // Generate invite code (8 characters, alphanumeric)
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await db
      .insert(organizationInvites)
      .values({
        organizationId: orgId,
        code,
        email: email || null,
        role,
        invitedBy: userId,
        status: 'pending',
        expiresAt,
        maxUses: 1,
        useCount: 0,
      })
      .returning();

    return c.json({
      success: true,
      data: {
        id: invite[0].id,
        code: invite[0].code,
        email: invite[0].email || undefined,
        role: invite[0].role,
        expires_at: invite[0].expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Create invite error:', error);
    return c.json({ error: 'Failed to create invite', message: error.message }, 500);
  }
});

// DELETE /api/organizations/:id/members/:memberId - Remove member
organizationsRoutes.delete('/:id/members/:memberId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const memberId = c.req.param('memberId');

    // Verify user is owner or admin
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    const isOwner = org[0].ownerId === userId;
    if (!isOwner) {
      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, userId),
            or(eq(organizationMembers.role, 'admin'), eq(organizationMembers.role, 'owner'))
          )
        )
        .limit(1);

      if (member.length === 0) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    // Cannot remove owner
    if (org[0].ownerId === memberId) {
      return c.json({ error: 'Cannot remove organization owner' }, 400);
    }

    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, orgId)
        )
      );

    return c.json({ success: true, message: 'Member removed' });
  } catch (error: any) {
    console.error('Remove member error:', error);
    return c.json({ error: 'Failed to remove member', message: error.message }, 500);
  }
});

// DELETE /api/organizations/:id/invites/:inviteId - Delete invite
organizationsRoutes.delete('/:id/invites/:inviteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const inviteId = c.req.param('inviteId');

    // Verify user is owner or admin
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    const isOwner = org[0].ownerId === userId;
    if (!isOwner) {
      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, userId),
            or(eq(organizationMembers.role, 'admin'), eq(organizationMembers.role, 'owner'))
          )
        )
        .limit(1);

      if (member.length === 0) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    await db
      .delete(organizationInvites)
      .where(
        and(
          eq(organizationInvites.id, inviteId),
          eq(organizationInvites.organizationId, orgId)
        )
      );

    return c.json({ success: true, message: 'Invite deleted' });
  } catch (error: any) {
    console.error('Delete invite error:', error);
    return c.json({ error: 'Failed to delete invite', message: error.message }, 500);
  }
});

// PUT /api/organizations/:id/members/:memberId - Update member role
organizationsRoutes.put('/:id/members/:memberId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const memberId = c.req.param('memberId');
    const { role } = await c.req.json();

    if (!role) {
      return c.json({ error: 'Role is required' }, 400);
    }

    // Verify user is owner or admin
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    const isOwner = org[0].ownerId === userId;
    if (!isOwner) {
      const member = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, userId),
            or(eq(organizationMembers.role, 'admin'), eq(organizationMembers.role, 'owner'))
          )
        )
        .limit(1);

      if (member.length === 0) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    // Cannot change owner role
    if (org[0].ownerId === memberId) {
      return c.json({ error: 'Cannot change owner role' }, 400);
    }

    const updated = await db
      .update(organizationMembers)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, orgId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'Member not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: updated[0].id,
        role: updated[0].role,
      },
    });
  } catch (error: any) {
    console.error('Update member error:', error);
    return c.json({ error: 'Failed to update member', message: error.message }, 500);
  }
});

export { organizationsRoutes };
