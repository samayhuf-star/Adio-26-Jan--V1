import { Hono } from 'hono';
import { db } from '../db';
import { tasks, taskProjects } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

const tasksRoutes = new Hono();

// Helper to get user ID from token
async function getUserId(c: any): Promise<string | null> {
  return await getUserIdFromToken(c);
}

// GET /api/tasks - List all tasks for user
tasksRoutes.get('/', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    return c.json({
      success: true,
      data: userTasks.map((t) => ({
        id: t.id,
        userId: t.userId,
        projectId: t.projectId,
        title: t.title,
        description: t.description,
        isToday: t.isToday,
        isCompleted: t.isCompleted,
        priority: t.priority,
        dueDate: t.dueDate,
        order: t.order,
        completedAt: t.completedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return c.json({ error: 'Failed to fetch tasks', message: error.message }, 500);
  }
});

// POST /api/tasks - Create task
tasksRoutes.post('/', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, projectId, priority, dueDate, isToday } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Verify project belongs to user if provided
    if (projectId) {
      const project = await db
        .select()
        .from(taskProjects)
        .where(and(eq(taskProjects.id, projectId), eq(taskProjects.userId, userId)))
        .limit(1);

      if (project.length === 0) {
        return c.json({ error: 'Project not found' }, 404);
      }
    }

    const newTask = await db
      .insert(tasks)
      .values({
        userId,
        title,
        description: description || '',
        projectId: projectId || null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        isToday: isToday || false,
        isCompleted: false,
        order: 0,
      })
      .returning();

    return c.json({
      success: true,
      data: {
        id: newTask[0].id,
        userId: newTask[0].userId,
        projectId: newTask[0].projectId,
        title: newTask[0].title,
        description: newTask[0].description,
        isToday: newTask[0].isToday,
        isCompleted: newTask[0].isCompleted,
        priority: newTask[0].priority,
        dueDate: newTask[0].dueDate,
        order: newTask[0].order,
        completedAt: newTask[0].completedAt,
        createdAt: newTask[0].createdAt,
        updatedAt: newTask[0].updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    return c.json({ error: 'Failed to create task', message: error.message }, 500);
  }
});

// PUT /api/tasks/:id - Update task
tasksRoutes.put('/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = parseInt(c.req.param('id'), 10);
    const updates = await c.req.json();

    // Verify task belongs to user
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.projectId !== undefined) {
      if (updates.projectId) {
        // Verify project belongs to user
        const project = await db
          .select()
          .from(taskProjects)
          .where(and(eq(taskProjects.id, updates.projectId), eq(taskProjects.userId, userId)))
          .limit(1);

        if (project.length === 0) {
          return c.json({ error: 'Project not found' }, 404);
        }
      }
      updateData.projectId = updates.projectId || null;
    }
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.isToday !== undefined) updateData.isToday = updates.isToday;
    if (updates.isCompleted !== undefined) {
      updateData.isCompleted = updates.isCompleted;
      updateData.completedAt = updates.isCompleted ? new Date() : null;
    }
    if (updates.order !== undefined) updateData.order = updates.order;

    const updated = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    return c.json({
      success: true,
      data: {
        id: updated[0].id,
        userId: updated[0].userId,
        projectId: updated[0].projectId,
        title: updated[0].title,
        description: updated[0].description,
        isToday: updated[0].isToday,
        isCompleted: updated[0].isCompleted,
        priority: updated[0].priority,
        dueDate: updated[0].dueDate,
        order: updated[0].order,
        completedAt: updated[0].completedAt,
        createdAt: updated[0].createdAt,
        updatedAt: updated[0].updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return c.json({ error: 'Failed to update task', message: error.message }, 500);
  }
});

// DELETE /api/tasks/:id - Delete task
tasksRoutes.delete('/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = parseInt(c.req.param('id'), 10);

    // Verify task belongs to user
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Task not found' }, 404);
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    return c.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return c.json({ error: 'Failed to delete task', message: error.message }, 500);
  }
});

// GET /api/projects - List all projects for user (mapped from /api/tasks/projects)
tasksRoutes.get('/projects', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProjects = await db
      .select()
      .from(taskProjects)
      .where(eq(taskProjects.userId, userId))
      .orderBy(taskProjects.order);

    return c.json({
      success: true,
      data: userProjects.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        color: p.color,
        order: p.order,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return c.json({ error: 'Failed to fetch projects', message: error.message }, 500);
  }
});

// POST /api/projects - Create project
tasksRoutes.post('/projects', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, color } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const newProject = await db
      .insert(taskProjects)
      .values({
        userId,
        name,
        color: color || '#6366f1',
        order: 0,
      })
      .returning();

    return c.json({
      success: true,
      data: {
        id: newProject[0].id,
        userId: newProject[0].userId,
        name: newProject[0].name,
        color: newProject[0].color,
        order: newProject[0].order,
        createdAt: newProject[0].createdAt,
        updatedAt: newProject[0].updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    return c.json({ error: 'Failed to create project', message: error.message }, 500);
  }
});

// DELETE /api/projects/:id - Delete project
tasksRoutes.delete('/projects/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = parseInt(c.req.param('id'), 10);

    // Verify project belongs to user
    const existing = await db
      .select()
      .from(taskProjects)
      .where(and(eq(taskProjects.id, projectId), eq(taskProjects.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await db.delete(taskProjects).where(eq(taskProjects.id, projectId));

    return c.json({
      success: true,
      message: 'Project deleted',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return c.json({ error: 'Failed to delete project', message: error.message }, 500);
  }
});

export { tasksRoutes };
