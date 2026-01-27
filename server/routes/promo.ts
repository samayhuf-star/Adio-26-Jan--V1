import { Hono } from 'hono';
import { db } from '../db';
import { promoTrials } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { stripeService } from '../stripeService';

const promoRoutes = new Hono();

// GET /api/promo/status - Get promo status
promoRoutes.get('/status', async (c) => {
  try {
    // Get total slots and remaining slots from database or config
    // For now, return default values
    const totalSlots = 50;
    
    // Count used slots (trials that have been converted)
    const usedTrials = await db
      .select()
      .from(promoTrials)
      .where(eq(promoTrials.status, 'converted'));

    const slotsRemaining = Math.max(0, totalSlots - usedTrials.length);
    const offerActive = slotsRemaining > 0;

    return c.json({
      success: true,
      slotsRemaining,
      totalSlots,
      offerActive,
    });
  } catch (error: any) {
    console.error('Get promo status error:', error);
    return c.json({ error: 'Failed to fetch promo status', message: error.message }, 500);
  }
});

// POST /api/promo/trial - Start promo trial
promoRoutes.post('/trial', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if slots are available
    const statusResponse = await fetch(`${c.req.url.split('/api')[0]}/api/promo/status`);
    const status = await statusResponse.json();

    if (!status.offerActive) {
      return c.json({ error: 'Promo offer is no longer available' }, 400);
    }

    // Check if email already has a trial
    const existingTrial = await db
      .select()
      .from(promoTrials)
      .where(eq(promoTrials.email, email))
      .limit(1);

    if (existingTrial.length > 0) {
      return c.json({ error: 'You already have a trial associated with this email' }, 400);
    }

    // Create trial record
    const trial = await db
      .insert(promoTrials)
      .values({
        email,
        status: 'pending',
      })
      .returning();

    // Create Stripe checkout session for trial
    // This is a simplified implementation - adjust based on your Stripe setup
    try {
      const products = await stripeService.listProductsWithPrices(true, 50, 0);
      const trialProduct = products.find((p: any) => 
        p.product_metadata?.type === 'trial' || 
        p.product_name?.toLowerCase().includes('trial')
      );

      if (!trialProduct) {
        return c.json({ 
          error: 'Trial product not configured',
          message: 'Please contact support'
        }, 500);
      }

      // Create checkout session
      const checkoutUrl = `${c.req.url.split('/api')[0]}/checkout?trial=${trial[0].id}`;

      return c.json({
        success: true,
        checkoutUrl,
        trialId: trial[0].id,
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return c.json({ 
        error: 'Failed to create checkout session',
        message: stripeError.message 
      }, 500);
    }
  } catch (error: any) {
    console.error('Start trial error:', error);
    return c.json({ error: 'Failed to start trial', message: error.message }, 500);
  }
});

// POST /api/promo/lifetime-direct - Purchase lifetime deal directly
promoRoutes.post('/lifetime-direct', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if slots are available
    const statusResponse = await fetch(`${c.req.url.split('/api')[0]}/api/promo/status`);
    const status = await statusResponse.json();

    if (!status.offerActive) {
      return c.json({ error: 'Promo offer is no longer available' }, 400);
    }

    // Check if email already has a lifetime purchase
    const existingTrial = await db
      .select()
      .from(promoTrials)
      .where(eq(promoTrials.email, email))
      .limit(1);

    if (existingTrial.length > 0 && existingTrial[0].status === 'converted') {
      return c.json({ error: 'You already have a lifetime purchase' }, 400);
    }

    // Create trial record with pending status
    const trial = await db
      .insert(promoTrials)
      .values({
        email,
        status: 'pending',
      })
      .returning();

    // Create Stripe checkout session for lifetime deal
    try {
      const products = await stripeService.listProductsWithPrices(true, 50, 0);
      const lifetimeProduct = products.find((p: any) => 
        p.product_metadata?.type === 'lifetime' || 
        p.product_name?.toLowerCase().includes('lifetime')
      );

      if (!lifetimeProduct) {
        return c.json({ 
          error: 'Lifetime product not configured',
          message: 'Please contact support'
        }, 500);
      }

      // Create checkout session
      const checkoutUrl = `${c.req.url.split('/api')[0]}/checkout?lifetime=${trial[0].id}`;

      return c.json({
        success: true,
        checkoutUrl,
        trialId: trial[0].id,
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return c.json({ 
        error: 'Failed to create checkout session',
        message: stripeError.message 
      }, 500);
    }
  } catch (error: any) {
    console.error('Lifetime direct error:', error);
    return c.json({ error: 'Failed to process lifetime purchase', message: error.message }, 500);
  }
});

export { promoRoutes };
