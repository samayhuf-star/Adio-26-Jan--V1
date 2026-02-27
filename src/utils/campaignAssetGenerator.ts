interface AssetGeneratorInput {
  businessName: string;
  industry: string;
  keywords: string[];
  url: string;
  uniqueValueProposition?: string;
  location?: string;
  phoneNumber?: string;
  countryCode?: string;
}

export interface GeneratedSitelink {
  text: string;
  description1: string;
  description2: string;
  finalUrl: string;
  status: string;
}

export interface GeneratedCallout {
  text: string;
  status: string;
}

export interface GeneratedSnippet {
  header: string;
  values: string;
  status: string;
}

export interface GeneratedCallExtension {
  phoneNumber: string;
  countryCode: string;
  status: string;
}

export interface GeneratedPriceItem {
  header: string;
  description: string;
  price: string;
  unit: string;
  path: string;
}

export interface GeneratedPriceExtension {
  qualifier: string;
  priceType: string;
  items: GeneratedPriceItem[];
}

export interface GeneratedPromotion {
  occasion?: string;
  discountModifier?: string;
  percentOff?: string;
  moneyAmountOff?: string;
  itemDescription: string;
}

export interface GeneratedAssets {
  sitelinks: GeneratedSitelink[];
  callouts: GeneratedCallout[];
  snippets: GeneratedSnippet[];
  callExtensions: GeneratedCallExtension[];
  priceExtension?: GeneratedPriceExtension;
  promotion?: GeneratedPromotion;
}

const INDUSTRY_SITELINKS: Record<string, { text: string; desc1: string; desc2: string; path: string }[]> = {
  plumbing: [
    { text: 'Emergency Plumbing', desc1: '24/7 Emergency Service', desc2: 'Fast Response Guaranteed', path: '/emergency' },
    { text: 'Our Services', desc1: 'Full Range of Plumbing', desc2: 'Residential & Commercial', path: '/services' },
    { text: 'Free Estimates', desc1: 'No Obligation Quotes', desc2: 'Transparent Pricing', path: '/free-estimate' },
    { text: 'About Us', desc1: 'Licensed & Insured Pros', desc2: 'Trusted Local Experts', path: '/about' },
    { text: 'Drain Cleaning', desc1: 'Fast Clog Removal', desc2: 'Hydro-Jetting Available', path: '/drain-cleaning' },
    { text: 'Water Heater Service', desc1: 'Repair & Replacement', desc2: 'All Brands Serviced', path: '/water-heater' },
    { text: 'Customer Reviews', desc1: '5-Star Rated Service', desc2: 'See What Clients Say', path: '/reviews' },
    { text: 'Financing Options', desc1: 'Flexible Payment Plans', desc2: 'Apply In Minutes', path: '/financing' },
  ],
  electrical: [
    { text: 'Electrical Services', desc1: 'Full Electrical Solutions', desc2: 'Licensed Electricians', path: '/services' },
    { text: 'Emergency Repairs', desc1: '24/7 Electrical Emergency', desc2: 'Same-Day Service', path: '/emergency' },
    { text: 'Free Quote', desc1: 'Upfront Honest Pricing', desc2: 'No Hidden Fees', path: '/quote' },
    { text: 'Why Choose Us', desc1: 'Certified & Insured', desc2: 'Satisfaction Guaranteed', path: '/about' },
    { text: 'Panel Upgrades', desc1: 'Electrical Panel Service', desc2: 'Code-Compliant Work', path: '/panel-upgrades' },
    { text: 'EV Charger Install', desc1: 'Home EV Charging Setup', desc2: 'Level 2 Installation', path: '/ev-chargers' },
    { text: 'Customer Reviews', desc1: 'Top Rated Electricians', desc2: 'Read Our Reviews', path: '/reviews' },
    { text: 'Service Areas', desc1: 'Serving Your Local Area', desc2: 'Fast Local Response', path: '/service-areas' },
  ],
  hvac: [
    { text: 'AC Repair', desc1: 'Expert AC Repair Service', desc2: 'All Brands Serviced', path: '/ac-repair' },
    { text: 'Heating Services', desc1: 'Furnace & Heating Repair', desc2: 'Stay Warm This Winter', path: '/heating' },
    { text: 'Free Estimate', desc1: 'No Obligation Quote', desc2: 'Competitive Pricing', path: '/estimate' },
    { text: 'Maintenance Plans', desc1: 'Preventive HVAC Care', desc2: 'Save On Energy Bills', path: '/maintenance' },
    { text: 'AC Installation', desc1: 'New System Installation', desc2: 'Energy Efficient Units', path: '/ac-installation' },
    { text: 'Indoor Air Quality', desc1: 'Air Purifiers & Filters', desc2: 'Breathe Cleaner Air', path: '/air-quality' },
    { text: 'Customer Reviews', desc1: '5-Star HVAC Service', desc2: 'See Client Testimonials', path: '/reviews' },
    { text: 'Financing Options', desc1: '0% Interest Available', desc2: 'Flexible Payment Plans', path: '/financing' },
  ],
  legal: [
    { text: 'Practice Areas', desc1: 'Comprehensive Legal Help', desc2: 'Experienced Attorneys', path: '/practice-areas' },
    { text: 'Free Consultation', desc1: 'Speak With A Lawyer', desc2: 'No Obligation Review', path: '/consultation' },
    { text: 'Case Results', desc1: 'Proven Track Record', desc2: 'Millions Recovered', path: '/results' },
    { text: 'Contact Us', desc1: 'Available 24/7', desc2: 'Confidential Inquiry', path: '/contact' },
    { text: 'Our Attorneys', desc1: 'Meet Our Legal Team', desc2: 'Decades of Experience', path: '/attorneys' },
    { text: 'Client Reviews', desc1: 'What Clients Are Saying', desc2: '5-Star Legal Service', path: '/reviews' },
    { text: 'FAQ', desc1: 'Common Legal Questions', desc2: 'Get Quick Answers', path: '/faq' },
    { text: 'No Win No Fee', desc1: 'Contingency Fee Basis', desc2: 'You Pay Only If We Win', path: '/fees' },
  ],
  dental: [
    { text: 'Dental Services', desc1: 'Complete Dental Care', desc2: 'Family & Cosmetic', path: '/services' },
    { text: 'Book Appointment', desc1: 'Easy Online Scheduling', desc2: 'Same-Day Available', path: '/appointment' },
    { text: 'New Patient Offer', desc1: 'Special For New Patients', desc2: 'Exam & X-Rays Included', path: '/new-patients' },
    { text: 'Insurance Accepted', desc1: 'Most Plans Accepted', desc2: 'Financing Available', path: '/insurance' },
    { text: 'Teeth Whitening', desc1: 'Professional Whitening', desc2: 'Brighter Smile Today', path: '/whitening' },
    { text: 'Dental Implants', desc1: 'Permanent Tooth Replacement', desc2: 'Natural-Looking Results', path: '/implants' },
    { text: 'Emergency Dental', desc1: 'Urgent Dental Care', desc2: 'Same-Day Relief', path: '/emergency' },
    { text: 'Patient Reviews', desc1: 'See What Patients Say', desc2: 'Trusted By Thousands', path: '/reviews' },
  ],
  medical: [
    { text: 'Our Services', desc1: 'Comprehensive Healthcare', desc2: 'Expert Medical Team', path: '/services' },
    { text: 'Book Online', desc1: 'Schedule Your Visit', desc2: 'Telehealth Available', path: '/book' },
    { text: 'Patient Resources', desc1: 'Forms & Information', desc2: 'Insurance Accepted', path: '/patients' },
    { text: 'About Our Practice', desc1: 'Board-Certified Doctors', desc2: 'Compassionate Care', path: '/about' },
    { text: 'Telehealth Visits', desc1: 'Virtual Appointments', desc2: 'See A Doctor Online', path: '/telehealth' },
    { text: 'Urgent Care', desc1: 'Walk-Ins Welcome', desc2: 'No Appointment Needed', path: '/urgent-care' },
    { text: 'Lab Services', desc1: 'On-Site Lab Testing', desc2: 'Fast Results', path: '/lab' },
    { text: 'Patient Reviews', desc1: 'Trusted By Our Community', desc2: 'Read Real Testimonials', path: '/reviews' },
  ],
  roofing: [
    { text: 'Roofing Services', desc1: 'Repair & Replacement', desc2: 'All Roof Types', path: '/services' },
    { text: 'Free Inspection', desc1: 'No Cost Roof Inspection', desc2: 'Detailed Assessment', path: '/inspection' },
    { text: 'Storm Damage', desc1: 'Insurance Claim Help', desc2: 'Emergency Repairs', path: '/storm-damage' },
    { text: 'Get A Quote', desc1: 'Fast Free Estimates', desc2: 'Competitive Pricing', path: '/quote' },
    { text: 'Roof Replacement', desc1: 'Full Roof Replacement', desc2: 'Premium Materials', path: '/replacement' },
    { text: 'Gutters & Siding', desc1: 'Complete Exterior Work', desc2: 'All-In-One Contractor', path: '/gutters' },
    { text: 'Before & After', desc1: 'See Our Completed Work', desc2: 'Real Project Photos', path: '/gallery' },
    { text: 'Financing Options', desc1: 'Low Monthly Payments', desc2: 'Apply Today', path: '/financing' },
  ],
  travel: [
    { text: 'Destinations', desc1: 'Popular Travel Spots', desc2: 'Exclusive Deals', path: '/destinations' },
    { text: 'Special Offers', desc1: 'Limited Time Deals', desc2: 'Save On Travel', path: '/deals' },
    { text: 'Book Now', desc1: 'Easy Online Booking', desc2: 'Best Price Guarantee', path: '/book' },
    { text: 'Travel Guide', desc1: 'Expert Travel Tips', desc2: 'Plan Your Trip', path: '/guide' },
    { text: 'Group Travel', desc1: 'Group Rates Available', desc2: 'Custom Group Packages', path: '/group-travel' },
    { text: 'Cruise Deals', desc1: 'Best Cruise Prices', desc2: 'All-Inclusive Options', path: '/cruises' },
    { text: 'Customer Reviews', desc1: 'Thousands Of Happy Travelers', desc2: 'Read Our Reviews', path: '/reviews' },
    { text: 'Travel Insurance', desc1: 'Protect Your Trip', desc2: 'Peace Of Mind Coverage', path: '/insurance' },
  ],
  food: [
    { text: 'Our Menu', desc1: 'View Full Menu Online', desc2: 'Fresh Ingredients Daily', path: '/menu' },
    { text: 'Order Online', desc1: 'Delivery & Takeout', desc2: 'Fast Convenient Service', path: '/order' },
    { text: 'Catering', desc1: 'Events & Parties', desc2: 'Custom Menu Options', path: '/catering' },
    { text: 'Locations', desc1: 'Find Us Near You', desc2: 'Multiple Locations', path: '/locations' },
    { text: 'Daily Specials', desc1: 'Check Today\'s Specials', desc2: 'New Items Every Day', path: '/specials' },
    { text: 'Reservations', desc1: 'Book Your Table Online', desc2: 'No Wait Guaranteed', path: '/reservations' },
    { text: 'Customer Reviews', desc1: 'Loved By Our Community', desc2: 'See What People Say', path: '/reviews' },
    { text: 'Gift Cards', desc1: 'Perfect Gift For Anyone', desc2: 'Available Online', path: '/gift-cards' },
  ],
};

const INDUSTRY_CALLOUTS: Record<string, string[]> = {
  plumbing: ['Licensed & Insured', '24/7 Emergency Service', 'Free Estimates', 'Satisfaction Guaranteed', 'No Hidden Fees', 'Same-Day Service', 'No Contracts', 'Money-Back Guarantee', 'Locally Owned', 'Award-Winning Service'],
  electrical: ['Licensed Electricians', '24/7 Availability', 'Free Quotes', 'Safety Certified', 'Upfront Pricing', 'Fast Response', 'No Contracts', 'Code-Compliant Work', 'Locally Owned', 'Award-Winning Team'],
  hvac: ['Licensed HVAC Pros', 'Energy Efficient', 'All Brands Serviced', 'Financing Available', 'Maintenance Plans', 'Fast Repairs', 'No Contracts', 'Money-Back Guarantee', 'Same-Day Availability', 'Award-Winning Service'],
  legal: ['Free Consultation', 'No Win No Fee', 'Experienced Attorneys', 'Confidential', '24/7 Available', 'Proven Results', 'Board-Certified', 'Millions Recovered', 'Fast Response', 'Bilingual Staff'],
  dental: ['Gentle Dental Care', 'Insurance Accepted', 'Emergency Dentistry', 'Family Friendly', 'Modern Technology', 'Financing Options', 'No Contracts', 'Sedation Available', 'Same-Day Crowns', 'Kids Welcome'],
  medical: ['Board Certified', 'Insurance Accepted', 'Telehealth Available', 'Same-Day Visits', 'Compassionate Care', 'Extended Hours', 'Walk-Ins Welcome', 'Online Scheduling', 'Bilingual Staff', 'On-Site Lab'],
  roofing: ['Licensed & Bonded', 'Free Inspections', 'Warranty Included', 'Storm Damage Experts', 'Quality Materials', 'Financing Available', 'No Contracts', 'Insurance Claims Handled', 'Same-Day Assessment', 'Award-Winning Work'],
  travel: ['Best Price Guarantee', 'Free Cancellation', '24/7 Support', 'Expert Travel Agents', 'Custom Itineraries', 'Group Discounts', 'No Booking Fees', 'Exclusive Deals', 'Family Packages', 'Loyalty Rewards'],
  food: ['Fresh Ingredients', 'Online Ordering', 'Catering Available', 'Family Friendly', 'Daily Specials', 'Fast Delivery', 'No Minimum Order', 'Loyalty Rewards', 'Gluten-Free Options', 'Farm-To-Table'],
};

const INDUSTRY_SNIPPETS: Record<string, { header: string; values: string }[]> = {
  plumbing: [
    { header: 'Service catalog', values: 'Drain Cleaning, Pipe Repair, Water Heater, Leak Detection, Sewer Line' },
    { header: 'Amenities', values: 'Free Estimates, Same-Day Service, 24/7 Emergency, Licensed Pros' },
    { header: 'Brands', values: 'Rheem, Bradford White, AO Smith, Navien, Kohler' },
  ],
  electrical: [
    { header: 'Service catalog', values: 'Wiring, Panel Upgrades, Lighting, Outlet Repair, Generators' },
    { header: 'Amenities', values: 'Free Estimates, Licensed, Insured, 24/7 Service' },
    { header: 'Types', values: 'Residential, Commercial, Industrial, Solar, EV Chargers' },
  ],
  hvac: [
    { header: 'Service catalog', values: 'AC Repair, Heating, Installation, Maintenance, Duct Cleaning' },
    { header: 'Amenities', values: 'Free Estimates, Financing, All Brands, Energy Efficient' },
    { header: 'Brands', values: 'Trane, Carrier, Lennox, Bryant, Goodman, Rheem' },
  ],
  legal: [
    { header: 'Service catalog', values: 'Personal Injury, Family Law, Criminal Defense, Estate Planning, Business Law' },
    { header: 'Amenities', values: 'Free Consultation, Virtual Meetings, Flexible Hours, Payment Plans' },
    { header: 'Types', values: 'Car Accidents, Slip and Fall, Medical Malpractice, Workers Comp' },
  ],
  dental: [
    { header: 'Service catalog', values: 'Cleanings, Fillings, Crowns, Implants, Whitening, Orthodontics' },
    { header: 'Amenities', values: 'Insurance Accepted, Financing, Sedation Options, Digital X-Rays' },
    { header: 'Types', values: 'General, Cosmetic, Pediatric, Orthodontics, Oral Surgery' },
  ],
  medical: [
    { header: 'Service catalog', values: 'Primary Care, Urgent Care, Preventive, Chronic Care, Lab Services' },
    { header: 'Amenities', values: 'Telehealth, Online Portal, Extended Hours, Walk-Ins Welcome' },
    { header: 'Types', values: 'Family Medicine, Internal Medicine, Pediatrics, Women\'s Health' },
  ],
  roofing: [
    { header: 'Service catalog', values: 'Roof Repair, Replacement, Inspection, Storm Damage, Gutters' },
    { header: 'Types', values: 'Shingle, Metal, Tile, Flat Roof, Commercial' },
    { header: 'Brands', values: 'GAF, Owens Corning, CertainTeed, Atlas, Tamko' },
  ],
  travel: [
    { header: 'Destinations', values: 'Beach Resorts, City Breaks, Adventure Tours, Cruises, Family Trips' },
    { header: 'Amenities', values: 'Free Cancellation, 24/7 Support, Best Price, Custom Itinerary' },
    { header: 'Types', values: 'All-Inclusive, Luxury, Budget, Adventure, Eco-Tourism' },
  ],
  food: [
    { header: 'Service catalog', values: 'Dine In, Takeout, Delivery, Catering, Private Events' },
    { header: 'Amenities', values: 'Online Ordering, Daily Specials, Fresh Ingredients, Family Friendly' },
    { header: 'Types', values: 'Breakfast, Lunch, Dinner, Brunch, Late Night' },
  ],
};

const INDUSTRY_PRICE_ITEMS: Record<string, { qualifier: string; priceType: string; items: GeneratedPriceItem[] }> = {
  plumbing: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Service Call', description: 'Diagnosis & assessment', price: '$89', unit: '', path: '/service-call' },
      { header: 'Drain Cleaning', description: 'Professional hydro-jet', price: '$149', unit: '', path: '/drain-cleaning' },
      { header: 'Water Heater Install', description: 'Supply & installation', price: '$599', unit: '', path: '/water-heater' },
    ],
  },
  electrical: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Electrical Inspection', description: 'Full home inspection', price: '$99', unit: '', path: '/inspection' },
      { header: 'Outlet Installation', description: 'Per outlet installed', price: '$75', unit: '', path: '/outlets' },
      { header: 'Panel Upgrade', description: '200 amp upgrade', price: '$1,200', unit: '', path: '/panel-upgrades' },
    ],
  },
  hvac: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'AC Tune-Up', description: 'Annual maintenance visit', price: '$79', unit: '', path: '/maintenance' },
      { header: 'AC Repair', description: 'Diagnosis & common fix', price: '$149', unit: '', path: '/ac-repair' },
      { header: 'AC Installation', description: 'New system installed', price: '$2,500', unit: '', path: '/ac-installation' },
    ],
  },
  legal: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Free Consultation', description: 'No obligation review', price: '$0', unit: '', path: '/consultation' },
      { header: 'Hourly Rate', description: 'Standard attorney rate', price: '$250', unit: 'per hour', path: '/fees' },
      { header: 'Contingency Fee', description: 'No win, no fee cases', price: '33%', unit: '', path: '/fees' },
    ],
  },
  dental: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Exam & X-Rays', description: 'New patient special', price: '$99', unit: '', path: '/new-patients' },
      { header: 'Teeth Cleaning', description: 'Professional cleaning', price: '$120', unit: '', path: '/cleanings' },
      { header: 'Teeth Whitening', description: 'In-office whitening', price: '$299', unit: '', path: '/whitening' },
    ],
  },
  medical: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Telehealth Visit', description: 'Virtual appointment', price: '$59', unit: '', path: '/telehealth' },
      { header: 'Urgent Care Visit', description: 'Walk-in visit', price: '$99', unit: '', path: '/urgent-care' },
      { header: 'Annual Physical', description: 'Full health exam', price: '$149', unit: '', path: '/physical' },
    ],
  },
  roofing: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Roof Inspection', description: 'Full roof assessment', price: '$0', unit: '', path: '/inspection' },
      { header: 'Roof Repair', description: 'Minor repair & patch', price: '$299', unit: '', path: '/repair' },
      { header: 'Full Replacement', description: 'Per square installed', price: '$350', unit: 'per sq', path: '/replacement' },
    ],
  },
  travel: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Weekend Getaway', description: '2 nights, 2 people', price: '$299', unit: 'per person', path: '/deals' },
      { header: 'Week Vacation', description: 'All-inclusive pkg', price: '$799', unit: 'per person', path: '/destinations' },
      { header: 'Cruise Package', description: '7-night cruise deal', price: '$999', unit: 'per person', path: '/cruises' },
    ],
  },
  food: {
    qualifier: 'From',
    priceType: 'services',
    items: [
      { header: 'Lunch Special', description: 'Daily lunch combo', price: '$12', unit: '', path: '/menu' },
      { header: 'Dinner For Two', description: 'Full dinner experience', price: '$45', unit: '', path: '/menu' },
      { header: 'Catering Package', description: 'Events 20+ guests', price: '$15', unit: 'per person', path: '/catering' },
    ],
  },
};

const INDUSTRY_PROMOTIONS: Record<string, GeneratedPromotion> = {
  plumbing: { percentOff: '10', itemDescription: 'Any plumbing service', discountModifier: 'Up to' },
  electrical: { percentOff: '15', itemDescription: 'New electrical panel', discountModifier: 'Up to' },
  hvac: { percentOff: '10', itemDescription: 'AC installation', discountModifier: 'Up to' },
  legal: { moneyAmountOff: '$0', itemDescription: 'Free consultation' },
  dental: { moneyAmountOff: '$50', itemDescription: 'New patient exam' },
  medical: { moneyAmountOff: '$40', itemDescription: 'First telehealth visit' },
  roofing: { percentOff: '5', itemDescription: 'Full roof replacement', discountModifier: 'Up to' },
  travel: { percentOff: '15', itemDescription: 'Any vacation package', discountModifier: 'Up to' },
  food: { percentOff: '10', itemDescription: 'First online order', discountModifier: 'Up to' },
};

function buildBaseUrl(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
}

function generateKeywordBasedSitelinks(keywords: string[], url: string, businessName: string): GeneratedSitelink[] {
  const baseUrl = buildBaseUrl(url);
  const safeName = truncateText(businessName, 12);

  const raw = [
    { text: 'Our Services', description1: `Explore ${safeName} Services`, description2: 'Full Range Of Solutions', path: '/services' },
    { text: 'Get A Free Quote', description1: 'No Obligation Estimate', description2: 'Fast Response Time', path: '/quote' },
    { text: 'Contact Us Today', description1: `Reach ${safeName} Now`, description2: 'We Are Here To Help', path: '/contact' },
    { text: 'About Us', description1: `Why Choose ${safeName}`, description2: 'Trusted & Experienced', path: '/about' },
    { text: 'Customer Reviews', description1: 'See What Clients Say', description2: '5-Star Rated Service', path: '/reviews' },
    { text: 'FAQ', description1: 'Common Questions Answered', description2: 'Get Quick Answers', path: '/faq' },
    { text: 'Pricing', description1: 'Transparent Pricing Plans', description2: 'No Hidden Fees', path: '/pricing' },
    { text: 'Book Online', description1: 'Schedule In Minutes', description2: 'Easy Online Booking', path: '/book' },
  ];

  return raw.map(sl => ({
    text: truncateText(sl.text, 25),
    description1: truncateText(sl.description1, 35),
    description2: truncateText(sl.description2, 35),
    finalUrl: baseUrl ? `${baseUrl}${sl.path}` : url,
    status: 'Enabled',
  }));
}

function generateKeywordBasedCallouts(keywords: string[]): GeneratedCallout[] {
  const callouts: string[] = [
    'Free Consultation',
    'Expert Team',
    'Trusted Provider',
    'Fast Turnaround',
    'Quality Guaranteed',
    'Competitive Pricing',
    'No Contracts',
    'Money-Back Guarantee',
    'Locally Owned',
    'Same-Day Service',
  ];
  return callouts.map(text => ({ text: truncateText(text, 25), status: 'Enabled' }));
}

function generateKeywordBasedSnippets(keywords: string[]): GeneratedSnippet[] {
  const topKeywords = keywords
    .map(k => k.replace(/^\[|\]$|^"|"$/g, '').trim())
    .filter(k => k.length > 0 && k.split(' ').length >= 2)
    .slice(0, 5);

  const values = topKeywords.length > 0 ? topKeywords.join(', ') : 'Services, Solutions, Support, Consulting, Expertise';

  return [
    { header: 'Service catalog', values, status: 'Enabled' },
    { header: 'Types', values: 'Consultation, Assessment, Implementation, Support, Maintenance', status: 'Enabled' },
  ];
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.substring(0, max).trim();
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > max - 10) return truncated.substring(0, lastSpace);
  return truncated;
}

export function generateCampaignAssets(input: AssetGeneratorInput): GeneratedAssets {
  const { businessName, industry, keywords, url, phoneNumber } = input;
  const lowerIndustry = industry.toLowerCase();
  const baseUrl = buildBaseUrl(url);

  let sitelinks: GeneratedSitelink[];
  const industrySitelinks = INDUSTRY_SITELINKS[lowerIndustry];
  if (industrySitelinks) {
    sitelinks = industrySitelinks.map(sl => ({
      text: truncateText(sl.text, 25),
      description1: truncateText(sl.desc1, 35),
      description2: truncateText(sl.desc2, 35),
      finalUrl: baseUrl ? `${baseUrl}${sl.path}` : url,
      status: 'Enabled',
    }));
  } else {
    sitelinks = generateKeywordBasedSitelinks(keywords, url, truncateText(businessName, 15));
  }

  let callouts: GeneratedCallout[];
  const industryCallouts = INDUSTRY_CALLOUTS[lowerIndustry];
  if (industryCallouts) {
    callouts = industryCallouts.map(text => ({
      text: truncateText(text, 25),
      status: 'Enabled',
    }));
  } else {
    callouts = generateKeywordBasedCallouts(keywords);
  }

  let snippets: GeneratedSnippet[];
  const industrySnippets = INDUSTRY_SNIPPETS[lowerIndustry];
  if (industrySnippets) {
    snippets = industrySnippets.map(sn => ({
      header: sn.header,
      values: sn.values,
      status: 'Enabled',
    }));
  } else {
    snippets = generateKeywordBasedSnippets(keywords);
  }

  const callExtensions: GeneratedCallExtension[] = [];
  if (phoneNumber && phoneNumber !== '(555) 123-4567') {
    callExtensions.push({
      phoneNumber,
      countryCode: input.countryCode || 'US',
      status: 'Enabled',
    });
  }

  let priceExtension: GeneratedPriceExtension | undefined;
  const industryPrice = INDUSTRY_PRICE_ITEMS[lowerIndustry];
  if (industryPrice) {
    priceExtension = {
      qualifier: industryPrice.qualifier,
      priceType: industryPrice.priceType,
      items: industryPrice.items.map(item => ({
        ...item,
        finalUrl: baseUrl ? `${baseUrl}${item.path}` : url,
      })),
    };
  } else {
    priceExtension = {
      qualifier: 'From',
      priceType: 'services',
      items: [
        { header: 'Basic Service', description: 'Standard service tier', price: '$99', unit: '', path: '/services', finalUrl: url },
        { header: 'Standard Package', description: 'Full service package', price: '$249', unit: '', path: '/services', finalUrl: url },
        { header: 'Premium Solution', description: 'Complete solution', price: '$499', unit: '', path: '/services', finalUrl: url },
      ],
    };
  }

  const industryPromo = INDUSTRY_PROMOTIONS[lowerIndustry];
  const promotion: GeneratedPromotion = industryPromo || {
    percentOff: '10',
    itemDescription: 'First-time customers',
    discountModifier: 'Up to',
  };

  return { sitelinks, callouts, snippets, callExtensions, priceExtension, promotion };
}

export function assetsToAdExtensions(assets: GeneratedAssets): any[] {
  const extensions: any[] = [];

  if (assets.sitelinks.length > 0) {
    extensions.push({
      type: 'sitelink',
      sitelinks: assets.sitelinks.map(sl => ({
        text: sl.text,
        linkText: sl.text,
        description1: sl.description1,
        description2: sl.description2,
        finalUrl: sl.finalUrl,
        url: sl.finalUrl,
      })),
    });
  }

  if (assets.callouts.length > 0) {
    extensions.push({
      type: 'callout',
      callouts: assets.callouts.map(co => co.text),
    });
  }

  if (assets.snippets.length > 0) {
    assets.snippets.forEach(sn => {
      extensions.push({
        type: 'snippet',
        header: sn.header,
        values: sn.values,
      });
    });
  }

  if (assets.callExtensions.length > 0) {
    extensions.push({
      type: 'call',
      phone: assets.callExtensions[0].phoneNumber,
      phoneNumber: assets.callExtensions[0].phoneNumber,
      countryCode: assets.callExtensions[0].countryCode,
    });
  }

  if (assets.priceExtension) {
    extensions.push({
      type: 'price',
      qualifier: assets.priceExtension.qualifier,
      priceType: assets.priceExtension.priceType,
      items: assets.priceExtension.items,
    });
  }

  if (assets.promotion) {
    extensions.push({
      type: 'promotion',
      ...assets.promotion,
    });
  }

  return extensions;
}
