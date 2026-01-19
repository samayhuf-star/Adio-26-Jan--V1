/**
 * Random Data Generator Utility
 * Generates random test data that changes every time it's called
 */

// Random seed keywords pools
const SEED_KEYWORD_POOLS = {
  services: [
    'plumbing services', 'electrician near me', 'hvac repair', 'roofing contractor',
    'landscaping services', 'carpet cleaning', 'window replacement', 'solar panel installation',
    'home security systems', 'appliance repair', 'garage door repair', 'fence installation',
    'deck builders', 'bathroom remodeling', 'kitchen renovation', 'flooring installation',
    'painting services', 'drywall repair', 'concrete contractors', 'tree removal'
  ],
  business: [
    'accounting software', 'crm solutions', 'project management tools', 'email marketing',
    'payroll services', 'invoicing software', 'time tracking', 'inventory management',
    'pos systems', 'ecommerce platform', 'website builder', 'seo services',
    'social media marketing', 'content management', 'cloud storage', 'data backup',
    'cybersecurity services', 'it support', 'voip phone systems', 'video conferencing'
  ],
  healthcare: [
    'dentist near me', 'orthodontist', 'dermatologist', 'cardiologist',
    'physical therapy', 'chiropractor', 'optometrist', 'psychiatrist',
    'urgent care', 'primary care doctor', 'pediatrician', 'gynecologist',
    'allergist', 'endocrinologist', 'neurologist', 'oncology',
    'mental health services', 'addiction treatment', 'weight loss clinic', 'fitness trainer'
  ],
  travel: [
    'airline phone number', 'hotel booking', 'car rental', 'flight deals',
    'vacation packages', 'cruise deals', 'travel insurance', 'visa services',
    'passport renewal', 'travel agency', 'tour packages', 'airport shuttle',
    'luggage storage', 'travel guide', 'currency exchange', 'travel credit card',
    'travel apps', 'travel planning', 'adventure travel', 'luxury travel'
  ],
  retail: [
    'online shopping', 'furniture stores', 'electronics store', 'clothing store',
    'shoe store', 'jewelry store', 'home decor', 'appliance store',
    'grocery delivery', 'pharmacy near me', 'bookstore', 'toy store',
    'sporting goods', 'pet store', 'garden center', 'hardware store',
    'auto parts store', 'beauty supply', 'cosmetics store', 'gift shop'
  ]
};

// Random negative keywords pools
const NEGATIVE_KEYWORD_POOLS = [
  ['cheap', 'discount', 'free', 'trial', 'sample', 'demo', 'test', 'review', 'reviews', 'rating'],
  ['job', 'jobs', 'career', 'hiring', 'apply', 'application', 'resume', 'salary', 'wage', 'employment'],
  ['school', 'university', 'college', 'education', 'course', 'training', 'learn', 'tutorial', 'class', 'degree'],
  ['wholesale', 'bulk', 'distributor', 'manufacturer', 'supplier', 'reseller', 'dealer', 'vendor', 'retailer', 'store'],
  ['diy', 'how to', 'tutorial', 'guide', 'instructions', 'manual', 'help', 'tips', 'tricks', 'advice'],
  ['scam', 'fraud', 'complaint', 'lawsuit', 'legal', 'attorney', 'lawyer', 'court', 'settlement', 'claim'],
  ['competitor', 'alternative', 'vs', 'compare', 'better than', 'instead of', 'replacement', 'substitute', 'similar', 'like'],
  ['information', 'what is', 'definition', 'meaning', 'explain', 'about', 'wiki', 'wikipedia', 'article', 'blog']
];

// Random URLs
const URL_DOMAINS = [
  'example.com', 'myservice.com', 'bestdeals.com', 'quickfix.com', 'proservices.com',
  'trustedpros.com', 'localservices.com', 'expertsolutions.com', 'premiumservices.com',
  'qualitycare.com', 'reliablepros.com', 'toprated.com', 'eliteservices.com'
];

// Random business names
const BUSINESS_NAMES = [
  'Pro Services', 'Elite Solutions', 'Premium Care', 'Trusted Experts', 'Quality Pros',
  'Best Services', 'Top Rated', 'Expert Team', 'Professional Care', 'Reliable Services',
  'Superior Solutions', 'Master Services', 'Prime Care', 'Ace Professionals', 'Star Services'
];

/**
 * Get random items from an array
 */
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Generate random seed keywords (3-5 keywords, comma-separated)
 */
export function generateRandomSeedKeywords(): string {
  const categories = Object.keys(SEED_KEYWORD_POOLS) as Array<keyof typeof SEED_KEYWORD_POOLS>;
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  const pool = SEED_KEYWORD_POOLS[selectedCategory];
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 keywords
  const keywords = getRandomItems(pool, count);
  return keywords.join(', ');
}

/**
 * Generate random negative keywords (15-25 keywords, newline-separated)
 */
export function generateRandomNegativeKeywords(): string {
  const allNegatives: string[] = [];
  // Pick 2-3 random pools
  const selectedPools = getRandomItems(NEGATIVE_KEYWORD_POOLS, 2 + Math.floor(Math.random() * 2));
  selectedPools.forEach(pool => {
    const count = 5 + Math.floor(Math.random() * 5); // 5-10 from each pool
    allNegatives.push(...getRandomItems(pool, count));
  });
  // Shuffle and return unique
  const unique = [...new Set(allNegatives)];
  return unique.join('\n');
}

/**
 * Generate random URL
 */
export function generateRandomUrl(): string {
  const domain = getRandomItems(URL_DOMAINS, 1)[0];
  const protocol = Math.random() > 0.5 ? 'https://' : 'https://';
  return `${protocol}www.${domain}`;
}

/**
 * Generate random business name
 */
export function generateRandomBusinessName(): string {
  return getRandomItems(BUSINESS_NAMES, 1)[0];
}

/**
 * Generate random core keywords for negative keywords builder
 */
export function generateRandomCoreKeywords(): string {
  const categories = Object.keys(SEED_KEYWORD_POOLS) as Array<keyof typeof SEED_KEYWORD_POOLS>;
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  const pool = SEED_KEYWORD_POOLS[selectedCategory];
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 keywords
  const keywords = getRandomItems(pool, count);
  return keywords.join(', ');
}

/**
 * Generate random user goal
 */
export function generateRandomUserGoal(): string {
  const goals = [
    'Generate leads for my service business',
    'Drive website traffic and conversions',
    'Get phone calls from potential customers',
    'Increase online sales and revenue',
    'Build brand awareness in local market',
    'Attract qualified customers',
    'Maximize ROI on ad spend',
    'Target high-intent buyers only'
  ];
  return getRandomItems(goals, 1)[0];
}

/**
 * Generate random target location
 */
export function generateRandomLocation(): string {
  const locations = [
    'United States', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
    'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX',
    'San Jose, CA', 'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH',
    'Charlotte, NC', 'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO'
  ];
  return getRandomItems(locations, 1)[0];
}

/**
 * Generate random competitor brands
 */
export function generateRandomCompetitorBrands(): string {
  const brands = [
    'Competitor A, Competitor B', 'Brand X, Brand Y', 'Company 1, Company 2',
    'Service Pro, Expert Care', 'Top Service, Best Care', 'Elite Co, Premium Inc',
    'Quality Services, Trusted Pros', 'Master Co, Ace Services'
  ];
  return getRandomItems(brands, 1)[0];
}

/**
 * Generate random keyword lists for Keyword Mixer
 */
export function generateRandomMixerLists(): { listA: string; listB: string; listC: string } {
  const categories = Object.keys(SEED_KEYWORD_POOLS) as Array<keyof typeof SEED_KEYWORD_POOLS>;
  
  // Get different categories for each list
  const catA = categories[Math.floor(Math.random() * categories.length)];
  const catB = categories[Math.floor(Math.random() * categories.length)];
  const catC = categories[Math.floor(Math.random() * categories.length)];
  
  const listA = getRandomItems(SEED_KEYWORD_POOLS[catA], 4 + Math.floor(Math.random() * 3)).join('\n');
  const listB = getRandomItems(SEED_KEYWORD_POOLS[catB], 4 + Math.floor(Math.random() * 3)).join('\n');
  const listC = getRandomItems(SEED_KEYWORD_POOLS[catC], 3 + Math.floor(Math.random() * 2)).join('\n');
  
  return { listA, listB, listC };
}

