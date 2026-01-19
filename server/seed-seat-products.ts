import { getUncachableStripeClient } from './stripeClient';

async function seedSeatProducts() {
  console.log('Seeding seat-based Stripe products...');
  
  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    console.log('Stripe not configured, skipping seat product seeding');
    return;
  }

  const existingProducts = await stripe.products.list({ active: true });
  const hasBasicPlan = existingProducts.data.some(p => p.metadata?.plan === 'basic');
  
  if (hasBasicPlan) {
    console.log('Seat-based products already exist, skipping seed');
    return;
  }

  console.log('Creating Basic Plan product...');
  const basicProduct = await stripe.products.create({
    name: 'Adiology Basic Plan',
    description: 'Basic plan with 2 seats included. Perfect for small teams.',
    metadata: {
      plan: 'basic',
      baseSeatLimit: '2',
      type: 'plan_subscription'
    }
  });

  const basicMonthlyPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 6999,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'basic_plan_monthly',
    metadata: { plan: 'basic', billing: 'monthly' }
  });

  console.log(`Created Basic Plan: ${basicProduct.id}`);
  console.log(`  Monthly: ${basicMonthlyPrice.id} ($69.99/mo)`);

  console.log('Creating Pro Plan product...');
  const proProduct = await stripe.products.create({
    name: 'Adiology Pro Plan',
    description: 'Pro plan with 5 seats included. Ideal for growing teams.',
    metadata: {
      plan: 'pro',
      baseSeatLimit: '5',
      type: 'plan_subscription'
    }
  });

  const proMonthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 12999,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'pro_plan_monthly',
    metadata: { plan: 'pro', billing: 'monthly' }
  });

  console.log(`Created Pro Plan: ${proProduct.id}`);
  console.log(`  Monthly: ${proMonthlyPrice.id} ($129.99/mo)`);

  console.log('Creating Extra Seat Add-On product...');
  const extraSeatProduct = await stripe.products.create({
    name: 'Extra Seat Add-On',
    description: 'Add an additional seat to your organization.',
    metadata: {
      type: 'extra_seat'
    }
  });

  const extraSeatPrice = await stripe.prices.create({
    product: extraSeatProduct.id,
    unit_amount: 2999,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'extra_seat_monthly',
    metadata: { type: 'extra_seat', billing: 'monthly' }
  });

  console.log(`Created Extra Seat Add-On: ${extraSeatProduct.id}`);
  console.log(`  Monthly: ${extraSeatPrice.id} ($29.99/seat/mo)`);

  console.log('\nDone! Seat-based products created successfully.');
  console.log('\nProduct IDs:');
  console.log(`  Basic Plan: ${basicProduct.id}`);
  console.log(`  Pro Plan: ${proProduct.id}`);
  console.log(`  Extra Seat: ${extraSeatProduct.id}`);
}

seedSeatProducts().catch(console.error);
