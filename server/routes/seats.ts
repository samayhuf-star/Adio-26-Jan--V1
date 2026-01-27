import { Hono } from 'hono';
import { db } from '../db';
import { organizations, organizationMembers } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';
import { seatManagement } from '../seatManagement';
import { stripeService } from '../stripeService';

const seatsRoutes = new Hono();

// Helper to get user ID from token
async function getUserId(c: any): Promise<string | null> {
  return await getUserIdFromToken(c);
}

// GET /api/organization/:id/seats - Get seat info
seatsRoutes.get('/:id/seats', async (c) => {
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

    // Get seat metadata from organization settings
    const metadata = org[0].settings as any || {};
    const plan = metadata.plan || 'lifetime';
    const baseSeatLimit = metadata.baseSeatLimit || (plan === 'lifetime' ? 1 : plan === 'basic' ? 2 : 5);
    const extraSeats = metadata.extraSeats || 0;
    const totalSeatLimit = baseSeatLimit + extraSeats;

    // Count current members (excluding owner)
    const members = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    const seatsUsed = members.length + 1; // +1 for owner
    const seatsAvailable = Math.max(0, totalSeatLimit - seatsUsed);

    return c.json({
      success: true,
      data: {
        plan,
        baseSeatLimit,
        extraSeats,
        totalSeatLimit,
        seatsUsed,
        seatsAvailable,
        stripeCustomerId: metadata.stripeCustomerId,
      },
    });
  } catch (error: any) {
    console.error('Get seats error:', error);
    return c.json({ error: 'Failed to fetch seat info', message: error.message }, 500);
  }
});

// GET /api/organization/:id/seats/can-add - Check if can add seat
seatsRoutes.get('/:id/seats/can-add', async (c) => {
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
            eq(organizationMembers.role, 'admin')
          )
        )
        .limit(1);

      if (member.length === 0) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    const metadata = org[0].settings as any || {};
    const plan = metadata.plan || 'lifetime';
    const baseSeatLimit = metadata.baseSeatLimit || (plan === 'lifetime' ? 1 : plan === 'basic' ? 2 : 5);
    const extraSeats = metadata.extraSeats || 0;
    const totalSeatLimit = baseSeatLimit + extraSeats;

    const members = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    const seatsUsed = members.length + 1;

    const allowed = seatsUsed < totalSeatLimit;
    const reason = allowed
      ? undefined
      : 'Seat limit reached. Please purchase additional seats or upgrade your plan.';

    return c.json({
      success: true,
      data: {
        allowed,
        reason,
        seatsUsed,
        totalLimit: totalSeatLimit,
      },
    });
  } catch (error: any) {
    console.error('Can add seat error:', error);
    return c.json({ error: 'Failed to check seat availability', message: error.message }, 500);
  }
});

// POST /api/organization/:id/seats/add - Add seat (create checkout)
seatsRoutes.post('/:id/seats/add', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const { quantity = 1, successUrl, cancelUrl } = await c.req.json();

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
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const metadata = org[0].settings as any || {};
    const stripeCustomerId = metadata.stripeCustomerId;

    if (!stripeCustomerId) {
      return c.json({ error: 'Organization does not have a Stripe customer ID' }, 400);
    }

    // Create checkout session for extra seats
    const checkoutUrl = await seatManagement.createExtraSeatCheckoutSession(
      orgId,
      stripeCustomerId,
      successUrl || `${c.req.url.split('/api')[0]}/settings?success=seat`,
      cancelUrl || `${c.req.url.split('/api')[0]}/settings?canceled=seat`,
      quantity
    );

    if (!checkoutUrl) {
      return c.json({ error: 'Failed to create checkout session' }, 500);
    }

    return c.json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error: any) {
    console.error('Add seat error:', error);
    return c.json({ error: 'Failed to add seat', message: error.message }, 500);
  }
});

// POST /api/organization/:id/plan/upgrade - Upgrade plan
seatsRoutes.post('/:id/plan/upgrade', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const { plan, successUrl, cancelUrl } = await c.req.json();

    if (!plan || !['basic', 'pro'].includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be "basic" or "pro"' }, 400);
    }

    // Verify user is owner
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    if (org[0].ownerId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get user email (simplified - in production get from users table)
    const userEmail = 'user@example.com'; // TODO: Get from users table

    // Create checkout session for plan upgrade
    const checkoutUrl = await seatManagement.createPlanCheckoutSession(
      orgId,
      plan,
      userEmail,
      successUrl || `${c.req.url.split('/api')[0]}/settings?success=plan`,
      cancelUrl || `${c.req.url.split('/api')[0]}/settings?canceled=plan`
    );

    if (!checkoutUrl) {
      return c.json({ error: 'Failed to create checkout session' }, 500);
    }

    return c.json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error: any) {
    console.error('Upgrade plan error:', error);
    return c.json({ error: 'Failed to upgrade plan', message: error.message }, 500);
  }
});

// GET /api/organization/:id/plan/can-downgrade/:plan - Check downgrade eligibility
seatsRoutes.get('/:id/plan/can-downgrade/:plan', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const newPlan = c.req.param('plan') as 'lifetime' | 'basic' | 'pro';

    if (!['lifetime', 'basic', 'pro'].includes(newPlan)) {
      return c.json({ error: 'Invalid plan' }, 400);
    }

    // Verify user is owner
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    if (org[0].ownerId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const PLAN_SEAT_LIMITS: Record<'lifetime' | 'basic' | 'pro', number> = {
      lifetime: 1,
      basic: 2,
      pro: 5,
    };

    const members = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    const seatsUsed = members.length + 1;
    const newSeatLimit = PLAN_SEAT_LIMITS[newPlan];

    const allowed = seatsUsed <= newSeatLimit;
    const reason = allowed
      ? undefined
      : `Cannot downgrade: You have ${seatsUsed} members but the ${newPlan} plan only allows ${newSeatLimit} seats. Please remove ${seatsUsed - newSeatLimit} members first.`;

    return c.json({
      success: true,
      data: {
        allowed,
        reason,
      },
    });
  } catch (error: any) {
    console.error('Can downgrade error:', error);
    return c.json({ error: 'Failed to check downgrade eligibility', message: error.message }, 500);
  }
});

export { seatsRoutes };
