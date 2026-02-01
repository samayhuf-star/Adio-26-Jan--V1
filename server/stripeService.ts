import { getUncachableStripeClient } from './stripeClient';
import { getDatabaseUrl } from './dbConfig';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string, mode: 'subscription' | 'payment' = 'subscription') {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return null;
      }
      const product = await stripe.products.retrieve(productId);
      return product;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return [];
      }
      const products = await stripe.products.list({
        active,
        limit,
      });
      return products.data;
    } catch (error) {
      console.error('Error listing products:', error);
      return [];
    }
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return [];
      }
      
      const products = await stripe.products.list({
        active,
        limit,
        expand: ['data.default_price'],
      });
      
      const productsWithPrices = await Promise.all(
        products.data.map(async (product) => {
          const prices = await stripe.prices.list({
            product: product.id,
            active: true,
          });
          return {
            product_id: product.id,
            product_name: product.name,
            product_description: product.description,
            product_active: product.active,
            product_metadata: product.metadata,
            prices: prices.data.map(price => ({
              price_id: price.id,
              unit_amount: price.unit_amount,
              currency: price.currency,
              recurring: price.recurring,
              price_active: price.active,
              price_metadata: price.metadata,
            })),
          };
        })
      );
      
      return productsWithPrices;
    } catch (error) {
      console.error('Error listing products with prices:', error);
      return [];
    }
  }

  async getPrice(priceId: string) {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return null;
      }
      const price = await stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      console.error('Error getting price:', error);
      return null;
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return null;
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async getUser(userId: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
  }) {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (stripeInfo.stripeCustomerId) {
        updates.push(`stripe_customer_id = $${paramIndex++}`);
        values.push(stripeInfo.stripeCustomerId);
      }
      if (stripeInfo.stripeSubscriptionId) {
        updates.push(`stripe_subscription_id = $${paramIndex++}`);
        values.push(stripeInfo.stripeSubscriptionId);
      }
      if (stripeInfo.subscriptionPlan) {
        updates.push(`subscription_plan = $${paramIndex++}`);
        values.push(stripeInfo.subscriptionPlan);
      }
      if (stripeInfo.subscriptionStatus) {
        updates.push(`subscription_status = $${paramIndex++}`);
        values.push(stripeInfo.subscriptionStatus);
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user stripe info:', error);
      return null;
    }
  }
}

export const stripeService = new StripeService();
