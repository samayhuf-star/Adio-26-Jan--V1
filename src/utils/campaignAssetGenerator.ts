interface AssetGeneratorInput {
  businessName: string;
  industry: string;
  keywords: string[];
  url: string;
  uniqueValueProposition?: string;
  location?: string;
  phoneNumber?: string;
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

export interface GeneratedAssets {
  sitelinks: GeneratedSitelink[];
  callouts: GeneratedCallout[];
  snippets: GeneratedSnippet[];
  callExtensions: GeneratedCallExtension[];
}

const INDUSTRY_SITELINKS: Record<string, { text: string; desc1: string; desc2: string; path: string }[]> = {
  plumbing: [
    { text: 'Emergency Plumbing', desc1: '24/7 Emergency Service', desc2: 'Fast Response Guaranteed', path: '/emergency' },
    { text: 'Our Services', desc1: 'Full Range of Plumbing', desc2: 'Residential & Commercial', path: '/services' },
    { text: 'Free Estimates', desc1: 'No Obligation Quotes', desc2: 'Transparent Pricing', path: '/free-estimate' },
    { text: 'About Us', desc1: 'Licensed & Insured Pros', desc2: 'Trusted Local Experts', path: '/about' },
  ],
  electrical: [
    { text: 'Electrical Services', desc1: 'Full Electrical Solutions', desc2: 'Licensed Electricians', path: '/services' },
    { text: 'Emergency Repairs', desc1: '24/7 Electrical Emergency', desc2: 'Same-Day Service', path: '/emergency' },
    { text: 'Free Quote', desc1: 'Upfront Honest Pricing', desc2: 'No Hidden Fees', path: '/quote' },
    { text: 'Why Choose Us', desc1: 'Certified & Insured', desc2: 'Satisfaction Guaranteed', path: '/about' },
  ],
  hvac: [
    { text: 'AC Repair', desc1: 'Expert AC Repair Service', desc2: 'All Brands Serviced', path: '/ac-repair' },
    { text: 'Heating Services', desc1: 'Furnace & Heating Repair', desc2: 'Stay Warm This Winter', path: '/heating' },
    { text: 'Free Estimate', desc1: 'No Obligation Quote', desc2: 'Competitive Pricing', path: '/estimate' },
    { text: 'Maintenance Plans', desc1: 'Preventive HVAC Care', desc2: 'Save On Energy Bills', path: '/maintenance' },
  ],
  legal: [
    { text: 'Practice Areas', desc1: 'Comprehensive Legal Help', desc2: 'Experienced Attorneys', path: '/practice-areas' },
    { text: 'Free Consultation', desc1: 'Speak With A Lawyer', desc2: 'No Obligation Review', path: '/consultation' },
    { text: 'Case Results', desc1: 'Proven Track Record', desc2: 'Millions Recovered', path: '/results' },
    { text: 'Contact Us', desc1: 'Available 24/7', desc2: 'Confidential Inquiry', path: '/contact' },
  ],
  dental: [
    { text: 'Dental Services', desc1: 'Complete Dental Care', desc2: 'Family & Cosmetic', path: '/services' },
    { text: 'Book Appointment', desc1: 'Easy Online Scheduling', desc2: 'Same-Day Available', path: '/appointment' },
    { text: 'New Patient Offer', desc1: 'Special For New Patients', desc2: 'Exam & X-Rays Included', path: '/new-patients' },
    { text: 'Insurance Accepted', desc1: 'Most Plans Accepted', desc2: 'Financing Available', path: '/insurance' },
  ],
  medical: [
    { text: 'Our Services', desc1: 'Comprehensive Healthcare', desc2: 'Expert Medical Team', path: '/services' },
    { text: 'Book Online', desc1: 'Schedule Your Visit', desc2: 'Telehealth Available', path: '/book' },
    { text: 'Patient Resources', desc1: 'Forms & Information', desc2: 'Insurance Accepted', path: '/patients' },
    { text: 'About Our Practice', desc1: 'Board-Certified Doctors', desc2: 'Compassionate Care', path: '/about' },
  ],
  roofing: [
    { text: 'Roofing Services', desc1: 'Repair & Replacement', desc2: 'All Roof Types', path: '/services' },
    { text: 'Free Inspection', desc1: 'No Cost Roof Inspection', desc2: 'Detailed Assessment', path: '/inspection' },
    { text: 'Storm Damage', desc1: 'Insurance Claim Help', desc2: 'Emergency Repairs', path: '/storm-damage' },
    { text: 'Get A Quote', desc1: 'Fast Free Estimates', desc2: 'Competitive Pricing', path: '/quote' },
  ],
  travel: [
    { text: 'Destinations', desc1: 'Popular Travel Spots', desc2: 'Exclusive Deals', path: '/destinations' },
    { text: 'Special Offers', desc1: 'Limited Time Deals', desc2: 'Save On Travel', path: '/deals' },
    { text: 'Book Now', desc1: 'Easy Online Booking', desc2: 'Best Price Guarantee', path: '/book' },
    { text: 'Travel Guide', desc1: 'Expert Travel Tips', desc2: 'Plan Your Trip', path: '/guide' },
  ],
  food: [
    { text: 'Our Menu', desc1: 'View Full Menu Online', desc2: 'Fresh Ingredients Daily', path: '/menu' },
    { text: 'Order Online', desc1: 'Delivery & Takeout', desc2: 'Fast Convenient Service', path: '/order' },
    { text: 'Catering', desc1: 'Events & Parties', desc2: 'Custom Menu Options', path: '/catering' },
    { text: 'Locations', desc1: 'Find Us Near You', desc2: 'Multiple Locations', path: '/locations' },
  ],
};

const INDUSTRY_CALLOUTS: Record<string, string[]> = {
  plumbing: ['Licensed & Insured', '24/7 Emergency Service', 'Free Estimates', 'Satisfaction Guaranteed', 'No Hidden Fees', 'Same-Day Service'],
  electrical: ['Licensed Electricians', '24/7 Availability', 'Free Quotes', 'Safety Certified', 'Upfront Pricing', 'Fast Response'],
  hvac: ['Licensed HVAC Pros', 'Energy Efficient', 'All Brands Serviced', 'Financing Available', 'Maintenance Plans', 'Fast Repairs'],
  legal: ['Free Consultation', 'No Win No Fee', 'Experienced Attorneys', 'Confidential', '24/7 Available', 'Proven Results'],
  dental: ['Gentle Dental Care', 'Insurance Accepted', 'Emergency Dentistry', 'Family Friendly', 'Modern Technology', 'Financing Options'],
  medical: ['Board Certified', 'Insurance Accepted', 'Telehealth Available', 'Same-Day Visits', 'Compassionate Care', 'Extended Hours'],
  roofing: ['Licensed & Bonded', 'Free Inspections', 'Warranty Included', 'Storm Damage Experts', 'Quality Materials', 'Financing Available'],
  travel: ['Best Price Guarantee', 'Free Cancellation', '24/7 Support', 'Expert Travel Agents', 'Custom Itineraries', 'Group Discounts'],
  food: ['Fresh Ingredients', 'Online Ordering', 'Catering Available', 'Family Friendly', 'Daily Specials', 'Fast Delivery'],
};

const INDUSTRY_SNIPPETS: Record<string, { header: string; values: string }[]> = {
  plumbing: [
    { header: 'Service catalog', values: 'Drain Cleaning, Pipe Repair, Water Heater, Leak Detection, Sewer Line' },
    { header: 'Amenities', values: 'Free Estimates, Same-Day Service, 24/7 Emergency, Licensed Pros' },
  ],
  electrical: [
    { header: 'Service catalog', values: 'Wiring, Panel Upgrades, Lighting, Outlet Repair, Generators' },
    { header: 'Amenities', values: 'Free Estimates, Licensed, Insured, 24/7 Service' },
  ],
  hvac: [
    { header: 'Service catalog', values: 'AC Repair, Heating, Installation, Maintenance, Duct Cleaning' },
    { header: 'Amenities', values: 'Free Estimates, Financing, All Brands, Energy Efficient' },
  ],
  legal: [
    { header: 'Service catalog', values: 'Personal Injury, Family Law, Criminal Defense, Estate Planning, Business Law' },
    { header: 'Amenities', values: 'Free Consultation, Virtual Meetings, Flexible Hours, Payment Plans' },
  ],
  dental: [
    { header: 'Service catalog', values: 'Cleanings, Fillings, Crowns, Implants, Whitening, Orthodontics' },
    { header: 'Amenities', values: 'Insurance Accepted, Financing, Sedation Options, Digital X-Rays' },
  ],
  medical: [
    { header: 'Service catalog', values: 'Primary Care, Urgent Care, Preventive, Chronic Care, Lab Services' },
    { header: 'Amenities', values: 'Telehealth, Online Portal, Extended Hours, Walk-Ins Welcome' },
  ],
  roofing: [
    { header: 'Service catalog', values: 'Roof Repair, Replacement, Inspection, Storm Damage, Gutters' },
    { header: 'Types', values: 'Shingle, Metal, Tile, Flat Roof, Commercial' },
  ],
  travel: [
    { header: 'Destinations', values: 'Beach Resorts, City Breaks, Adventure Tours, Cruises, Family Trips' },
    { header: 'Amenities', values: 'Free Cancellation, 24/7 Support, Best Price, Custom Itinerary' },
  ],
  food: [
    { header: 'Service catalog', values: 'Dine In, Takeout, Delivery, Catering, Private Events' },
    { header: 'Amenities', values: 'Online Ordering, Daily Specials, Fresh Ingredients, Family Friendly' },
  ],
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
    {
      text: 'Our Services',
      description1: `Explore ${safeName} Services`,
      description2: 'Full Range Of Solutions',
      path: '/services',
    },
    {
      text: 'Get A Free Quote',
      description1: 'No Obligation Estimate',
      description2: 'Fast Response Time',
      path: '/quote',
    },
    {
      text: 'Contact Us Today',
      description1: `Reach ${safeName} Now`,
      description2: 'We Are Here To Help',
      path: '/contact',
    },
    {
      text: 'About Us',
      description1: `Why Choose ${safeName}`,
      description2: 'Trusted & Experienced',
      path: '/about',
    },
  ];

  return raw.slice(0, 4).map(sl => ({
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
  ];
  return callouts.slice(0, 4).map(text => ({ text: truncateText(text, 25), status: 'Enabled' }));
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
    callouts = industryCallouts.slice(0, 4).map(text => ({
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
      countryCode: 'US',
      status: 'Enabled',
    });
  }

  return { sitelinks, callouts, snippets, callExtensions };
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

  return extensions;
}
