import { getUncachableStripeClient } from './stripeClient';
// PocketBase removed - using database directly
// import { pbAdmin } from './pocketbase';

export type PlanType = 'lifetime' | 'basic' | 'pro';

export interface OrganizationMetadata {
  plan: PlanType;
  baseSeatLimit: number;
  extraSeats: number;
  totalSeatLimit: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  [key: string]: unknown;
}

// Stub for organization management - PocketBase removed
const getOrganizationFromPocketBase = async (_organizationId: string): Promise<{ metadata?: OrganizationMetadata } | null> => {
  // TODO: Replace with database query
  return null;
};

export const PLAN_SEAT_LIMITS: Record<PlanType, number> = {
  lifetime: 1,
  basic: 2,
  pro: 5,
};

export const PLAN_PRICES = {
  basic: 6999,
  pro: 12999,
  extraSeat: 2999,
};

export class SeatManagement {
  async getOrganizationMetadata(organizationId: string): Promise<OrganizationMetadata | null> {
    try {
      const org = await getOrganizationFromPocketBase(organizationId);
      if (!org) {
        // Return default metadata if organization doesn't exist
        return {
          plan: 'lifetime',
          baseSeatLimit: 1,
          extraSeats: 0,
          totalSeatLimit: 1,
        };
      }
      
      const metadata = (org.metadata || org) as unknown as OrganizationMetadata;
      
      if (!metadata.plan) {
        return {
          plan: 'lifetime',
          baseSeatLimit: 1,
          extraSeats: 0,
          totalSeatLimit: 1,
          stripeCustomerId: metadata.stripeCustomerId,
          stripeSubscriptionId: metadata.stripeSubscriptionId,
        };
      }
      
      return metadata;
    } catch (error) {
      console.error('Error getting organization metadata:', error);
      return null;
    }
  }

  async updateOrganizationMetadata(
    organizationId: string, 
    metadata: Partial<OrganizationMetadata>
  ): Promise<boolean> {
    try {
      const org = await getOrganizationFromPocketBase(organizationId);
      const currentMetadata = org ? ((org.metadata || org) as unknown as OrganizationMetadata) : null;
      
      const updatedMetadata: OrganizationMetadata = {
        plan: metadata.plan ?? currentMetadata?.plan ?? 'lifetime',
        baseSeatLimit: metadata.baseSeatLimit ?? currentMetadata?.baseSeatLimit ?? 1,
        extraSeats: metadata.extraSeats ?? currentMetadata?.extraSeats ?? 0,
        totalSeatLimit: metadata.totalSeatLimit ?? currentMetadata?.totalSeatLimit ?? 1,
        stripeCustomerId: metadata.stripeCustomerId ?? currentMetadata?.stripeCustomerId,
        stripeSubscriptionId: metadata.stripeSubscriptionId ?? currentMetadata?.stripeSubscriptionId,
      };

      if (metadata.baseSeatLimit !== undefined || metadata.extraSeats !== undefined) {
        updatedMetadata.totalSeatLimit = updatedMetadata.baseSeatLimit + updatedMetadata.extraSeats;
      }

      // PocketBase removed - skip persistence; return true for API compatibility
      return true;
    } catch (error) {
      console.error('Error updating organization metadata:', error);
      return false;
    }
  }

  async getPaidSeatsUsed(_organizationId: string): Promise<number> {
    // PocketBase removed - return 0; replace with database query when implemented
    return 0;
  }

  async canAddSeat(organizationId: string): Promise<{ allowed: boolean; reason?: string; seatsUsed: number; totalLimit: number }> {
    const metadata = await this.getOrganizationMetadata(organizationId);
    if (!metadata) {
      return { allowed: false, reason: 'Organization not found', seatsUsed: 0, totalLimit: 0 };
    }

    const seatsUsed = await this.getPaidSeatsUsed(organizationId);
    const totalLimit = metadata.totalSeatLimit;

    if (seatsUsed >= totalLimit) {
      return {
        allowed: false,
        reason: 'Seat limit reached. Please purchase additional seats or upgrade your plan.',
        seatsUsed,
        totalLimit,
      };
    }

    return { allowed: true, seatsUsed, totalLimit };
  }

  async createExtraSeatCheckoutSession(
    organizationId: string,
    stripeCustomerId: string,
    successUrl: string,
    cancelUrl: string,
    quantity: number = 1
  ): Promise<string | null> {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return null;
      }
      
      const prices = await stripe.prices.list({
        lookup_keys: ['extra_seat_monthly'],
        active: true,
      });

      let priceId: string;
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        const products = await stripe.products.list({
          active: true,
        });
        const extraSeatProduct = products.data.find(p => 
          p.metadata?.type === 'extra_seat' || p.name.toLowerCase().includes('extra seat')
        );

        if (!extraSeatProduct) {
          console.error('Extra seat product not found');
          return null;
        }

        const productPrices = await stripe.prices.list({
          product: extraSeatProduct.id,
          active: true,
        });

        if (productPrices.data.length === 0) {
          console.error('No active price found for extra seat product');
          return null;
        }

        priceId = productPrices.data[0].id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
          type: 'extra_seat',
          quantity: quantity.toString(),
        },
      });

      return session.url;
    } catch (error) {
      console.error('Error creating extra seat checkout session:', error);
      return null;
    }
  }

  async createPlanCheckoutSession(
    organizationId: string,
    plan: 'basic' | 'pro',
    customerEmail: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string | null> {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return null;
      }
      
      const prices = await stripe.prices.list({
        lookup_keys: [`${plan}_plan_monthly`],
        active: true,
      });

      let priceId: string;
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        const products = await stripe.products.list({
          active: true,
        });
        const planProduct = products.data.find(p => 
          p.metadata?.plan === plan || p.name.toLowerCase().includes(plan)
        );

        if (!planProduct) {
          console.error(`${plan} plan product not found`);
          return null;
        }

        const productPrices = await stripe.prices.list({
          product: planProduct.id,
          active: true,
        });

        if (productPrices.data.length === 0) {
          console.error(`No active price found for ${plan} plan`);
          return null;
        }

        priceId = productPrices.data[0].id;
      }

      const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
          type: 'plan_subscription',
          plan,
        },
      });

      return session.url;
    } catch (error) {
      console.error('Error creating plan checkout session:', error);
      return null;
    }
  }

  async handleCheckoutCompleted(session: any): Promise<void> {
    const { organizationId, type, plan, quantity } = session.metadata || {};
    
    if (!organizationId) {
      console.error('No organizationId in checkout session metadata');
      return;
    }

    const stripeCustomerId = session.customer;
    const stripeSubscriptionId = session.subscription;

    if (type === 'extra_seat') {
      const currentMetadata = await this.getOrganizationMetadata(organizationId);
      if (currentMetadata) {
        await this.updateOrganizationMetadata(organizationId, {
          extraSeats: currentMetadata.extraSeats + parseInt(quantity || '1'),
          stripeCustomerId,
          stripeSubscriptionId,
        });
      }
    } else if (type === 'plan_subscription' && plan) {
      const baseSeatLimit = PLAN_SEAT_LIMITS[plan as PlanType] || 1;
      await this.updateOrganizationMetadata(organizationId, {
        plan: plan as PlanType,
        baseSeatLimit,
        stripeCustomerId,
        stripeSubscriptionId,
      });
    }
  }

  async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const items = subscription.items?.data || [];
    let extraSeats = 0;
    let plan: PlanType | null = null;

    for (const item of items) {
      const productMetadata = item.price?.product?.metadata || {};
      if (productMetadata.type === 'extra_seat') {
        extraSeats += item.quantity || 1;
      } else if (productMetadata.plan) {
        plan = productMetadata.plan as PlanType;
      }
    }

    const updates: Partial<OrganizationMetadata> = { extraSeats };
    if (plan) {
      updates.plan = plan;
      updates.baseSeatLimit = PLAN_SEAT_LIMITS[plan];
    }

    await this.updateOrganizationMetadata(organizationId, updates);
  }

  async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    await this.updateOrganizationMetadata(organizationId, {
      plan: 'lifetime',
      baseSeatLimit: 1,
      extraSeats: 0,
    });
  }

  async canDowngradePlan(organizationId: string, newPlan: PlanType): Promise<{ allowed: boolean; reason?: string }> {
    const seatsUsed = await this.getPaidSeatsUsed(organizationId);
    const newSeatLimit = PLAN_SEAT_LIMITS[newPlan];

    if (seatsUsed > newSeatLimit) {
      return {
        allowed: false,
        reason: `Cannot downgrade: You have ${seatsUsed} members but the ${newPlan} plan only allows ${newSeatLimit} seats. Please remove ${seatsUsed - newSeatLimit} members first.`,
      };
    }

    return { allowed: true };
  }
}

export const seatManagement = new SeatManagement();
