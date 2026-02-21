import { Hono } from 'hono';
import { db } from '../db';
import { supportTickets } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

export const ticketsRoutes = new Hono();

async function getUserId(c: any): Promise<string | null> {
  return await getUserIdFromToken(c);
}

ticketsRoutes.post('/create', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { subject, message, priority, userEmail, userName } = await c.req.json();

    if (!subject || !message) {
      return c.json({ error: 'Subject and message are required' }, 400);
    }

    const [ticket] = await db.insert(supportTickets).values({
      userId,
      userEmail: userEmail || null,
      userName: userName || null,
      subject,
      message,
      priority: priority || 'Medium',
      status: 'Open',
    }).returning();

    return c.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Create ticket error:', error);
    return c.json({ error: 'Failed to create ticket' }, 500);
  }
});

ticketsRoutes.get('/list', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));

    return c.json({ success: true, tickets });
  } catch (error: any) {
    console.error('List tickets error:', error);
    return c.json({ error: 'Failed to fetch tickets' }, 500);
  }
});

ticketsRoutes.get('/all', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tickets = await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));

    return c.json({ success: true, tickets });
  } catch (error: any) {
    console.error('List all tickets error:', error);
    return c.json({ error: 'Failed to fetch tickets' }, 500);
  }
});

ticketsRoutes.post('/reply/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ticketId = c.req.param('id');
    const { adminReply, status } = await c.req.json();

    if (!adminReply) {
      return c.json({ error: 'Reply message is required' }, 400);
    }

    const [updated] = await db
      .update(supportTickets)
      .set({
        adminReply,
        adminRepliedAt: new Date(),
        adminRepliedBy: userId,
        status: status || 'Resolved',
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    return c.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error('Reply to ticket error:', error);
    return c.json({ error: 'Failed to reply to ticket' }, 500);
  }
});

ticketsRoutes.patch('/status/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ticketId = c.req.param('id');
    const { status } = await c.req.json();

    const [updated] = await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    return c.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error('Update ticket status error:', error);
    return c.json({ error: 'Failed to update ticket' }, 500);
  }
});
