import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  console.log('Seeding Stripe products and prices...');
  
  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    console.log('Stripe not configured, skipping product seeding');
    return;
  }

  const existingProducts = await stripe.products.search({ query: "name:'Adiology'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping seed');
    return;
  }

  const starterProduct = await stripe.products.create({
    name: 'Adiology Starter',
    description: 'Perfect for small businesses and beginners. Includes 10 campaigns/month, basic keyword generation, and email support.',
    metadata: {
      tier: 'starter',
      campaigns: '10',
      keywords: '1000',
      features: 'basic_keywords,email_support,csv_export'
    }
  });

  const starterMonthlyPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 2900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { billing: 'monthly' }
  });

  const starterYearlyPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 29000,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { billing: 'yearly', savings: '17%' }
  });

  console.log(`Created Starter: ${starterProduct.id}`);
  console.log(`  Monthly: ${starterMonthlyPrice.id} ($29/mo)`);
  console.log(`  Yearly: ${starterYearlyPrice.id} ($290/yr)`);

  const proProduct = await stripe.products.create({
    name: 'Adiology Pro',
    description: 'For growing businesses and agencies. Unlimited campaigns, AI-powered keywords, priority support, and web templates.',
    metadata: {
      tier: 'pro',
      campaigns: 'unlimited',
      keywords: 'unlimited',
      features: 'ai_keywords,priority_support,csv_export,web_templates,ad_extensions'
    }
  });

  const proMonthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 7900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { billing: 'monthly' }
  });

  const proYearlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 79000,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { billing: 'yearly', savings: '17%' }
  });

  console.log(`Created Pro: ${proProduct.id}`);
  console.log(`  Monthly: ${proMonthlyPrice.id} ($79/mo)`);
  console.log(`  Yearly: ${proYearlyPrice.id} ($790/yr)`);

  const enterpriseProduct = await stripe.products.create({
    name: 'Adiology Enterprise',
    description: 'For large agencies and enterprises. White-label options, dedicated support, custom integrations, and API access.',
    metadata: {
      tier: 'enterprise',
      campaigns: 'unlimited',
      keywords: 'unlimited',
      features: 'all_features,white_label,api_access,dedicated_support,custom_integrations'
    }
  });

  const enterpriseMonthlyPrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 19900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { billing: 'monthly' }
  });

  const enterpriseYearlyPrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 199000,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { billing: 'yearly', savings: '17%' }
  });

  console.log(`Created Enterprise: ${enterpriseProduct.id}`);
  console.log(`  Monthly: ${enterpriseMonthlyPrice.id} ($199/mo)`);
  console.log(`  Yearly: ${enterpriseYearlyPrice.id} ($1,990/yr)`);

  console.log('\nDone! Products and prices created successfully.');
}

seedProducts().catch(console.error);
