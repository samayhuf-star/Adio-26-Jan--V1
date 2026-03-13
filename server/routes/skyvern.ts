import { Hono } from 'hono';

export const skyvernRoutes = new Hono();

skyvernRoutes.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    const { workflow_id, workflow_run_id, status, output, error } = body;

    console.log(`[Skyvern] Webhook received — workflow_id: ${workflow_id}, run_id: ${workflow_run_id}, status: ${status}`);

    if (error) {
      console.error(`[Skyvern] Workflow error:`, error);
    }

    if (output) {
      console.log(`[Skyvern] Workflow output:`, JSON.stringify(output).slice(0, 500));
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('[Skyvern] Webhook processing error:', err);
    return c.json({ success: false, error: 'Failed to process webhook' }, 500);
  }
});
