export interface SitelinkAsset {
  text: string;
  description1: string;
  description2: string;
  finalUrl: string;
}

export interface CalloutAsset {
  text: string;
}

export interface StructuredSnippetAsset {
  header: string;
  values: string[];
}

export interface CampaignPreset {
  slug: string;
  title: string;
  campaign_name: string;
  structure: 'SKAG' | 'STAG' | 'IBAG' | 'GEO' | 'MIX'; // Campaign structure type
  ad_groups: Array<{ name: string }>;
  keywords: string[];
  negative_keywords: string[];
  match_distribution: {
    exact: number;
    phrase: number;
    broad_mod: number;
  };
  max_cpc: number;
  daily_budget: number;
  ads: Array<{
    headline1: string;
    headline2: string;
    headline3: string;
    headline4?: string;
    headline5?: string;
    description1: string;
    description2: string;
    description3?: string;
    description4?: string;
  }>;
  final_url: string;
  landing_page_url?: string;
  cta: string;
  phone?: string;
  sitelinks?: SitelinkAsset[];
  callouts?: CalloutAsset[];
  structured_snippets?: StructuredSnippetAsset[];
}

// Campaign structure descriptions
export const structureDescriptions = {
  SKAG: {
    name: 'SKAG (Single Keyword Ad Group)',
    description: 'Maximum relevance - One keyword per ad group for highest Quality Score',
    icon: '⚡',
  },
  STAG: {
    name: 'STAG (Single Theme Ad Group)',
    description: 'Balanced approach - Related keywords grouped by common theme',
    icon: '📊',
  },
  IBAG: {
    name: 'IBAG (Intent-Based Ad Group)',
    description: 'Intent-focused - Keywords grouped by user search intent',
    icon: '🎯',
  },
  GEO: {
    name: 'GEO-Segmented',
    description: 'Location-based - Campaigns organized by geographic targeting',
    icon: '📍',
  },
  MIX: {
    name: 'Hybrid Structure',
    description: 'Best of both worlds - Combines multiple strategies for optimal performance',
    icon: '🔄',
  },
};

export const campaignPresets: CampaignPreset[] = [
  {
    slug: "electrician",
    title: "Electrician",
    campaign_name: "Electrician - PPC Calls",
    structure: "SKAG",
    landing_page_url: "/landing-pages/landing_page_1.html",
    ad_groups: [
      { name: "High Intent - Near Me" },
      { name: "Emergency & Urgent" },
      { name: "Cost & Pricing" },
      { name: "Service Types" },
      { name: "Problem Solutions" },
      { name: "Trust & Quality" },
      { name: "Residential Services" },
      { name: "Commercial Services" },
      { name: "Installation Services" },
      { name: "Repair Services" }
    ],
    keywords: [
      // High Intent - Near Me (40+ keywords)
      "electrician near me",
      "electrician close to me",
      "electrician in my area",
      "local electrician",
      "nearby electrician",
      "electrical contractor near me",
      "electrical service near me",
      "electrical repair near me",
      "wiring service near me",
      "electrical installation near me",
      "lighting installation near me",
      "outlet repair near me",
      "circuit breaker repair near me",
      "panel upgrade near me",
      "EV charger installation near me",
      "ceiling fan installation near me",
      "smoke detector installation near me",
      "electrical wiring near me",
      "power restoration near me",
      "fuse box repair near me",
      "generator installation near me",
      "electrical inspection near me",
      "rewiring service near me",
      "electrical maintenance near me",
      "hire electrician",
      "find electrician",
      "get electrician",
      "need electrician",
      "electrician company",
      "electrician contractor",
      "electrician service",
      "electrician services",
      // Emergency & Urgent (25+ keywords)
      "emergency electrician",
      "emergency electrician near me",
      "24 hour electrician",
      "24 hour electrician near me",
      "same day electrician",
      "urgent electrician",
      "after hours electrician",
      "weekend electrician",
      "immediate electrician",
      "fast electrician",
      "quick electrician",
      "rush electrician",
      "emergency electrical repair",
      "emergency electrical service",
      "24/7 electrician",
      "night electrician",
      "emergency power outage",
      "urgent electrical repair",
      "same day electrical repair",
      "fast electrical service",
      // Cost & Pricing (20+ keywords)
      "electrician cost",
      "electrician price",
      "electrician pricing",
      "electrician rates",
      "electrician quote",
      "electrician estimate",
      "free electrician estimate",
      "free electrician quote",
      "electrician cost near me",
      "how much does electrician cost",
      "electrician price per hour",
      "electrical repair cost",
      "electrical installation cost",
      "affordable electrician",
      "cheap electrician",
      "low cost electrician",
      "budget electrician",
      "electrical service cost",
      "wiring cost",
      "panel upgrade cost",
      // Trust & Quality (20+ keywords)
      "licensed electrician",
      "licensed electrician near me",
      "certified electrician",
      "certified electrician near me",
      "insured electrician",
      "professional electrician",
      "professional electrician near me",
      "trusted electrician",
      "top rated electrician",
      "top rated electrician near me",
      "best rated electrician",
      "5 star electrician",
      "reliable electrician",
      "experienced electrician",
      "quality electrician",
      "master electrician",
      "bonded electrician",
      "accredited electrician",
      // Problem Solutions (25+ keywords)
      "no power electrician",
      "power outage help",
      "flickering lights fix",
      "tripped breaker repair",
      "electrical fire prevention",
      "sparking outlet repair",
      "buzzing sound electrical",
      "burning smell electrical",
      "dead outlet repair",
      "overloaded circuit fix",
      "electrical shock prevention",
      "dimming lights fix",
      "faulty wiring repair",
      "short circuit repair",
      "electrical surge protection",
      "ground fault repair",
      "fix no power",
      "repair electrical",
      "troubleshoot electrical",
      "electrical problem help",
      "electrical emergency help",
      // Residential & Commercial (15+ keywords)
      "residential electrician",
      "residential electrical service",
      "home electrician",
      "home electrician near me",
      "house electrician",
      "house electrical repair",
      "commercial electrician",
      "commercial electrical service",
      "business electrician",
      "office electrician",
      "industrial electrician",
      "apartment electrician",
      "condo electrician",
      // Installation Services (20+ keywords)
      "electrical panel installation",
      "breaker box installation",
      "outlet installation",
      "switch installation",
      "light fixture installation",
      "recessed lighting installation",
      "chandelier installation",
      "ceiling fan install",
      "exhaust fan installation",
      "EV charger install",
      "Tesla charger installation",
      "smart home wiring",
      "USB outlet installation",
      "GFCI outlet installation",
      "dedicated circuit installation",
      "whole house surge protector",
      "backup generator install",
      "standby generator installation"
    ],
    negative_keywords: ["training", "free", "jobs", "school", "DIY", "wholesale", "supply", "cheap parts", "repair manual", "how to"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.0,
    daily_budget: 100,
    ads: [{
      headline1: "24/7 Emergency Electrician — Call Now",
      headline2: "Licensed Local Electrician — Fast Response",
      headline3: "Same Day Electrical Repair",
      description1: "Fast, licensed electricians. Same-day service & up-front pricing. Call now for quick help.",
      description2: "Breaker, wiring, lighting & EV charger installs. Free phone estimate."
    }],
    final_url: "https://adiology.online/electrician?utm_source=adiology&utm_medium=ads&utm_campaign=electrician_ppc",
    cta: "Call Now"
  },
  {
    slug: "plumber",
    title: "Plumber",
    campaign_name: "Plumber - PPC Calls",
    structure: "SKAG",
    landing_page_url: "/landing-pages/landing_page_2.html",
    ad_groups: [
      { name: "High Intent - Near Me" },
      { name: "Emergency & Urgent" },
      { name: "Cost & Pricing" },
      { name: "Drain Services" },
      { name: "Water Heater Services" },
      { name: "Leak Repair" },
      { name: "Toilet & Fixture" },
      { name: "Sewer & Pipe" },
      { name: "Trust & Quality" },
      { name: "Residential & Commercial" }
    ],
    keywords: [
      // High Intent - Near Me (35+ keywords)
      "plumber near me",
      "plumber close to me",
      "plumber in my area",
      "local plumber",
      "nearby plumber",
      "plumbing service near me",
      "plumbing contractor near me",
      "plumbing repair near me",
      "drain cleaning near me",
      "pipe repair near me",
      "leak repair near me",
      "water heater repair near me",
      "toilet repair near me",
      "faucet repair near me",
      "sewer line repair near me",
      "garbage disposal repair near me",
      "water line repair near me",
      "gas line service near me",
      "bathroom plumbing near me",
      "kitchen plumbing near me",
      "sump pump service near me",
      "water filtration near me",
      "tankless water heater near me",
      "septic service near me",
      "hire plumber",
      "find plumber",
      "get plumber",
      "need plumber",
      "plumber company",
      "plumber contractor",
      "plumbing services",
      // Emergency & Urgent (25+ keywords)
      "emergency plumber",
      "emergency plumber near me",
      "24 hour plumber",
      "24 hour plumber near me",
      "same day plumber",
      "urgent plumber",
      "after hours plumber",
      "weekend plumber",
      "immediate plumber",
      "fast plumber",
      "quick plumber",
      "rush plumber",
      "emergency plumbing repair",
      "emergency plumbing service",
      "24/7 plumber",
      "night plumber",
      "emergency water leak",
      "urgent pipe repair",
      "same day plumbing repair",
      "burst pipe emergency",
      "flooding emergency plumber",
      "water heater emergency",
      // Cost & Pricing (20+ keywords)
      "plumber cost",
      "plumber price",
      "plumber pricing",
      "plumber rates",
      "plumber quote",
      "plumber estimate",
      "free plumber estimate",
      "free plumbing quote",
      "plumber cost near me",
      "how much does plumber cost",
      "plumber price per hour",
      "plumbing repair cost",
      "drain cleaning cost",
      "affordable plumber",
      "cheap plumber",
      "low cost plumber",
      "budget plumber",
      "plumbing service cost",
      "water heater installation cost",
      "pipe repair cost",
      // Drain Services (20+ keywords)
      "drain cleaning",
      "drain cleaning near me",
      "clogged drain repair",
      "blocked drain service",
      "drain unclogging",
      "slow drain fix",
      "kitchen drain cleaning",
      "bathroom drain cleaning",
      "floor drain cleaning",
      "main drain cleaning",
      "hydro jetting service",
      "drain camera inspection",
      "root removal drain",
      "grease trap cleaning",
      "drain snake service",
      "sewer drain cleaning",
      "shower drain clog",
      "bathtub drain clog",
      // Water Heater Services (20+ keywords)
      "water heater repair",
      "water heater installation",
      "water heater replacement",
      "tankless water heater install",
      "hot water heater repair",
      "electric water heater repair",
      "gas water heater repair",
      "water heater not working",
      "no hot water repair",
      "water heater leak repair",
      "water heater maintenance",
      "water heater flush",
      "water heater thermostat",
      "water heater pilot light",
      // Leak Repair (15+ keywords)
      "leak repair",
      "water leak repair",
      "pipe leak repair",
      "faucet leak repair",
      "toilet leak repair",
      "slab leak repair",
      "hidden leak detection",
      "water leak detection",
      "leak detection service",
      "fix water leak",
      "stop leak plumber",
      "basement leak repair",
      // Trust & Quality (15+ keywords)
      "licensed plumber",
      "licensed plumber near me",
      "certified plumber",
      "insured plumber",
      "professional plumber",
      "professional plumber near me",
      "trusted plumber",
      "top rated plumber",
      "best rated plumber",
      "5 star plumber",
      "reliable plumber",
      "experienced plumber",
      "master plumber",
      // Residential & Commercial (15+ keywords)
      "residential plumber",
      "residential plumbing service",
      "home plumber",
      "home plumber near me",
      "house plumber",
      "commercial plumber",
      "commercial plumbing service",
      "business plumber",
      "office plumber",
      "industrial plumber",
      "apartment plumber",
      "restaurant plumber"
    ],
    negative_keywords: ["free", "DIY", "training", "jobs", "cheap", "coupon", "parts", "wholesale", "manual", "how to"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.5,
    daily_budget: 120,
    ads: [{
      headline1: "Emergency Plumber Near You — Call 24/7",
      headline2: "Fast Leak Repair | Same Day Service",
      headline3: "Licensed Local Plumbers",
      description1: "Burst pipes, blocked drains & water heaters. Call now for immediate dispatch.",
      description2: "No hidden fees. Up-front price & warranty."
    }],
    final_url: "https://adiology.online/plumber?utm_source=adiology&utm_medium=ads&utm_campaign=plumber_ppc",
    cta: "Call Now"
  },
  {
    slug: "carpenter",
    title: "Carpenter",
    campaign_name: "Carpenter - PPC Calls",
    structure: "SKAG",
    landing_page_url: "/landing-pages/landing_page_3.html",
    ad_groups: [
      { name: "carpenter near me" },
      { name: "emergency carpenter near me" },
      { name: "cabinet maker near me" },
      { name: "deck repair near me" },
      { name: "door repair near me" },
      { name: "wood flooring repair near me" },
      { name: "trim carpenter near me" },
      { name: "carpentry services near me" },
      { name: "local carpenter quote" },
      { name: "carpenter small jobs near me" },
      { name: "furniture repair near me" },
      { name: "stair repair near me" },
      { name: "framing carpenter near me" },
      { name: "sash window repair near me" },
      { name: "shed repair near me" },
      { name: "custom cabinets near me" },
      { name: "closet installation near me" },
      { name: "kitchen cabinet repair near me" },
      { name: "wood floor install near me" },
      { name: "porch repair near me" }
    ],
    keywords: [
      "carpenter near me",
      "emergency carpenter near me",
      "cabinet maker near me",
      "deck repair near me",
      "door repair near me",
      "wood flooring repair near me",
      "trim carpenter near me",
      "carpentry services near me",
      "local carpenter quote",
      "carpenter small jobs near me",
      "furniture repair near me",
      "stair repair near me",
      "framing carpenter near me",
      "sash window repair near me",
      "shed repair near me",
      "custom cabinets near me",
      "closet installation near me",
      "kitchen cabinet repair near me",
      "wood floor install near me",
      "porch repair near me"
    ],
    negative_keywords: ["DIY", "training", "jobs", "free plans", "how to", "material supply", "lumber", "products", "buy", "tool"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.0,
    daily_budget: 70,
    ads: [{
      headline1: "Local Carpenter — Call for Fast Quote",
      headline2: "Custom Cabinets & Trim — Free Estimate",
      headline3: "Same Day Small Repairs",
      description1: "Experienced carpenters for repair & install. Quality workmanship & prompt service.",
      description2: "Get a fast quote & schedule today."
    }],
    final_url: "https://adiology.online/carpenter?utm_source=adiology&utm_medium=ads&utm_campaign=carpenter_ppc",
    cta: "Call Now"
  },
  {
    slug: "roofing",
    title: "Roofing",
    campaign_name: "Roofing - PPC Calls",
    structure: "SKAG",
    landing_page_url: "/landing-pages/landing_page_4.html",
    ad_groups: [
      { name: "roofing contractor near me" },
      { name: "roof repair near me" },
      { name: "roof replacement near me" },
      { name: "emergency roof repair near me" },
      { name: "leak in roof repair" },
      { name: "roof inspection near me" },
      { name: "hail damage roof repair" },
      { name: "shingle replacement near me" },
      { name: "metal roof repair near me" },
      { name: "flat roof repair near me" },
      { name: "roofing company near me" },
      { name: "roof quote near me" },
      { name: "same day roof repair" },
      { name: "wind damage roof repair" },
      { name: "gutter repair near me" },
      { name: "roof leak fix" },
      { name: "new roof cost near me" },
      { name: "roofing contractor call now" },
      { name: "tar roof repair near me" },
      { name: "roof patch near me" }
    ],
    keywords: [
      "roofing contractor near me",
      "roof repair near me",
      "roof replacement near me",
      "emergency roof repair near me",
      "leak in roof repair",
      "roof inspection near me",
      "hail damage roof repair",
      "shingle replacement near me",
      "metal roof repair near me",
      "flat roof repair near me",
      "roofing company near me",
      "roof quote near me",
      "same day roof repair",
      "wind damage roof repair",
      "gutter repair near me",
      "roof leak fix",
      "new roof cost near me",
      "roofing contractor call now",
      "tar roof repair near me",
      "roof patch near me"
    ],
    negative_keywords: ["DIY", "how to", "roofing supplies", "shingle sale", "training", "jobs", "roof paint", "roof tiles sale", "cheap", "materials"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 6.0,
    daily_budget: 200,
    ads: [{
      headline1: "Emergency Roof Repair — Call Now",
      headline2: "Free Roof Inspection — Local Contractor",
      headline3: "Storm Damage Specialists",
      description1: "Fast response, lifetime workmanship warranty. Call to book inspection.",
      description2: "Insurance claims help & fast repairs."
    }],
    final_url: "https://adiology.online/roofing?utm_source=adiology&utm_medium=ads&utm_campaign=roofing_ppc",
    cta: "Call Now"
  },
  {
    slug: "flooring",
    title: "Flooring",
    campaign_name: "Flooring - PPC Calls",
    structure: "SKAG",
    landing_page_url: "/landing-pages/landing_page_5.html",
    ad_groups: [
      { name: "flooring installation near me" },
      { name: "hardwood floor repair near me" },
      { name: "tile installation near me" },
      { name: "vinyl plank install near me" },
      { name: "floor sanding near me" },
      { name: "flooring contractor near me" },
      { name: "floor repair near me" },
      { name: "laminate floor install near me" },
      { name: "flooring company near me" },
      { name: "floor installers near me" },
      { name: "engineered hardwood install near me" },
      { name: "commercial flooring near me" },
      { name: "floor quote near me" },
      { name: "floor replacement near me" },
      { name: "flooring store install near me" }
    ],
    keywords: [
      "flooring installation near me",
      "hardwood floor repair near me",
      "tile installation near me",
      "vinyl plank install near me",
      "floor sanding near me",
      "flooring contractor near me",
      "floor repair near me",
      "laminate floor install near me",
      "flooring company near me",
      "floor installers near me",
      "engineered hardwood install near me",
      "commercial flooring near me",
      "floor quote near me",
      "floor replacement near me",
      "flooring store install near me"
    ],
    negative_keywords: ["DIY", "supply", "materials", "warehouse", "cheap flooring", "sale", "free sample", "jobs", "how to", "tutorial"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.5,
    daily_budget: 95,
    ads: [{
      headline1: "Top Flooring Installers — Call for Free Quote",
      headline2: "Hardwood, Tile & Vinyl — Expert Fitters",
      headline3: "Same Day Estimates",
      description1: "Professional installation and refinishing. Free in-home estimate.",
      description2: "Quality materials & certified installers."
    }],
    final_url: "https://adiology.online/flooring?utm_source=adiology&utm_medium=ads&utm_campaign=flooring_ppc",
    cta: "Get Quote"
  },
  {
    slug: "solar",
    title: "Solar Installation",
    campaign_name: "Solar - PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_6.html",
    ad_groups: [
      { name: "Residential Solar" },
      { name: "Commercial Solar" },
      { name: "Panel Repair" }
    ],
    keywords: [
      "solar installers near me",
      "solar panel installation near me",
      "residential solar quotes",
      "solar company near me",
      "solar installers call now",
      "solar panel repair near me",
      "solar financing near me",
      "solar energy installers near me",
      "best solar installer near me",
      "solar system installation near me",
      "solar panel replacement near me",
      "solar quotes near me",
      "home solar estimate",
      "solar lead near me",
      "rooftop solar installation near me",
      "solar battery installation near me"
    ],
    negative_keywords: ["DIY", "solar panels for sale", "cheap panels", "wholesale", "jobs", "how to", "review", "parts"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 8.0,
    daily_budget: 275,
    ads: [{
      headline1: "Residential Solar Installers — Call for Quote",
      headline2: "Save on Power — Free Solar Estimate",
      headline3: "Licensed Solar Installers Near You",
      description1: "Full design & install. Finance & rebates available. Call for assessment.",
      description2: "Increase savings with solar + battery. Free consultation."
    }],
    final_url: "https://adiology.online/solar?utm_source=adiology&utm_medium=ads&utm_campaign=solar_ppc",
    cta: "Book Free Estimate"
  },
  {
    slug: "pest-control",
    title: "Pest Control",
    campaign_name: "Pest Control - PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_7.html",
    ad_groups: [
      { name: "Exterminator" },
      { name: "Rodent Control" },
      { name: "Termite Treatment" }
    ],
    keywords: [
      "pest control near me",
      "exterminator near me",
      "termite treatment near me",
      "bed bug exterminator near me",
      "mouse control near me",
      "rodent removal near me",
      "pest control service near me",
      "ant exterminator near me",
      "wasp nest removal near me",
      "pest control immediate service",
      "emergency pest control",
      "termite inspection near me",
      "pest prevention service near me",
      "commercial pest control near me",
      "pest control quote near me"
    ],
    negative_keywords: ["do it yourself", "home remedy", "how to", "pesticide buy", "wholesale", "jobs", "training", "free", "coupon", "product"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Emergency Pest Control — Call Now",
      headline2: "Termite & Rodent Treatment — Free Quote",
      headline3: "Safe, Certified Exterminators",
      description1: "Fast response & guaranteed results. Call for same-day service.",
      description2: "Affordable plans & one-time treatments."
    }],
    final_url: "https://adiology.online/pest-control?utm_source=adiology&utm_medium=ads&utm_campaign=pestcontrol_ppc",
    cta: "Call Now"
  },
  {
    slug: "lawn-care",
    title: "Lawn Care",
    campaign_name: "Lawn Care - PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_8.html",
    ad_groups: [
      { name: "Lawn Mowing" },
      { name: "Lawn Maintenance" },
      { name: "Landscape Care" }
    ],
    keywords: [
      "lawn care near me",
      "lawn mowing service near me",
      "yard maintenance near me",
      "lawn mowing near me",
      "lawn service near me",
      "grass cutting near me",
      "lawn maintenance company near me",
      "lawn aeration near me",
      "weed control near me",
      "lawn treatment near me",
      "garden maintenance near me",
      "lawn mowing quote",
      "emergency lawn care near me"
    ],
    negative_keywords: ["hire mower", "buy lawn mower", "parts", "DIY", "how to", "cheap", "manual", "sales", "jobs", "used mowers"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 2.0,
    daily_budget: 60,
    ads: [{
      headline1: "Professional Lawn Mowing — Call Today",
      headline2: "Weekly Lawn Care Plans — Free Quote",
      headline3: "Reliable Local Lawn Service",
      description1: "Fast & friendly lawn care pros. Book online or call for an estimate.",
      description2: "Seasonal treatments & weed control available."
    }],
    final_url: "https://adiology.online/lawn-care?utm_source=adiology&utm_medium=ads&utm_campaign=lawncare_ppc",
    cta: "Schedule Now"
  },
  {
    slug: "movers-domestic",
    title: "Movers & Packers - Domestic",
    campaign_name: "Movers - Domestic PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_9.html",
    ad_groups: [
      { name: "Local Movers" },
      { name: "Interstate Moving" },
      { name: "Packing Services" }
    ],
    keywords: [
      "movers near me",
      "local movers near me",
      "moving companies near me",
      "house movers near me",
      "affordable movers near me",
      "moving and packing services near me",
      "same day movers near me",
      "best movers near me",
      "furniture movers near me",
      "apartment movers near me",
      "long distance movers near me",
      "packing services near me"
    ],
    negative_keywords: ["used movers", "DIY moving truck", "moving boxes", "jobs", "cheap movers", "hiring", "truck for rent"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 5.0,
    daily_budget: 150,
    ads: [{
      headline1: "Trusted Local Movers — Call for Free Quote",
      headline2: "Full Packing & Moving Services — Book Now",
      headline3: "Flat Rate Moving — No Hidden Fees",
      description1: "Licensed, insured movers. Free in-home estimate & packing options.",
      description2: "Same-day availability and secure handling."
    }],
    final_url: "https://adiology.online/movers-domestic?utm_source=adiology&utm_medium=ads&utm_campaign=movers_domestic_ppc",
    cta: "Call Now"
  },
  {
    slug: "movers-international",
    title: "Movers & Packers - International",
    campaign_name: "Movers - International PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_10.html",
    ad_groups: [
      { name: "International Shipping" },
      { name: "Customs Clearance" },
      { name: "Intl Packing" }
    ],
    keywords: [
      "international movers near me",
      "overseas movers near me",
      "international moving company",
      "ship household goods overseas",
      "international freight moving",
      "international moving quotes",
      "cross border movers near me",
      "international removals near me",
      "moving overseas services",
      "international moving company call now"
    ],
    negative_keywords: ["shipping containers for sale", "freight forwarding jobs", "how to ship", "cheap shipping"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 6.0,
    daily_budget: 200,
    ads: [{
      headline1: "International Movers — Free Quote",
      headline2: "Ship Household Goods Overseas — Call Now",
      headline3: "Customs & Door-to-Door Service",
      description1: "Worldwide moving experts. Door-to-door service & customs support.",
      description2: "Get a fast international moving quote today."
    }],
    final_url: "https://adiology.online/movers-international?utm_source=adiology&utm_medium=ads&utm_campaign=movers_intl_ppc",
    cta: "Call Now"
  },
  {
    slug: "hvac",
    title: "HVAC / AC Repair",
    campaign_name: "HVAC - PPC Calls",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_11.html",
    ad_groups: [
      { name: "Emergency AC Repair" },
      { name: "Furnace Repair" },
      { name: "Installation & Maintenance" }
    ],
    keywords: [
      "ac repair near me",
      "hvac repair near me",
      "furnace repair near me",
      "air conditioning repair near me",
      "emergency ac repair near me",
      "hvac contractor near me",
      "ac installation near me",
      "heat pump repair near me",
      "ac company near me",
      "air conditioner service near me",
      "refrigerant leak repair near me",
      "thermostat installation near me"
    ],
    negative_keywords: ["parts", "DIY", "ac for sale", "buy ac", "manual", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.5,
    daily_budget: 135,
    ads: [{
      headline1: "AC Repair 24/7 — Call Now",
      headline2: "HVAC Service & Installation — Free Estimate",
      headline3: "Fast, Certified Technicians",
      description1: "Same day service & maintenance plans. Call for quick help.",
      description2: "Affordable rates & satisfaction guaranteed."
    }],
    final_url: "https://adiology.online/hvac?utm_source=adiology&utm_medium=ads&utm_campaign=hvac_ppc",
    cta: "Call Now"
  },
  {
    slug: "locksmith",
    title: "Locksmith",
    campaign_name: "Locksmith - PPC Calls",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_12.html",
    ad_groups: [
      { name: "Emergency Lockout" },
      { name: "Lock Replacement" },
      { name: "Commercial Locksmith" }
    ],
    keywords: [
      "locksmith near me",
      "24 hour locksmith near me",
      "emergency locksmith near me",
      "car locksmith near me",
      "house lockout near me",
      "lock repair near me",
      "rekey locks near me",
      "door lock replacement near me",
      "locksmith call now",
      "locksmith services near me"
    ],
    negative_keywords: ["locksmith tools", "how to pick a lock", "buy locks", "jobs", "training", "DIY"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.5,
    daily_budget: 80,
    ads: [{
      headline1: "24/7 Emergency Locksmith — Call Now",
      headline2: "Fast Lockout Service — Local Locksmith",
      headline3: "Car & Home Lock Services",
      description1: "Quick arrival & fair pricing. Call for emergency lockout help.",
      description2: "Rekey, replace, install locks."
    }],
    final_url: "https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_ppc",
    cta: "Call Now"
  },
  {
    slug: "water-damage",
    title: "Water Damage Restoration",
    campaign_name: "Water Damage - PPC Calls",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_13.html",
    ad_groups: [
      { name: "Emergency Drying" },
      { name: "Flood Cleanup" },
      { name: "Mold Remediation" }
    ],
    keywords: [
      "water damage restoration near me",
      "flood cleanup near me",
      "mold remediation near me",
      "water removal near me",
      "emergency water damage near me",
      "basement flood cleanup near me",
      "water damage repair near me",
      "carpet drying service near me",
      "restoration company near me",
      "burst pipe water damage near me"
    ],
    negative_keywords: ["how to dry", "DIY", "rental pumps", "sell", "used"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 6.5,
    daily_budget: 275,
    ads: [{
      headline1: "Emergency Water Damage Help — Call Now",
      headline2: "Flood & Mold Remediation — 24/7",
      headline3: "Fast Response Restoration",
      description1: "Mitigation, drying & repair. Insurance claim assistance. Call now.",
      description2: "Rapid response and certified technicians."
    }],
    final_url: "https://adiology.online/water-damage?utm_source=adiology&utm_medium=ads&utm_campaign=waterdamage_ppc",
    cta: "Call Now"
  },
  {
    slug: "pool-repair",
    title: "Pool Repair",
    campaign_name: "Pool Repair - PPC Calls",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_14.html",
    ad_groups: [
      { name: "Pool Pump Repair" },
      { name: "Leak Detection" },
      { name: "Pool Cleaning" }
    ],
    keywords: [
      "pool repair near me",
      "pool pump repair near me",
      "leak detection pool near me",
      "pool service near me",
      "pool cleaning near me",
      "pool maintenance near me",
      "pool tile repair near me",
      "pool heater repair near me",
      "pool filter repair near me",
      "pool leak repair near me"
    ],
    negative_keywords: ["pool supplies", "pool for sale", "DIY", "how to", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 2.5,
    daily_budget: 75,
    ads: [{
      headline1: "Pool Repair Near You — Call for Fast Service",
      headline2: "Pump, Leak & Heater Repair — Free Quote",
      headline3: "Trusted Local Pool Pros",
      description1: "Quick diagnostics & repairs. Same day service available.",
      description2: "Seasonal maintenance & repairs. Call now."
    }],
    final_url: "https://adiology.online/pool-repair?utm_source=adiology&utm_medium=ads&utm_campaign=pool_ppc",
    cta: "Call Now"
  },
  {
    slug: "appliance-repair",
    title: "Appliance Repair",
    campaign_name: "Appliance Repair - PPC Calls",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_15.html",
    ad_groups: [
      { name: "Washer & Dryer" },
      { name: "Fridge & Oven" },
      { name: "Dishwasher Repair" }
    ],
    keywords: [
      "appliance repair near me",
      "washer repair near me",
      "fridge repair near me",
      "oven repair near me",
      "dryer repair near me",
      "dishwasher repair near me",
      "stove repair near me",
      "appliance service near me",
      "same day appliance repair near me",
      "local appliance technicians near me"
    ],
    negative_keywords: ["parts for sale", "appliance for sale", "manual", "how to fix", "DIY", "buy parts"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 2.5,
    daily_budget: 60,
    ads: [{
      headline1: "Same Day Appliance Repair — Call Now",
      headline2: "Fridge, Oven & Washer Repair — Local Technicians",
      headline3: "Fast & Affordable Service",
      description1: "Repair appointments today. Upfront pricing & warranty.",
      description2: "Book online or call for immediate service."
    }],
    final_url: "https://adiology.online/appliance-repair?utm_source=adiology&utm_medium=ads&utm_campaign=appliance_ppc",
    cta: "Call Now"
  },
  {
    slug: "window-cleaning",
    title: "Window Cleaning",
    campaign_name: "Window Cleaning - PPC Calls",
    structure: "GEO",
    landing_page_url: "/landing-pages/landing_page_16.html",
    ad_groups: [
      { name: "Residential Window Cleaning" },
      { name: "Commercial Window Cleaning" },
      { name: "Gutter & Window" }
    ],
    keywords: [
      "window cleaning near me",
      "commercial window cleaning near me",
      "residential window cleaning near me",
      "gutter cleaning and window cleaning near me",
      "high window cleaning near me",
      "window washers near me",
      "window cleaning service near me",
      "window cleaning quote near me"
    ],
    negative_keywords: ["squeegee for sale", "DIY", "how to", "jobs", "window film sale"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 1.5,
    daily_budget: 40,
    ads: [{
      headline1: "Sparkling Windows — Call for Quote",
      headline2: "Residential & Commercial Window Cleaning",
      headline3: "Reliable Local Window Pros",
      description1: "Safe, streak-free cleaning. Book online or call for estimate.",
      description2: "Experienced crews & satisfaction guarantee."
    }],
    final_url: "https://adiology.online/window-cleaning?utm_source=adiology&utm_medium=ads&utm_campaign=window_ppc",
    cta: "Schedule Now"
  },
  {
    slug: "tree-removal",
    title: "Tree Removal",
    campaign_name: "Tree Removal - PPC Calls",
    structure: "GEO",
    landing_page_url: "/landing-pages/landing_page_17.html",
    ad_groups: [
      { name: "Emergency Tree Removal" },
      { name: "Tree Trimming" },
      { name: "Stump Grinding" }
    ],
    keywords: [
      "tree removal near me",
      "tree cutting service near me",
      "stump grinding near me",
      "tree trimming near me",
      "emergency tree removal near me",
      "tree removal quote near me",
      "dangerous tree removal near me"
    ],
    negative_keywords: ["buy trees", "tree seeds", "how to prune", "jobs", "saplings", "nursery"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.0,
    daily_budget: 80,
    ads: [{
      headline1: "Emergency Tree Removal — Call Now",
      headline2: "Stump Grinding & Tree Trimming Services",
      headline3: "Licensed Arborists — Free Quote",
      description1: "Safe removal & clean-up. Insurance friendly. Call for rapid response.",
      description2: "Tree health & trimming specialists."
    }],
    final_url: "https://adiology.online/tree-removal?utm_source=adiology&utm_medium=ads&utm_campaign=tree_ppc",
    cta: "Call Now"
  },
  {
    slug: "painting",
    title: "Painting (Interior/Exterior)",
    campaign_name: "Painting - PPC Calls",
    structure: "GEO",
    landing_page_url: "/landing-pages/landing_page_18.html",
    ad_groups: [
      { name: "Interior Painting" },
      { name: "Exterior Painting" },
      { name: "Commercial Painting" }
    ],
    keywords: [
      "house painters near me",
      "interior painters near me",
      "exterior painters near me",
      "commercial painters near me",
      "paint quote near me",
      "wall painting service near me",
      "deck painting near me",
      "cabinet painting near me"
    ],
    negative_keywords: ["paint for sale", "paint supplies", "DIY", "how to paint", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 2.5,
    daily_budget: 65,
    ads: [{
      headline1: "Local Painters — Free Estimate",
      headline2: "Interior & Exterior Painting — Call Now",
      headline3: "Professional Painters, Quality Finish",
      description1: "Licensed & insured painters. Color consult & warranty.",
      description2: "Fast turnaround & clean work."
    }],
    final_url: "https://adiology.online/painting?utm_source=adiology&utm_medium=ads&utm_campaign=painting_ppc",
    cta: "Get Quote"
  },
  {
    slug: "concrete",
    title: "Concrete / Driveway Contractor",
    campaign_name: "Concrete - PPC Calls",
    structure: "GEO",
    landing_page_url: "/landing-pages/landing_page_19.html",
    ad_groups: [
      { name: "Driveway Repair" },
      { name: "Concrete Pouring" },
      { name: "Stamped Concrete" }
    ],
    keywords: [
      "concrete contractor near me",
      "driveway repair near me",
      "concrete paving near me",
      "concrete contractors near me",
      "stamped concrete near me",
      "concrete driveway replacement near me",
      "concrete repair near me",
      "concrete patio near me"
    ],
    negative_keywords: ["buy cement", "concrete for sale", "DIY", "how to mix concrete", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Expert Concrete Contractors — Call for Quote",
      headline2: "Driveway Repair & Replacement",
      headline3: "Stamped Concrete & Patios",
      description1: "Durable driveways & patios. Free consult & estimate.",
      description2: "Licensed crew & quality guarantee."
    }],
    final_url: "https://adiology.online/concrete?utm_source=adiology&utm_medium=ads&utm_campaign=concrete_ppc",
    cta: "Call Now"
  },
  {
    slug: "security-systems",
    title: "Security System Installation",
    campaign_name: "Security - PPC Calls",
    structure: "MIX",
    landing_page_url: "/landing-pages/landing_page_20.html",
    ad_groups: [
      { name: "Alarm Installation" },
      { name: "CCTV Installation" },
      { name: "Smart Home Security" }
    ],
    keywords: [
      "security system installers near me",
      "alarm installation near me",
      "cctv installation near me",
      "home security system near me",
      "commercial security installation near me",
      "security camera installers near me",
      "security system companies near me",
      "security system quote near me"
    ],
    negative_keywords: ["security camera for sale", "DIY camera", "how to install", "jobs", "repair parts"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.5,
    daily_budget: 160,
    ads: [{
      headline1: "Home Security Installation — Call for Quote",
      headline2: "CCTV & Alarm Systems — Free Consultation",
      headline3: "Smart Home Security Installers",
      description1: "24/7 monitoring options & professional install. Call for immediate quote.",
      description2: "Licensed installers & warranty included."
    }],
    final_url: "https://adiology.online/security-systems?utm_source=adiology&utm_medium=ads&utm_campaign=security_ppc",
    cta: "Call Now"
  },
  {
    slug: "garage-door",
    title: "Garage Door Repair",
    campaign_name: "Garage Door - PPC Calls",
    structure: "MIX",
    landing_page_url: "/landing-pages/landing_page_21.html",
    ad_groups: [
      { name: "Emergency Garage Repair" },
      { name: "Opener Repair" },
      { name: "Spring Replacement" }
    ],
    keywords: [
      "garage door repair near me",
      "garage door spring replacement near me",
      "garage door opener repair near me",
      "garage door replacement near me",
      "garage door cable repair near me",
      "garage door company near me",
      "garage door repair emergency"
    ],
    negative_keywords: ["garage door for sale", "DIY", "how to", "manual", "parts for sale"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.0,
    daily_budget: 80,
    ads: [{
      headline1: "Garage Door Repair — Same Day Service",
      headline2: "Spring Replacement & Opener Repair",
      headline3: "Trusted Local Technicians",
      description1: "Fast response & affordable pricing. Call for emergency repairs.",
      description2: "Parts & repair warranty included."
    }],
    final_url: "https://adiology.online/garage-door?utm_source=adiology&utm_medium=ads&utm_campaign=garage_ppc",
    cta: "Call Now"
  },
  {
    slug: "septic",
    title: "Septic Service",
    campaign_name: "Septic - PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_22.html",
    ad_groups: [
      { name: "Septic Pumping" },
      { name: "Septic Repair" },
      { name: "Septic Inspection" }
    ],
    keywords: [
      "septic service near me",
      "septic pumping near me",
      "septic tank pumping near me",
      "septic repair near me",
      "septic inspection near me",
      "septic tank service near me",
      "septic system repair near me",
      "emergency septic service near me"
    ],
    negative_keywords: ["septic tank for sale", "diy", "how to", "parts", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 3.5,
    daily_budget: 80,
    ads: [{
      headline1: "Septic Pumping & Repair — Call Now",
      headline2: "Emergency Septic Service Near You",
      headline3: "Inspections & Maintenance",
      description1: "Licensed septic technicians & fast response.",
      description2: "Routine pumping & emergency repairs."
    }],
    final_url: "https://adiology.online/septic?utm_source=adiology&utm_medium=ads&utm_campaign=septic_ppc",
    cta: "Call Now"
  },
  {
    slug: "landscaping",
    title: "Landscaping",
    campaign_name: "Landscaping - PPC Calls",
    structure: "MIX",
    landing_page_url: "/landing-pages/landing_page_23.html",
    ad_groups: [
      { name: "Landscape Design" },
      { name: "Hardscaping" },
      { name: "Maintenance" }
    ],
    keywords: [
      "landscaping near me",
      "landscapers near me",
      "landscape design near me",
      "yard landscaping near me",
      "landscape companies near me",
      "garden design near me",
      "landscaping services near me",
      "commercial landscaping near me"
    ],
    negative_keywords: ["lawn supplies", "plants for sale", "how to plant", "jobs", "DIY"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 2.5,
    daily_budget: 80,
    ads: [{
      headline1: "Professional Landscaping — Call for Free Quote",
      headline2: "Design, Planting & Maintenance",
      headline3: "Transform Your Yard Today",
      description1: "Custom landscape design & installation. Free consultation.",
      description2: "Maintenance plans & seasonal services available."
    }],
    final_url: "https://adiology.online/landscaping?utm_source=adiology&utm_medium=ads&utm_campaign=landscaping_ppc",
    cta: "Get Quote"
  },
  {
    slug: "chimney",
    title: "Chimney Sweep & Repair",
    campaign_name: "Chimney - PPC Calls",
    structure: "STAG",
    landing_page_url: "/landing-pages/landing_page_24.html",
    ad_groups: [
      { name: "Chimney Cleaning" },
      { name: "Chimney Repair" },
      { name: "Chimney Inspection" }
    ],
    keywords: [
      "chimney sweep near me",
      "chimney cleaning near me",
      "chimney repair near me",
      "chimney inspection near me",
      "chimney flashing repair near me",
      "chimney cap replacement near me",
      "chimney liner repair near me"
    ],
    negative_keywords: ["firewood for sale", "DIY", "how to chimney", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 1.8,
    daily_budget: 40,
    ads: [{
      headline1: "Chimney Cleaning Near You — Call Now",
      headline2: "Chimney Repair & Inspection Services",
      headline3: "Certified Chimney Sweeps",
      description1: "Ensure safe heating—sweep & inspect your chimney. Call for booking.",
      description2: "Fast service & competitive rates."
    }],
    final_url: "https://adiology.online/chimney?utm_source=adiology&utm_medium=ads&utm_campaign=chimney_ppc",
    cta: "Call Now"
  },
  {
    slug: "gutters",
    title: "Gutter Cleaning & Repair",
    campaign_name: "Gutters - PPC Calls",
    structure: "MIX",
    landing_page_url: "/landing-pages/landing_page_25.html",
    ad_groups: [
      { name: "Gutter Cleaning" },
      { name: "Gutter Repair" },
      { name: "Gutter Guards" }
    ],
    keywords: [
      "gutter cleaning near me",
      "gutter repair near me",
      "gutter guards installation near me",
      "gutter clean and repair near me",
      "downspout repair near me",
      "clogged gutter cleaning near me",
      "gutter service near me"
    ],
    negative_keywords: ["buy gutters", "diy", "how to", "gutter materials", "jobs"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 1.8,
    daily_budget: 45,
    ads: [{
      headline1: "Gutter Cleaning & Repair — Call Now",
      headline2: "Clogged Gutters? Fast Service",
      headline3: "Install Gutter Guards & Repair",
      description1: "Affordable gutter cleaning & repair. Book this week & save.",
      description2: "Prevent water damage—schedule now."
    }],
    final_url: "https://adiology.online/gutters?utm_source=adiology&utm_medium=ads&utm_campaign=gutters_ppc",
    cta: "Call Now"
  },
  {
    slug: "general-contractor-intent",
    title: "General Contractor - Intent-Based",
    campaign_name: "General Contractor - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_26.html",
    ad_groups: [
      { name: "Home Renovation Intent" },
      { name: "Home Repair Urgency" },
      { name: "New Construction" }
    ],
    keywords: [
      "general contractor near me",
      "home renovation contractor",
      "remodeling contractor near me",
      "home renovation quotes",
      "construction company near me",
      "emergency home repair",
      "water damage repair contractor",
      "residential contractor",
      "home remodeling services",
      "bathroom remodel contractor"
    ],
    negative_keywords: ["commercial", "jobs", "free estimate training", "how to", "DIY"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 5.5,
    daily_budget: 120,
    ads: [{
      headline1: "Licensed General Contractor — Free Quotes",
      headline2: "Home Renovation & Repair Experts",
      headline3: "Quality Workmanship, Competitive Pricing",
      description1: "Bathroom, kitchen, room remodels & repairs. Licensed, insured professionals.",
      description2: "Emergency water damage? Call now for same-day assessment."
    }],
    final_url: "https://adiology.online/general-contractor?utm_source=adiology&utm_medium=ads&utm_campaign=contractor_ibag",
    cta: "Get Free Quote"
  },
  {
    slug: "roof-repair-intent",
    title: "Roof Repair - Intent-Based",
    campaign_name: "Roof Repair - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/landing_page_27.html",
    ad_groups: [
      { name: "Roof Inspection & Assessment" },
      { name: "Emergency Leak Repair" },
      { name: "Full Roof Replacement" }
    ],
    keywords: [
      "roof repair near me",
      "roof leak repair",
      "roof inspection near me",
      "emergency roof repair",
      "roof replacement cost",
      "roofing contractor near me",
      "flat roof repair",
      "shingle repair near me",
      "roof damage assessment",
      "storm damage roof repair"
    ],
    negative_keywords: ["DIY", "roofing materials", "how to", "jobs", "training"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 3.5,
    daily_budget: 85,
    ads: [{
      headline1: "Roof Repair & Replacement — Call Now",
      headline2: "Licensed Roofing Contractors",
      headline3: "Storm Damage? Free Assessment",
      description1: "Leak repairs, inspections & full replacement. Insurance claim help available.",
      description2: "30+ years experience. Free estimates & quick service."
    }],
    final_url: "https://adiology.online/roof-repair?utm_source=adiology&utm_medium=ads&utm_campaign=roof_ibag",
    cta: "Free Inspection"
  },
  {
    slug: "miami-electrician-geo",
    title: "Miami Electrician",
    campaign_name: "Miami Electrician - GEO",
    structure: "GEO",
    landing_page_url: "/landing-pages/landing_page_28.html",
    ad_groups: [
      { name: "Downtown Miami" },
      { name: "Miami Beach" },
      { name: "Coral Gables" }
    ],
    keywords: [
      "electrician Miami",
      "Miami electrician near me",
      "emergency electrician Miami",
      "electrician in Miami Florida",
      "residential electrician Miami",
      "commercial electrician Miami",
      "licensed electrician Miami",
      "24 hour electrician Miami",
      "electrical repair Miami",
      "electrical service Miami"
    ],
    negative_keywords: ["jobs", "training", "wholesale", "DIY", "electrical supply"],
    match_distribution: { exact: 0.3, phrase: 0.45, broad_mod: 0.25 },
    max_cpc: 4.2,
    daily_budget: 95,
    ads: [{
      headline1: "Miami Electrician — 24/7 Emergency",
      headline2: "Licensed, Insured, Local Experts",
      headline3: "Same-Day Service Available",
      description1: "Fast response electricians in Miami. Residential & commercial. Free estimates.",
      description2: "Wiring, panel upgrades, AC issues & more. Upfront pricing, no surprises."
    }],
    final_url: "https://adiology.online/miami-electrician?utm_source=adiology&utm_medium=ads&utm_campaign=miami_geo",
    cta: "Call Now"
  },
  {
    slug: "los-angeles-plumber-geo",
    title: "Los Angeles Plumber",
    campaign_name: "LA Plumber - GEO",
    structure: "GEO",
    landing_page_url: "/landing-pages/landing_page_29.html",
    ad_groups: [
      { name: "Downtown LA" },
      { name: "West LA" },
      { name: "Long Beach Area" }
    ],
    keywords: [
      "plumber Los Angeles",
      "Los Angeles plumber",
      "emergency plumber LA",
      "plumber near me Los Angeles",
      "licensed plumber Los Angeles",
      "drain cleaning Los Angeles",
      "water heater repair LA",
      "bathroom plumbing Los Angeles",
      "burst pipe repair LA",
      "sewer line repair Los Angeles"
    ],
    negative_keywords: ["jobs", "DIY", "plumbing supplies", "how to", "training"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 4.0,
    daily_budget: 90,
    ads: [{
      headline1: "LA Plumber — 24/7 Emergency",
      headline2: "Licensed, Experienced Professionals",
      headline3: "Same-Day Service Guaranteed",
      description1: "Fast plumbing repairs for LA homes. Drains, pipes, water heaters & more.",
      description2: "Free estimates, upfront pricing, licensed technicians."
    }],
    final_url: "https://adiology.online/los-angeles-plumber?utm_source=adiology&utm_medium=ads&utm_campaign=la_plumber_geo",
    cta: "Call Today"
  },
  {
    slug: "dental-clinic-stag",
    title: "Dental Clinic",
    campaign_name: "Dental Clinic - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/dental.html",
    ad_groups: [
      { name: "General Dentistry" },
      { name: "Cosmetic Dentistry" },
      { name: "Emergency Dental" },
      { name: "Dental Implants" }
    ],
    keywords: [
      "dentist near me", "dental clinic near me", "teeth cleaning near me", "emergency dentist",
      "cosmetic dentist near me", "teeth whitening near me", "dental implants near me",
      "root canal dentist", "dental checkup near me", "family dentist near me",
      "affordable dentist near me", "dental crown near me", "tooth extraction near me"
    ],
    negative_keywords: ["dental school", "free dental", "jobs", "training", "dental supplies"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 5.5,
    daily_budget: 150,
    ads: [{
      headline1: "Trusted Dental Care — Book Today",
      headline2: "Family & Cosmetic Dentistry",
      headline3: "Emergency Appointments Available",
      headline4: "Insurance Accepted — Affordable Care",
      headline5: "Modern, Comfortable Dental Office",
      description1: "Comprehensive dental services for the whole family. Cleanings, fillings, implants & more.",
      description2: "New patient special offer. Book your appointment online or call now."
    }],
    final_url: "https://adiology.online/dental-clinic?utm_source=adiology&utm_medium=ads&utm_campaign=dental_stag",
    cta: "Book Appointment",
    sitelinks: [
      { text: "Teeth Whitening", description1: "Professional whitening", description2: "Bright smile in 1 visit", finalUrl: "https://adiology.online/dental-clinic/whitening" },
      { text: "Dental Implants", description1: "Permanent tooth replacement", description2: "Free consultation", finalUrl: "https://adiology.online/dental-clinic/implants" },
      { text: "Emergency Dental", description1: "Same-day appointments", description2: "Open 7 days a week", finalUrl: "https://adiology.online/dental-clinic/emergency" },
      { text: "New Patient Special", description1: "First visit discount", description2: "Full exam & X-rays", finalUrl: "https://adiology.online/dental-clinic/new-patient" }
    ],
    callouts: [
      { text: "Same-Day Appointments" },
      { text: "Insurance Accepted" },
      { text: "Flexible Financing" },
      { text: "Modern Equipment" }
    ],
    structured_snippets: [
      { header: "Services", values: ["Cleanings", "Fillings", "Implants", "Whitening", "Root Canals"] }
    ]
  },
  {
    slug: "personal-injury-lawyer-ibag",
    title: "Personal Injury Lawyer",
    campaign_name: "Personal Injury Lawyer - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/injury-lawyer.html",
    ad_groups: [
      { name: "Car Accident Intent" },
      { name: "Workplace Injury Intent" },
      { name: "Medical Malpractice Intent" }
    ],
    keywords: [
      "personal injury lawyer near me", "car accident lawyer", "injury attorney near me",
      "slip and fall lawyer", "workplace injury lawyer", "medical malpractice attorney",
      "wrongful death lawyer", "injury claim lawyer", "accident lawyer free consultation",
      "best personal injury attorney", "no win no fee lawyer"
    ],
    negative_keywords: ["law school", "paralegal jobs", "pro bono", "free legal advice", "how to become"],
    match_distribution: { exact: 0.3, phrase: 0.5, broad_mod: 0.2 },
    max_cpc: 15.0,
    daily_budget: 500,
    ads: [{
      headline1: "Injured? Get Compensation Now",
      headline2: "No Win, No Fee Guarantee",
      headline3: "Free Case Evaluation — Call 24/7",
      headline4: "Millions Recovered for Clients",
      headline5: "Experienced Trial Attorneys",
      description1: "Don't settle for less. Our injury lawyers fight for maximum compensation. Free consultation.",
      description2: "Car accidents, workplace injuries, medical malpractice. Call now for free case review."
    }],
    final_url: "https://adiology.online/personal-injury-lawyer?utm_source=adiology&utm_medium=ads&utm_campaign=injury_ibag",
    cta: "Free Consultation",
    sitelinks: [
      { text: "Car Accident Cases", description1: "Experienced auto injury lawyers", description2: "Maximum settlements", finalUrl: "https://adiology.online/personal-injury-lawyer/car-accident" },
      { text: "Free Case Review", description1: "No obligation consultation", description2: "Available 24/7", finalUrl: "https://adiology.online/personal-injury-lawyer/free-review" },
      { text: "Our Results", description1: "Millions recovered", description2: "See our case wins", finalUrl: "https://adiology.online/personal-injury-lawyer/results" },
      { text: "Contact Us", description1: "Speak to an attorney", description2: "Call or chat now", finalUrl: "https://adiology.online/personal-injury-lawyer/contact" }
    ],
    callouts: [
      { text: "No Win No Fee" },
      { text: "24/7 Availability" },
      { text: "Free Consultation" },
      { text: "Home & Hospital Visits" }
    ]
  },
  {
    slug: "real-estate-agent-mix",
    title: "Real Estate Agent",
    campaign_name: "Real Estate Agent - MIX",
    structure: "MIX",
    landing_page_url: "/landing-pages/real-estate.html",
    ad_groups: [
      { name: "Buyers Agent" },
      { name: "Sellers Agent" },
      { name: "Luxury Homes" },
      { name: "First Time Buyers" }
    ],
    keywords: [
      "real estate agent near me", "realtor near me", "homes for sale near me",
      "sell my house fast", "buy a house near me", "luxury realtor near me",
      "first time home buyer agent", "real estate listings near me", "home selling agent",
      "best realtor near me", "property agent near me"
    ],
    negative_keywords: ["real estate license", "become realtor", "jobs", "training", "rent"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 6.0,
    daily_budget: 180,
    ads: [{
      headline1: "Top Local Real Estate Agent",
      headline2: "Buy or Sell Your Home Today",
      headline3: "Free Home Valuation",
      headline4: "Experienced Neighborhood Expert",
      headline5: "Sell Fast, Get Top Dollar",
      description1: "Local realtor with 15+ years experience. Free market analysis & personalized service.",
      description2: "Buyers & sellers welcome. Let me help you find your dream home or sell for top dollar."
    }],
    final_url: "https://adiology.online/real-estate-agent?utm_source=adiology&utm_medium=ads&utm_campaign=realtor_mix",
    cta: "Get Free Valuation",
    sitelinks: [
      { text: "View Listings", description1: "Browse available homes", description2: "Updated daily", finalUrl: "https://adiology.online/real-estate-agent/listings" },
      { text: "Sell Your Home", description1: "Get top dollar", description2: "Free home valuation", finalUrl: "https://adiology.online/real-estate-agent/sell" },
      { text: "First-Time Buyers", description1: "Step-by-step guidance", description2: "Pre-approval help", finalUrl: "https://adiology.online/real-estate-agent/first-time" },
      { text: "About Me", description1: "15+ years experience", description2: "Local market expert", finalUrl: "https://adiology.online/real-estate-agent/about" }
    ],
    callouts: [
      { text: "Free Home Valuation" },
      { text: "Virtual Tours Available" },
      { text: "Negotiation Expert" },
      { text: "Local Market Knowledge" }
    ]
  },
  {
    slug: "auto-repair-skag",
    title: "Auto Repair Shop",
    campaign_name: "Auto Repair - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/auto-repair.html",
    ad_groups: [
      { name: "brake repair near me" },
      { name: "oil change near me" },
      { name: "transmission repair near me" },
      { name: "tire service near me" },
      { name: "auto AC repair near me" },
      { name: "engine repair near me" },
      { name: "car inspection near me" },
      { name: "suspension repair near me" }
    ],
    keywords: [
      "auto repair near me", "brake repair near me", "oil change near me",
      "transmission repair near me", "tire service near me", "auto AC repair near me",
      "engine repair near me", "car inspection near me", "suspension repair near me",
      "mechanic near me", "car repair shop near me"
    ],
    negative_keywords: ["auto parts store", "DIY repair", "car repair manual", "jobs", "training"],
    match_distribution: { exact: 0.3, phrase: 0.5, broad_mod: 0.2 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Expert Auto Repair — Book Now",
      headline2: "Certified Mechanics — All Makes",
      headline3: "Same-Day Service Available",
      headline4: "Honest Pricing, No Surprises",
      headline5: "Free Diagnostic Check",
      description1: "Full-service auto repair. Brakes, oil, transmission, AC & more. ASE certified mechanics.",
      description2: "Family-owned shop with transparent pricing. Schedule your appointment today."
    }],
    final_url: "https://adiology.online/auto-repair?utm_source=adiology&utm_medium=ads&utm_campaign=auto_skag",
    cta: "Book Service",
    sitelinks: [
      { text: "Brake Service", description1: "Pads, rotors, calipers", description2: "Free brake inspection", finalUrl: "https://adiology.online/auto-repair/brakes" },
      { text: "Oil Change", description1: "Synthetic & conventional", description2: "Quick service", finalUrl: "https://adiology.online/auto-repair/oil-change" },
      { text: "Tire Service", description1: "New tires, rotation", description2: "Alignment available", finalUrl: "https://adiology.online/auto-repair/tires" },
      { text: "Free Estimate", description1: "No obligation quote", description2: "Call or visit", finalUrl: "https://adiology.online/auto-repair/estimate" }
    ],
    callouts: [
      { text: "ASE Certified" },
      { text: "Same-Day Service" },
      { text: "All Makes & Models" },
      { text: "Warranty on Parts" }
    ]
  },
  {
    slug: "wedding-photographer-stag",
    title: "Wedding Photographer",
    campaign_name: "Wedding Photographer - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/wedding-photo.html",
    ad_groups: [
      { name: "Wedding Photography" },
      { name: "Engagement Sessions" },
      { name: "Bridal Portraits" }
    ],
    keywords: [
      "wedding photographer near me", "wedding photography packages", "engagement photographer",
      "bridal portrait photographer", "affordable wedding photographer", "best wedding photographer",
      "destination wedding photographer", "elopement photographer", "wedding videographer near me"
    ],
    negative_keywords: ["photography classes", "camera for sale", "free photography", "jobs", "how to"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 4.0,
    daily_budget: 120,
    ads: [{
      headline1: "Stunning Wedding Photography",
      headline2: "Capture Your Perfect Day",
      headline3: "Award-Winning Photographer",
      headline4: "Custom Packages Available",
      headline5: "Book Your Date Today",
      description1: "Beautiful, timeless wedding photos. Professional photographer with 10+ years experience.",
      description2: "Engagement sessions, full-day coverage & albums. Limited dates available — book now."
    }],
    final_url: "https://adiology.online/wedding-photographer?utm_source=adiology&utm_medium=ads&utm_campaign=wedding_stag",
    cta: "View Portfolio",
    sitelinks: [
      { text: "View Portfolio", description1: "See our best work", description2: "Real weddings", finalUrl: "https://adiology.online/wedding-photographer/portfolio" },
      { text: "Pricing & Packages", description1: "Transparent pricing", description2: "Custom packages", finalUrl: "https://adiology.online/wedding-photographer/pricing" },
      { text: "Engagement Sessions", description1: "Pre-wedding photos", description2: "Complimentary with pkg", finalUrl: "https://adiology.online/wedding-photographer/engagement" },
      { text: "Contact Us", description1: "Check availability", description2: "Free consultation", finalUrl: "https://adiology.online/wedding-photographer/contact" }
    ],
    callouts: [
      { text: "10+ Years Experience" },
      { text: "High-Res Digital Files" },
      { text: "Free Engagement Session" },
      { text: "Same-Day Previews" }
    ]
  },
  {
    slug: "fitness-gym-ibag",
    title: "Fitness Gym",
    campaign_name: "Fitness Gym - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/fitness-gym.html",
    ad_groups: [
      { name: "Weight Loss Intent" },
      { name: "Muscle Building Intent" },
      { name: "General Fitness Intent" }
    ],
    keywords: [
      "gym near me", "fitness center near me", "personal trainer near me",
      "weight loss gym near me", "24 hour gym near me", "gym membership deals",
      "crossfit gym near me", "strength training gym", "gym with pool near me",
      "women's gym near me", "cheap gym near me"
    ],
    negative_keywords: ["gym equipment for sale", "home gym", "gym franchise", "jobs", "trainer certification"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 2.5,
    daily_budget: 80,
    ads: [{
      headline1: "Join Our Gym — First Month Free",
      headline2: "State-of-the-Art Equipment",
      headline3: "Personal Training Available",
      headline4: "Open 24/7 — No Contracts",
      headline5: "Group Classes Included",
      description1: "Achieve your fitness goals. Modern equipment, expert trainers, supportive community.",
      description2: "Tour our facility for free. Join today & get your first month on us."
    }],
    final_url: "https://adiology.online/fitness-gym?utm_source=adiology&utm_medium=ads&utm_campaign=gym_ibag",
    cta: "Start Free Trial",
    sitelinks: [
      { text: "Free Trial", description1: "Try before you join", description2: "No commitment", finalUrl: "https://adiology.online/fitness-gym/free-trial" },
      { text: "Membership Plans", description1: "Flexible pricing", description2: "No contracts", finalUrl: "https://adiology.online/fitness-gym/membership" },
      { text: "Group Classes", description1: "Yoga, spin, HIIT", description2: "All levels welcome", finalUrl: "https://adiology.online/fitness-gym/classes" },
      { text: "Personal Training", description1: "1-on-1 coaching", description2: "Custom programs", finalUrl: "https://adiology.online/fitness-gym/personal-training" }
    ],
    callouts: [
      { text: "First Month Free" },
      { text: "Open 24/7" },
      { text: "No Long-Term Contracts" },
      { text: "Free Parking" }
    ]
  },
  {
    slug: "accounting-firm-stag",
    title: "Accounting & Tax Services",
    campaign_name: "Accounting Firm - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/accounting.html",
    ad_groups: [
      { name: "Tax Preparation" },
      { name: "Business Accounting" },
      { name: "Bookkeeping Services" }
    ],
    keywords: [
      "accountant near me", "tax preparation near me", "CPA near me",
      "bookkeeping services near me", "small business accountant", "tax planning services",
      "business tax filing", "payroll services near me", "tax advisor near me",
      "quarterly tax preparation", "corporate accounting services"
    ],
    negative_keywords: ["accounting software", "free tax filing", "jobs", "CPA exam", "accounting degree"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 8.0,
    daily_budget: 200,
    ads: [{
      headline1: "Expert Tax & Accounting Services",
      headline2: "CPA Firm — Trusted Advisors",
      headline3: "Business & Personal Tax Prep",
      headline4: "Maximize Your Deductions",
      headline5: "Year-Round Support",
      description1: "Certified public accountants for individuals & businesses. Tax prep, planning & bookkeeping.",
      description2: "Reduce your tax burden legally. Schedule your free consultation today."
    }],
    final_url: "https://adiology.online/accounting-firm?utm_source=adiology&utm_medium=ads&utm_campaign=accounting_stag",
    cta: "Schedule Consultation",
    sitelinks: [
      { text: "Tax Preparation", description1: "Personal & business", description2: "Maximize refunds", finalUrl: "https://adiology.online/accounting-firm/tax-prep" },
      { text: "Bookkeeping", description1: "Monthly services", description2: "Accurate records", finalUrl: "https://adiology.online/accounting-firm/bookkeeping" },
      { text: "Business Services", description1: "Payroll, consulting", description2: "Grow your business", finalUrl: "https://adiology.online/accounting-firm/business" },
      { text: "Free Consultation", description1: "Meet our CPAs", description2: "No obligation", finalUrl: "https://adiology.online/accounting-firm/consultation" }
    ],
    callouts: [
      { text: "Licensed CPAs" },
      { text: "Year-Round Support" },
      { text: "IRS Representation" },
      { text: "Secure Client Portal" }
    ]
  },
  {
    slug: "home-cleaning-geo",
    title: "Home Cleaning Service",
    campaign_name: "Home Cleaning - GEO",
    structure: "GEO",
    landing_page_url: "/landing-pages/home-cleaning.html",
    ad_groups: [
      { name: "Chicago Area" },
      { name: "Suburbs" },
      { name: "Downtown" }
    ],
    keywords: [
      "house cleaning near me", "maid service near me", "home cleaning service",
      "deep cleaning service near me", "move out cleaning near me", "weekly cleaning service",
      "residential cleaning near me", "apartment cleaning service", "cleaning lady near me",
      "professional house cleaners"
    ],
    negative_keywords: ["cleaning products", "cleaning jobs", "how to clean", "DIY cleaning", "cleaning supplies"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 3.0,
    daily_budget: 90,
    ads: [{
      headline1: "Professional Home Cleaning",
      headline2: "Trusted, Insured Cleaners",
      headline3: "Book Online — Easy Scheduling",
      headline4: "100% Satisfaction Guaranteed",
      headline5: "Eco-Friendly Products Available",
      description1: "Reliable home cleaning services. Weekly, bi-weekly or one-time deep cleans.",
      description2: "Background-checked cleaners. Book online in 60 seconds. Satisfaction guaranteed."
    }],
    final_url: "https://adiology.online/home-cleaning?utm_source=adiology&utm_medium=ads&utm_campaign=cleaning_geo",
    cta: "Book Online",
    sitelinks: [
      { text: "Get Instant Quote", description1: "Fast online booking", description2: "Transparent pricing", finalUrl: "https://adiology.online/home-cleaning/quote" },
      { text: "Deep Cleaning", description1: "Top-to-bottom clean", description2: "Move-in/move-out", finalUrl: "https://adiology.online/home-cleaning/deep-clean" },
      { text: "Weekly Service", description1: "Regular maintenance", description2: "Discounted rates", finalUrl: "https://adiology.online/home-cleaning/weekly" },
      { text: "Our Guarantee", description1: "100% satisfaction", description2: "Or we re-clean free", finalUrl: "https://adiology.online/home-cleaning/guarantee" }
    ],
    callouts: [
      { text: "Background Checked" },
      { text: "Insured & Bonded" },
      { text: "Eco-Friendly Options" },
      { text: "Same-Day Available" }
    ]
  },
  {
    slug: "dog-grooming-skag",
    title: "Dog Grooming",
    campaign_name: "Dog Grooming - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/dog-grooming.html",
    ad_groups: [
      { name: "dog grooming near me" },
      { name: "pet grooming near me" },
      { name: "mobile dog grooming" },
      { name: "dog bath near me" },
      { name: "puppy grooming near me" }
    ],
    keywords: [
      "dog grooming near me", "pet grooming near me", "mobile dog grooming",
      "dog bath near me", "puppy grooming near me", "dog haircut near me",
      "dog nail trimming near me", "professional dog groomer", "cat grooming near me"
    ],
    negative_keywords: ["grooming tools", "dog grooming school", "how to groom", "jobs", "training"],
    match_distribution: { exact: 0.3, phrase: 0.5, broad_mod: 0.2 },
    max_cpc: 2.5,
    daily_budget: 70,
    ads: [{
      headline1: "Professional Dog Grooming",
      headline2: "Gentle, Caring Groomers",
      headline3: "Full Service — Bath to Trim",
      headline4: "Walk-Ins Welcome",
      headline5: "Mobile Grooming Available",
      description1: "Expert pet grooming for all breeds. Baths, haircuts, nail trims & more. Calm environment.",
      description2: "Book your pup's spa day. Walk-ins welcome or schedule online."
    }],
    final_url: "https://adiology.online/dog-grooming?utm_source=adiology&utm_medium=ads&utm_campaign=grooming_skag",
    cta: "Book Appointment",
    sitelinks: [
      { text: "Full Grooming", description1: "Bath, cut & style", description2: "All breeds", finalUrl: "https://adiology.online/dog-grooming/full-service" },
      { text: "Mobile Grooming", description1: "We come to you", description2: "Convenient & safe", finalUrl: "https://adiology.online/dog-grooming/mobile" },
      { text: "Puppy First Groom", description1: "Gentle introduction", description2: "Special pricing", finalUrl: "https://adiology.online/dog-grooming/puppy" },
      { text: "Pricing", description1: "Transparent rates", description2: "By breed & size", finalUrl: "https://adiology.online/dog-grooming/pricing" }
    ],
    callouts: [
      { text: "Certified Groomers" },
      { text: "All Breeds Welcome" },
      { text: "Calm Environment" },
      { text: "Online Booking" }
    ]
  },
  {
    slug: "landscaping-mix",
    title: "Landscaping Services",
    campaign_name: "Landscaping - MIX",
    structure: "MIX",
    landing_page_url: "/landing-pages/landscaping.html",
    ad_groups: [
      { name: "Landscape Design" },
      { name: "Lawn Installation" },
      { name: "Hardscaping" },
      { name: "Maintenance" }
    ],
    keywords: [
      "landscaping near me", "landscape design near me", "lawn installation near me",
      "hardscape contractors near me", "patio installation near me", "retaining wall contractor",
      "landscape maintenance near me", "irrigation installation", "outdoor lighting installation",
      "sod installation near me"
    ],
    negative_keywords: ["landscaping jobs", "how to landscape", "landscaping supplies", "plants for sale", "DIY"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.5,
    daily_budget: 130,
    ads: [{
      headline1: "Professional Landscaping Services",
      headline2: "Design & Installation Experts",
      headline3: "Transform Your Outdoor Space",
      headline4: "Free Design Consultation",
      headline5: "Licensed & Insured",
      description1: "Full-service landscaping. Design, installation & maintenance. Patios, lawns, lighting & more.",
      description2: "Create your dream outdoor space. Free consultation & 3D design preview."
    }],
    final_url: "https://adiology.online/landscaping?utm_source=adiology&utm_medium=ads&utm_campaign=landscape_mix",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Landscape Design", description1: "Custom 3D designs", description2: "Free consultation", finalUrl: "https://adiology.online/landscaping/design" },
      { text: "Hardscaping", description1: "Patios & walkways", description2: "Retaining walls", finalUrl: "https://adiology.online/landscaping/hardscape" },
      { text: "Lawn Care", description1: "Sod, seeding, maintenance", description2: "Irrigation systems", finalUrl: "https://adiology.online/landscaping/lawn" },
      { text: "Outdoor Lighting", description1: "Path & accent lights", description2: "Professional install", finalUrl: "https://adiology.online/landscaping/lighting" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Licensed & Insured" },
      { text: "5-Year Warranty" },
      { text: "Financing Available" }
    ]
  },
  {
    slug: "tutoring-service-ibag",
    title: "Tutoring Service",
    campaign_name: "Tutoring - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/tutoring.html",
    ad_groups: [
      { name: "Math Tutoring Intent" },
      { name: "Test Prep Intent" },
      { name: "Online Tutoring Intent" }
    ],
    keywords: [
      "tutor near me", "math tutor near me", "SAT prep tutor", "ACT tutor near me",
      "online tutoring", "reading tutor near me", "science tutor near me",
      "homework help tutor", "private tutor near me", "college prep tutor"
    ],
    negative_keywords: ["tutoring jobs", "become a tutor", "free tutoring", "volunteer tutor"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 4.0,
    daily_budget: 100,
    ads: [{
      headline1: "Expert Tutors — All Subjects",
      headline2: "Boost Grades & Confidence",
      headline3: "In-Home or Online Sessions",
      headline4: "SAT/ACT Test Prep Specialists",
      headline5: "Free Trial Session",
      description1: "Personalized tutoring for K-12 & college. Math, science, reading, test prep & more.",
      description2: "Experienced, certified tutors. See results in as little as 4 sessions. Book your free trial."
    }],
    final_url: "https://adiology.online/tutoring?utm_source=adiology&utm_medium=ads&utm_campaign=tutoring_ibag",
    cta: "Book Free Trial",
    sitelinks: [
      { text: "Math Tutoring", description1: "All levels", description2: "Algebra to calculus", finalUrl: "https://adiology.online/tutoring/math" },
      { text: "SAT/ACT Prep", description1: "Score improvement", description2: "Proven strategies", finalUrl: "https://adiology.online/tutoring/test-prep" },
      { text: "Online Tutoring", description1: "Learn from anywhere", description2: "Interactive sessions", finalUrl: "https://adiology.online/tutoring/online" },
      { text: "Find a Tutor", description1: "Match with expert", description2: "Free consultation", finalUrl: "https://adiology.online/tutoring/find" }
    ],
    callouts: [
      { text: "Certified Teachers" },
      { text: "Flexible Scheduling" },
      { text: "Progress Reports" },
      { text: "Satisfaction Guaranteed" }
    ]
  },
  {
    slug: "tree-service-skag",
    title: "Tree Service",
    campaign_name: "Tree Service - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/tree-service.html",
    ad_groups: [
      { name: "tree removal near me" },
      { name: "tree trimming near me" },
      { name: "stump grinding near me" },
      { name: "emergency tree service" },
      { name: "tree pruning near me" }
    ],
    keywords: [
      "tree removal near me", "tree trimming near me", "stump grinding near me",
      "emergency tree service", "tree pruning near me", "tree cutting service",
      "arborist near me", "tree service near me", "dead tree removal"
    ],
    negative_keywords: ["tree for sale", "how to remove tree", "DIY tree removal", "jobs", "chainsaw"],
    match_distribution: { exact: 0.3, phrase: 0.5, broad_mod: 0.2 },
    max_cpc: 5.0,
    daily_budget: 140,
    ads: [{
      headline1: "Professional Tree Service",
      headline2: "Safe Removal & Trimming",
      headline3: "24/7 Emergency Service",
      headline4: "Free Estimates — Insured",
      headline5: "Stump Grinding Available",
      description1: "Licensed arborists for tree removal, trimming & stump grinding. Safe, efficient service.",
      description2: "Storm damage? Emergency service available 24/7. Call for free estimate."
    }],
    final_url: "https://adiology.online/tree-service?utm_source=adiology&utm_medium=ads&utm_campaign=tree_skag",
    cta: "Get Free Estimate",
    sitelinks: [
      { text: "Tree Removal", description1: "Safe & efficient", description2: "Any size tree", finalUrl: "https://adiology.online/tree-service/removal" },
      { text: "Tree Trimming", description1: "Shape & health", description2: "Expert pruning", finalUrl: "https://adiology.online/tree-service/trimming" },
      { text: "Stump Grinding", description1: "Complete removal", description2: "Clean up included", finalUrl: "https://adiology.online/tree-service/stump" },
      { text: "Emergency 24/7", description1: "Storm damage", description2: "Fast response", finalUrl: "https://adiology.online/tree-service/emergency" }
    ],
    callouts: [
      { text: "Fully Insured" },
      { text: "Free Estimates" },
      { text: "Licensed Arborists" },
      { text: "Clean Up Included" }
    ]
  },
  {
    slug: "spa-massage-stag",
    title: "Spa & Massage",
    campaign_name: "Spa & Massage - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/spa.html",
    ad_groups: [
      { name: "Massage Therapy" },
      { name: "Facial Treatments" },
      { name: "Couples Spa" }
    ],
    keywords: [
      "massage near me", "spa near me", "deep tissue massage near me",
      "couples massage near me", "facial near me", "hot stone massage",
      "Swedish massage near me", "day spa near me", "relaxation massage",
      "therapeutic massage near me"
    ],
    negative_keywords: ["massage school", "become massage therapist", "massage table", "jobs", "training"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 3.0,
    daily_budget: 85,
    ads: [{
      headline1: "Relaxing Spa & Massage",
      headline2: "Book Your Escape Today",
      headline3: "Licensed Massage Therapists",
      headline4: "Couples Packages Available",
      headline5: "New Client Special",
      description1: "Unwind with professional massage & spa treatments. Swedish, deep tissue, hot stone & more.",
      description2: "Treat yourself. Book online for instant confirmation. Gift cards available."
    }],
    final_url: "https://adiology.online/spa-massage?utm_source=adiology&utm_medium=ads&utm_campaign=spa_stag",
    cta: "Book Now",
    sitelinks: [
      { text: "Massage Services", description1: "Swedish, deep tissue", description2: "Hot stone, sports", finalUrl: "https://adiology.online/spa-massage/massage" },
      { text: "Facial Treatments", description1: "Anti-aging, hydrating", description2: "Customized facials", finalUrl: "https://adiology.online/spa-massage/facials" },
      { text: "Couples Packages", description1: "Romantic escape", description2: "Side-by-side rooms", finalUrl: "https://adiology.online/spa-massage/couples" },
      { text: "Gift Cards", description1: "Perfect gift", description2: "Any amount", finalUrl: "https://adiology.online/spa-massage/gift-cards" }
    ],
    callouts: [
      { text: "Licensed Therapists" },
      { text: "Relaxing Atmosphere" },
      { text: "Online Booking" },
      { text: "Gift Cards Available" }
    ]
  },
  {
    slug: "catering-service-mix",
    title: "Catering Service",
    campaign_name: "Catering - MIX",
    structure: "MIX",
    landing_page_url: "/landing-pages/catering.html",
    ad_groups: [
      { name: "Wedding Catering" },
      { name: "Corporate Catering" },
      { name: "Party Catering" },
      { name: "Event Catering" }
    ],
    keywords: [
      "catering near me", "wedding catering near me", "corporate catering",
      "party catering near me", "event catering service", "food catering near me",
      "BBQ catering near me", "buffet catering", "catering company near me"
    ],
    negative_keywords: ["catering jobs", "catering equipment", "how to start catering", "catering supplies"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.0,
    daily_budget: 110,
    ads: [{
      headline1: "Professional Catering Service",
      headline2: "Weddings, Corporate & Events",
      headline3: "Custom Menus Available",
      headline4: "Full Service — Setup & Cleanup",
      headline5: "Free Tasting Available",
      description1: "Delicious catering for any occasion. Weddings, corporate events, parties & more.",
      description2: "Customized menus to fit your taste & budget. Request a free quote today."
    }],
    final_url: "https://adiology.online/catering?utm_source=adiology&utm_medium=ads&utm_campaign=catering_mix",
    cta: "Request Quote",
    sitelinks: [
      { text: "Wedding Catering", description1: "Your special day", description2: "Custom menus", finalUrl: "https://adiology.online/catering/wedding" },
      { text: "Corporate Events", description1: "Meetings & conferences", description2: "Professional service", finalUrl: "https://adiology.online/catering/corporate" },
      { text: "Sample Menus", description1: "Browse options", description2: "All cuisines", finalUrl: "https://adiology.online/catering/menus" },
      { text: "Book Tasting", description1: "Try before you book", description2: "Free consultation", finalUrl: "https://adiology.online/catering/tasting" }
    ],
    callouts: [
      { text: "Custom Menus" },
      { text: "Full Service" },
      { text: "Dietary Options" },
      { text: "Setup & Cleanup" }
    ]
  },
  {
    slug: "carpet-cleaning-ibag",
    title: "Carpet Cleaning",
    campaign_name: "Carpet Cleaning - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/carpet-cleaning.html",
    ad_groups: [
      { name: "Residential Cleaning Intent" },
      { name: "Stain Removal Intent" },
      { name: "Commercial Cleaning Intent" }
    ],
    keywords: [
      "carpet cleaning near me", "carpet cleaner near me", "steam carpet cleaning",
      "deep carpet cleaning", "stain removal carpet", "upholstery cleaning near me",
      "commercial carpet cleaning", "rug cleaning near me", "pet stain carpet cleaning"
    ],
    negative_keywords: ["carpet cleaner rental", "DIY carpet cleaning", "carpet cleaning machine", "jobs"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 3.5,
    daily_budget: 95,
    ads: [{
      headline1: "Professional Carpet Cleaning",
      headline2: "Deep Clean — Fast Drying",
      headline3: "Pet Stain Specialists",
      headline4: "Satisfaction Guaranteed",
      headline5: "Free Estimates",
      description1: "Expert carpet & upholstery cleaning. Advanced equipment, eco-friendly solutions.",
      description2: "Remove tough stains & odors. Book online for instant quote. Same-day available."
    }],
    final_url: "https://adiology.online/carpet-cleaning?utm_source=adiology&utm_medium=ads&utm_campaign=carpet_ibag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Carpet Cleaning", description1: "All carpet types", description2: "Deep steam clean", finalUrl: "https://adiology.online/carpet-cleaning/carpets" },
      { text: "Upholstery", description1: "Sofas, chairs, more", description2: "Fabric protection", finalUrl: "https://adiology.online/carpet-cleaning/upholstery" },
      { text: "Pet Stain Removal", description1: "Odor elimination", description2: "Enzyme treatment", finalUrl: "https://adiology.online/carpet-cleaning/pet-stains" },
      { text: "Get Quote", description1: "Instant online quote", description2: "No obligation", finalUrl: "https://adiology.online/carpet-cleaning/quote" }
    ],
    callouts: [
      { text: "Eco-Friendly Products" },
      { text: "Fast Drying" },
      { text: "Pet & Kid Safe" },
      { text: "Same-Day Service" }
    ]
  },
  {
    slug: "insurance-agent-stag",
    title: "Insurance Agent",
    campaign_name: "Insurance Agent - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/insurance.html",
    ad_groups: [
      { name: "Auto Insurance" },
      { name: "Home Insurance" },
      { name: "Life Insurance" },
      { name: "Business Insurance" }
    ],
    keywords: [
      "insurance agent near me", "auto insurance quotes", "home insurance near me",
      "life insurance quotes", "business insurance near me", "car insurance agent",
      "cheap auto insurance", "insurance broker near me", "renters insurance quotes"
    ],
    negative_keywords: ["insurance jobs", "become insurance agent", "insurance license", "insurance exam"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 12.0,
    daily_budget: 300,
    ads: [{
      headline1: "Save on Insurance — Free Quotes",
      headline2: "Auto, Home & Life Coverage",
      headline3: "Local Independent Agent",
      headline4: "Compare Top Carriers",
      headline5: "Bundle & Save More",
      description1: "Get personalized insurance quotes in minutes. Auto, home, life & business coverage.",
      description2: "Independent agent with access to top carriers. Find the best rates. Call or quote online."
    }],
    final_url: "https://adiology.online/insurance-agent?utm_source=adiology&utm_medium=ads&utm_campaign=insurance_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Auto Insurance", description1: "Compare top carriers", description2: "Save up to 40%", finalUrl: "https://adiology.online/insurance-agent/auto" },
      { text: "Home Insurance", description1: "Protect your home", description2: "Customized coverage", finalUrl: "https://adiology.online/insurance-agent/home" },
      { text: "Life Insurance", description1: "Protect your family", description2: "Affordable plans", finalUrl: "https://adiology.online/insurance-agent/life" },
      { text: "Bundle & Save", description1: "Multi-policy discounts", description2: "Maximum savings", finalUrl: "https://adiology.online/insurance-agent/bundle" }
    ],
    callouts: [
      { text: "Free Quotes" },
      { text: "Top Carriers" },
      { text: "Bundle Discounts" },
      { text: "Licensed Agent" }
    ]
  },
  {
    slug: "electrician-nyc-geo",
    title: "NYC Electrician",
    campaign_name: "NYC Electrician - GEO",
    structure: "GEO",
    landing_page_url: "/landing-pages/nyc-electrician.html",
    ad_groups: [
      { name: "Manhattan" },
      { name: "Brooklyn" },
      { name: "Queens" },
      { name: "Bronx" }
    ],
    keywords: [
      "electrician NYC", "New York electrician", "Manhattan electrician",
      "Brooklyn electrician", "Queens electrician near me", "emergency electrician NYC",
      "licensed electrician New York", "electrical contractor NYC", "24 hour electrician NYC"
    ],
    negative_keywords: ["electrician jobs NYC", "electrical apprenticeship", "how to become", "training"],
    match_distribution: { exact: 0.3, phrase: 0.45, broad_mod: 0.25 },
    max_cpc: 6.0,
    daily_budget: 180,
    ads: [{
      headline1: "NYC Electrician — 24/7 Service",
      headline2: "Licensed NYC Electrical Contractor",
      headline3: "All Boroughs — Fast Response",
      headline4: "Residential & Commercial",
      headline5: "Free Estimates",
      description1: "Expert electricians serving all NYC boroughs. Emergency service, repairs & installations.",
      description2: "Licensed, insured & experienced. Call for same-day service. Free estimates."
    }],
    final_url: "https://adiology.online/nyc-electrician?utm_source=adiology&utm_medium=ads&utm_campaign=nyc_geo",
    cta: "Call Now",
    sitelinks: [
      { text: "Emergency Service", description1: "24/7 availability", description2: "Fast response", finalUrl: "https://adiology.online/nyc-electrician/emergency" },
      { text: "Residential", description1: "Home electrical", description2: "All repairs & installs", finalUrl: "https://adiology.online/nyc-electrician/residential" },
      { text: "Commercial", description1: "Business electrical", description2: "Code compliance", finalUrl: "https://adiology.online/nyc-electrician/commercial" },
      { text: "Service Areas", description1: "All NYC boroughs", description2: "Quick dispatch", finalUrl: "https://adiology.online/nyc-electrician/areas" }
    ],
    callouts: [
      { text: "All NYC Boroughs" },
      { text: "24/7 Emergency" },
      { text: "Licensed & Insured" },
      { text: "Same-Day Service" }
    ]
  },
  {
    slug: "appliance-repair-skag",
    title: "Appliance Repair",
    campaign_name: "Appliance Repair - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/appliance-repair.html",
    ad_groups: [
      { name: "refrigerator repair near me" },
      { name: "washer repair near me" },
      { name: "dryer repair near me" },
      { name: "dishwasher repair near me" },
      { name: "oven repair near me" },
      { name: "microwave repair near me" }
    ],
    keywords: [
      "appliance repair near me", "refrigerator repair near me", "washer repair near me",
      "dryer repair near me", "dishwasher repair near me", "oven repair near me",
      "microwave repair near me", "freezer repair near me", "stove repair near me"
    ],
    negative_keywords: ["appliance parts", "DIY appliance repair", "used appliances", "jobs", "how to fix"],
    match_distribution: { exact: 0.3, phrase: 0.5, broad_mod: 0.2 },
    max_cpc: 4.0,
    daily_budget: 120,
    ads: [{
      headline1: "Appliance Repair — Same Day",
      headline2: "All Major Brands Serviced",
      headline3: "Licensed Technicians",
      headline4: "Fair, Upfront Pricing",
      headline5: "Warranty on All Repairs",
      description1: "Fast appliance repair for refrigerators, washers, dryers, dishwashers & more.",
      description2: "Factory-trained technicians. Same-day service available. Call for free diagnosis."
    }],
    final_url: "https://adiology.online/appliance-repair?utm_source=adiology&utm_medium=ads&utm_campaign=appliance_skag",
    cta: "Schedule Repair",
    sitelinks: [
      { text: "Refrigerator Repair", description1: "All brands", description2: "Same-day service", finalUrl: "https://adiology.online/appliance-repair/refrigerator" },
      { text: "Washer & Dryer", description1: "Quick diagnosis", description2: "Parts in stock", finalUrl: "https://adiology.online/appliance-repair/laundry" },
      { text: "Dishwasher Repair", description1: "Not draining? Leaking?", description2: "We can fix it", finalUrl: "https://adiology.online/appliance-repair/dishwasher" },
      { text: "Oven & Stove", description1: "Gas & electric", description2: "Expert repair", finalUrl: "https://adiology.online/appliance-repair/oven" }
    ],
    callouts: [
      { text: "Same-Day Service" },
      { text: "All Major Brands" },
      { text: "Warranty Included" },
      { text: "Fair Pricing" }
    ]
  },
  {
    slug: "garage-door-repair-ibag",
    title: "Garage Door Repair",
    campaign_name: "Garage Door - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/garage-door.html",
    ad_groups: [
      { name: "Emergency Repair Intent" },
      { name: "Spring Replacement Intent" },
      { name: "Opener Repair Intent" }
    ],
    keywords: [
      "garage door repair near me", "garage door spring repair", "garage door opener repair",
      "emergency garage door service", "garage door installation near me",
      "broken garage door spring", "garage door not opening", "garage door cable repair"
    ],
    negative_keywords: ["garage door parts", "DIY garage door", "how to fix", "garage door for sale"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 5.5,
    daily_budget: 150,
    ads: [{
      headline1: "Garage Door Repair — Call 24/7",
      headline2: "Broken Spring? Fast Fix",
      headline3: "Same-Day Emergency Service",
      headline4: "All Brands & Types",
      headline5: "Free Safety Inspection",
      description1: "Expert garage door repair. Springs, openers, cables & panels. Same-day service.",
      description2: "Stuck or broken? We're available 24/7 for emergencies. Call for free estimate."
    }],
    final_url: "https://adiology.online/garage-door-repair?utm_source=adiology&utm_medium=ads&utm_campaign=garagedoor_ibag",
    cta: "Call Now",
    sitelinks: [
      { text: "Spring Repair", description1: "Torsion & extension", description2: "Same-day service", finalUrl: "https://adiology.online/garage-door-repair/springs" },
      { text: "Opener Repair", description1: "All brands", description2: "Motor replacement", finalUrl: "https://adiology.online/garage-door-repair/openers" },
      { text: "New Installation", description1: "Quality doors", description2: "Professional install", finalUrl: "https://adiology.online/garage-door-repair/installation" },
      { text: "Emergency 24/7", description1: "Stuck or broken?", description2: "Fast response", finalUrl: "https://adiology.online/garage-door-repair/emergency" }
    ],
    callouts: [
      { text: "24/7 Emergency" },
      { text: "Same-Day Service" },
      { text: "Warranty Included" },
      { text: "Free Estimates" }
    ]
  },
  {
    slug: "tree-service-skag-home",
    title: "Tree Service",
    campaign_name: "Tree Service - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/tree-service.html",
    ad_groups: [
      { name: "tree removal near me" },
      { name: "tree trimming near me" },
      { name: "stump grinding near me" },
      { name: "emergency tree service" },
      { name: "tree pruning near me" },
      { name: "tree cutting near me" }
    ],
    keywords: [
      "tree removal near me", "tree trimming near me", "stump grinding near me",
      "emergency tree service", "tree pruning near me", "tree cutting near me",
      "arborist near me", "tree service near me", "dead tree removal",
      "storm damage tree removal", "tree removal cost"
    ],
    negative_keywords: ["tree planting", "buy trees", "nursery", "jobs", "how to cut tree", "DIY"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 4.5,
    daily_budget: 130,
    ads: [{
      headline1: "Tree Removal & Trimming — Call Now",
      headline2: "Licensed Arborists — Free Quotes",
      headline3: "Emergency Storm Service",
      headline4: "Stump Grinding Available",
      headline5: "Fully Insured",
      description1: "Professional tree removal, trimming & stump grinding. Licensed & insured arborists.",
      description2: "Storm damage cleanup & emergency service. Free estimates. Call today."
    }],
    final_url: "https://adiology.online/tree-service?utm_source=adiology&utm_medium=ads&utm_campaign=tree_skag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Tree Removal", description1: "Safe & efficient", description2: "Any size tree", finalUrl: "https://adiology.online/tree-service/removal" },
      { text: "Tree Trimming", description1: "Shape & maintain", description2: "Improve health", finalUrl: "https://adiology.online/tree-service/trimming" },
      { text: "Stump Grinding", description1: "Complete removal", description2: "No trace left", finalUrl: "https://adiology.online/tree-service/stump" },
      { text: "Emergency Service", description1: "Storm damage", description2: "Fast response", finalUrl: "https://adiology.online/tree-service/emergency" }
    ],
    callouts: [
      { text: "Licensed Arborists" },
      { text: "Fully Insured" },
      { text: "Free Estimates" },
      { text: "Same-Day Service" }
    ]
  },
  {
    slug: "fence-installation-stag",
    title: "Fence Installation",
    campaign_name: "Fence Installation - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/fence.html",
    ad_groups: [
      { name: "Wood Fence" },
      { name: "Vinyl Fence" },
      { name: "Chain Link Fence" },
      { name: "Fence Repair" }
    ],
    keywords: [
      "fence installation near me", "fence company near me", "wood fence installation",
      "vinyl fence installation", "chain link fence near me", "fence repair near me",
      "privacy fence installation", "fence contractor near me", "fence quote near me"
    ],
    negative_keywords: ["fence panels for sale", "DIY fence", "how to build fence", "jobs", "fence materials"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Fence Installation — Free Quote",
      headline2: "Wood, Vinyl & Chain Link",
      headline3: "Licensed Fence Contractors",
      headline4: "Quality Materials & Workmanship",
      headline5: "Fast Installation",
      description1: "Professional fence installation & repair. Wood, vinyl, chain link & more.",
      description2: "Free on-site estimates. Quality workmanship guaranteed. Call today."
    }],
    final_url: "https://adiology.online/fence?utm_source=adiology&utm_medium=ads&utm_campaign=fence_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Wood Fences", description1: "Classic & durable", description2: "Custom designs", finalUrl: "https://adiology.online/fence/wood" },
      { text: "Vinyl Fences", description1: "Low maintenance", description2: "Long-lasting", finalUrl: "https://adiology.online/fence/vinyl" },
      { text: "Chain Link", description1: "Affordable option", description2: "Quick install", finalUrl: "https://adiology.online/fence/chain-link" },
      { text: "Fence Repair", description1: "All fence types", description2: "Fast service", finalUrl: "https://adiology.online/fence/repair" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Licensed & Insured" },
      { text: "Quality Materials" },
      { text: "Warranty Included" }
    ]
  },
  {
    slug: "window-installation-ibag",
    title: "Window Installation",
    campaign_name: "Window Installation - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/window.html",
    ad_groups: [
      { name: "Replacement Windows Intent" },
      { name: "Energy Efficient Intent" },
      { name: "Window Repair Intent" }
    ],
    keywords: [
      "window installation near me", "window replacement near me", "new windows near me",
      "energy efficient windows", "window repair near me", "vinyl window installation",
      "double pane window replacement", "window contractor near me", "window glass replacement"
    ],
    negative_keywords: ["windows for sale", "DIY window", "how to install window", "jobs", "window blinds"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 5.0,
    daily_budget: 150,
    ads: [{
      headline1: "Window Replacement — Free Quote",
      headline2: "Energy Efficient Windows",
      headline3: "Licensed Window Installers",
      headline4: "Lower Your Energy Bills",
      headline5: "Lifetime Warranty",
      description1: "Professional window installation & replacement. Energy efficient options available.",
      description2: "Free in-home estimates. Reduce energy costs. Financing available."
    }],
    final_url: "https://adiology.online/window?utm_source=adiology&utm_medium=ads&utm_campaign=window_ibag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Vinyl Windows", description1: "Low maintenance", description2: "Energy efficient", finalUrl: "https://adiology.online/window/vinyl" },
      { text: "Double Pane", description1: "Better insulation", description2: "Reduce noise", finalUrl: "https://adiology.online/window/double-pane" },
      { text: "Window Repair", description1: "All window types", description2: "Fast service", finalUrl: "https://adiology.online/window/repair" },
      { text: "Free Estimate", description1: "No obligation", description2: "In-home consult", finalUrl: "https://adiology.online/window/estimate" }
    ],
    callouts: [
      { text: "Lifetime Warranty" },
      { text: "Energy Efficient" },
      { text: "Free Estimates" },
      { text: "Financing Available" }
    ]
  },
  {
    slug: "siding-installation-stag",
    title: "Siding Installation",
    campaign_name: "Siding Installation - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/siding.html",
    ad_groups: [
      { name: "Vinyl Siding" },
      { name: "Fiber Cement Siding" },
      { name: "Siding Repair" }
    ],
    keywords: [
      "siding installation near me", "siding contractor near me", "vinyl siding installation",
      "siding repair near me", "siding replacement near me", "fiber cement siding near me",
      "exterior siding near me", "house siding near me", "siding company near me"
    ],
    negative_keywords: ["siding for sale", "DIY siding", "how to install siding", "jobs", "siding materials"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 4.0,
    daily_budget: 120,
    ads: [{
      headline1: "Siding Installation — Free Quote",
      headline2: "Vinyl & Fiber Cement Options",
      headline3: "Licensed Siding Contractors",
      headline4: "Transform Your Home's Exterior",
      headline5: "Quality Workmanship",
      description1: "Professional siding installation & repair. Vinyl, fiber cement & more.",
      description2: "Free estimates. Improve curb appeal & protect your home. Call today."
    }],
    final_url: "https://adiology.online/siding?utm_source=adiology&utm_medium=ads&utm_campaign=siding_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Vinyl Siding", description1: "Low maintenance", description2: "Many colors", finalUrl: "https://adiology.online/siding/vinyl" },
      { text: "Fiber Cement", description1: "Durable & stylish", description2: "Fire resistant", finalUrl: "https://adiology.online/siding/fiber-cement" },
      { text: "Siding Repair", description1: "All types", description2: "Fast turnaround", finalUrl: "https://adiology.online/siding/repair" },
      { text: "Free Estimate", description1: "In-home consult", description2: "No obligation", finalUrl: "https://adiology.online/siding/estimate" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Licensed Contractors" },
      { text: "Quality Materials" },
      { text: "Warranty Included" }
    ]
  },
  {
    slug: "deck-building-mix",
    title: "Deck Building",
    campaign_name: "Deck Building - MIX",
    structure: "MIX",
    landing_page_url: "/landing-pages/deck.html",
    ad_groups: [
      { name: "Wood Decks" },
      { name: "Composite Decks" },
      { name: "Deck Repair" },
      { name: "Deck Design" }
    ],
    keywords: [
      "deck builder near me", "deck installation near me", "custom deck builder",
      "composite deck installation", "wood deck builder near me", "deck repair near me",
      "deck contractor near me", "deck design near me", "patio deck builder"
    ],
    negative_keywords: ["deck materials for sale", "DIY deck", "how to build deck", "jobs", "deck boards sale"],
    match_distribution: { exact: 0.2, phrase: 0.5, broad_mod: 0.3 },
    max_cpc: 4.0,
    daily_budget: 110,
    ads: [{
      headline1: "Custom Deck Builder — Free Quote",
      headline2: "Wood & Composite Options",
      headline3: "Licensed Deck Contractors",
      headline4: "Extend Your Living Space",
      headline5: "Quality Craftsmanship",
      description1: "Professional deck building & repair. Custom designs, wood & composite materials.",
      description2: "Free design consultation. Transform your backyard. Call today."
    }],
    final_url: "https://adiology.online/deck?utm_source=adiology&utm_medium=ads&utm_campaign=deck_mix",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Wood Decks", description1: "Natural beauty", description2: "Classic style", finalUrl: "https://adiology.online/deck/wood" },
      { text: "Composite Decks", description1: "Low maintenance", description2: "Long lasting", finalUrl: "https://adiology.online/deck/composite" },
      { text: "Deck Repair", description1: "Fix & restore", description2: "All deck types", finalUrl: "https://adiology.online/deck/repair" },
      { text: "Free Design", description1: "Custom plans", description2: "3D rendering", finalUrl: "https://adiology.online/deck/design" }
    ],
    callouts: [
      { text: "Custom Designs" },
      { text: "Licensed & Insured" },
      { text: "Free Estimates" },
      { text: "Quality Materials" }
    ]
  },
  {
    slug: "concrete-driveway-stag",
    title: "Concrete & Driveway",
    campaign_name: "Concrete - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/concrete.html",
    ad_groups: [
      { name: "Driveway Installation" },
      { name: "Concrete Repair" },
      { name: "Stamped Concrete" }
    ],
    keywords: [
      "concrete contractor near me", "driveway installation near me", "concrete driveway near me",
      "concrete repair near me", "stamped concrete near me", "concrete patio near me",
      "driveway replacement near me", "concrete work near me", "concrete company near me"
    ],
    negative_keywords: ["concrete for sale", "DIY concrete", "how to pour concrete", "jobs", "concrete mix"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Concrete Contractor — Free Quote",
      headline2: "Driveways, Patios & More",
      headline3: "Licensed Concrete Experts",
      headline4: "Quality Workmanship",
      headline5: "Stamped Concrete Available",
      description1: "Professional concrete installation & repair. Driveways, patios, walkways & more.",
      description2: "Free estimates. Quality concrete work. Stamped & decorative options. Call today."
    }],
    final_url: "https://adiology.online/concrete?utm_source=adiology&utm_medium=ads&utm_campaign=concrete_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Driveways", description1: "New & replacement", description2: "Quality concrete", finalUrl: "https://adiology.online/concrete/driveway" },
      { text: "Patios", description1: "Extend living space", description2: "Custom designs", finalUrl: "https://adiology.online/concrete/patio" },
      { text: "Stamped Concrete", description1: "Decorative options", description2: "Many patterns", finalUrl: "https://adiology.online/concrete/stamped" },
      { text: "Concrete Repair", description1: "Cracks & damage", description2: "Restore & level", finalUrl: "https://adiology.online/concrete/repair" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Licensed Contractors" },
      { text: "Quality Concrete" },
      { text: "Fast Turnaround" }
    ]
  },
  {
    slug: "locksmith-ibag",
    title: "Locksmith Services",
    campaign_name: "Locksmith - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/locksmith.html",
    ad_groups: [
      { name: "Emergency Lockout Intent" },
      { name: "Lock Change Intent" },
      { name: "Key Making Intent" }
    ],
    keywords: [
      "locksmith near me", "emergency locksmith", "24 hour locksmith near me",
      "car lockout near me", "house lockout near me", "lock change near me",
      "key copy near me", "locksmith service near me", "auto locksmith near me"
    ],
    negative_keywords: ["locksmith training", "become locksmith", "lock for sale", "jobs", "how to pick lock"],
    match_distribution: { exact: 0.3, phrase: 0.45, broad_mod: 0.25 },
    max_cpc: 4.5,
    daily_budget: 130,
    ads: [{
      headline1: "Locksmith — 24/7 Emergency",
      headline2: "Locked Out? Fast Response",
      headline3: "Licensed & Insured",
      headline4: "Car, Home & Business",
      headline5: "Upfront Pricing",
      description1: "Emergency locksmith service 24/7. Car lockouts, home lockouts, lock changes & more.",
      description2: "Fast response. Upfront pricing. No hidden fees. Call now for immediate help."
    }],
    final_url: "https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_ibag",
    cta: "Call Now",
    sitelinks: [
      { text: "Car Lockout", description1: "Locked out of car?", description2: "Fast response", finalUrl: "https://adiology.online/locksmith/car" },
      { text: "Home Lockout", description1: "Get back inside", description2: "No damage", finalUrl: "https://adiology.online/locksmith/home" },
      { text: "Lock Change", description1: "New locks installed", description2: "Same day", finalUrl: "https://adiology.online/locksmith/change" },
      { text: "Key Copy", description1: "Fast key duplication", description2: "All key types", finalUrl: "https://adiology.online/locksmith/keys" }
    ],
    callouts: [
      { text: "24/7 Emergency" },
      { text: "Fast Response" },
      { text: "Upfront Pricing" },
      { text: "Licensed & Insured" }
    ]
  },
  {
    slug: "water-damage-restoration-ibag",
    title: "Water Damage Restoration",
    campaign_name: "Water Damage - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/water-damage.html",
    ad_groups: [
      { name: "Emergency Water Removal Intent" },
      { name: "Flood Damage Intent" },
      { name: "Mold Prevention Intent" }
    ],
    keywords: [
      "water damage restoration near me", "flood cleanup near me", "water removal near me",
      "emergency water damage", "basement flooding near me", "water damage repair near me",
      "flood restoration near me", "water extraction near me", "burst pipe cleanup"
    ],
    negative_keywords: ["water damage insurance claim", "DIY water damage", "how to dry", "jobs", "dehumidifier sale"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 6.0,
    daily_budget: 180,
    ads: [{
      headline1: "Water Damage Restoration — 24/7",
      headline2: "Fast Water Removal",
      headline3: "Emergency Flood Cleanup",
      headline4: "Insurance Claim Help",
      headline5: "Prevent Mold Growth",
      description1: "Emergency water damage restoration. Fast response, water extraction & drying.",
      description2: "Insurance claim assistance. Prevent mold damage. Call now for immediate help."
    }],
    final_url: "https://adiology.online/water-damage?utm_source=adiology&utm_medium=ads&utm_campaign=waterdamage_ibag",
    cta: "Call Now",
    sitelinks: [
      { text: "Water Removal", description1: "Fast extraction", description2: "24/7 emergency", finalUrl: "https://adiology.online/water-damage/removal" },
      { text: "Flood Cleanup", description1: "Complete restoration", description2: "Basement floods", finalUrl: "https://adiology.online/water-damage/flood" },
      { text: "Drying Services", description1: "Industrial equipment", description2: "Fast drying", finalUrl: "https://adiology.online/water-damage/drying" },
      { text: "Insurance Help", description1: "Claim assistance", description2: "Documentation", finalUrl: "https://adiology.online/water-damage/insurance" }
    ],
    callouts: [
      { text: "24/7 Emergency" },
      { text: "Fast Response" },
      { text: "Insurance Help" },
      { text: "Mold Prevention" }
    ]
  },
  {
    slug: "foundation-repair-stag",
    title: "Foundation Repair",
    campaign_name: "Foundation Repair - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/foundation.html",
    ad_groups: [
      { name: "Foundation Crack Repair" },
      { name: "Foundation Leveling" },
      { name: "Basement Waterproofing" }
    ],
    keywords: [
      "foundation repair near me", "foundation crack repair near me", "foundation leveling near me",
      "house foundation repair near me", "basement foundation repair", "foundation contractor near me",
      "slab foundation repair near me", "pier foundation repair", "foundation inspection near me"
    ],
    negative_keywords: ["foundation DIY", "how to fix foundation", "foundation jobs", "training"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 7.0,
    daily_budget: 200,
    ads: [{
      headline1: "Foundation Repair — Free Inspection",
      headline2: "Crack & Leveling Specialists",
      headline3: "Licensed Foundation Experts",
      headline4: "Transferable Warranty",
      headline5: "Financing Available",
      description1: "Professional foundation repair. Cracks, leveling, waterproofing & more.",
      description2: "Free inspection. Lifetime warranty. Protect your home's value. Call today."
    }],
    final_url: "https://adiology.online/foundation?utm_source=adiology&utm_medium=ads&utm_campaign=foundation_stag",
    cta: "Get Free Inspection",
    sitelinks: [
      { text: "Crack Repair", description1: "Fix foundation cracks", description2: "Prevent damage", finalUrl: "https://adiology.online/foundation/cracks" },
      { text: "Foundation Leveling", description1: "Stabilize your home", description2: "Expert solutions", finalUrl: "https://adiology.online/foundation/leveling" },
      { text: "Waterproofing", description1: "Stop water intrusion", description2: "Protect basement", finalUrl: "https://adiology.online/foundation/waterproofing" },
      { text: "Free Inspection", description1: "No obligation", description2: "Expert assessment", finalUrl: "https://adiology.online/foundation/inspection" }
    ],
    callouts: [
      { text: "Free Inspection" },
      { text: "Lifetime Warranty" },
      { text: "Financing Available" },
      { text: "Licensed Experts" }
    ]
  },
  {
    slug: "cabinet-installation-skag",
    title: "Cabinet Installation",
    campaign_name: "Cabinet Installation - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/cabinets.html",
    ad_groups: [
      { name: "kitchen cabinet installation near me" },
      { name: "cabinet refacing near me" },
      { name: "custom cabinets near me" },
      { name: "bathroom cabinet installation" }
    ],
    keywords: [
      "cabinet installation near me", "kitchen cabinet installation near me", "cabinet refacing near me",
      "custom cabinets near me", "bathroom cabinet installation", "cabinet contractor near me",
      "kitchen remodel cabinets near me", "cabinet maker near me"
    ],
    negative_keywords: ["cabinets for sale", "DIY cabinet", "how to install cabinet", "jobs", "cabinet hardware"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 4.0,
    daily_budget: 110,
    ads: [{
      headline1: "Cabinet Installation — Free Quote",
      headline2: "Kitchen & Bathroom Cabinets",
      headline3: "Custom & Refacing Options",
      headline4: "Licensed Cabinet Installers",
      headline5: "Quality Craftsmanship",
      description1: "Professional cabinet installation, refacing & custom cabinetry. Kitchen & bath experts.",
      description2: "Free in-home estimate. Transform your space. Quality materials. Call today."
    }],
    final_url: "https://adiology.online/cabinets?utm_source=adiology&utm_medium=ads&utm_campaign=cabinet_skag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Kitchen Cabinets", description1: "New installation", description2: "Custom designs", finalUrl: "https://adiology.online/cabinets/kitchen" },
      { text: "Cabinet Refacing", description1: "Update look", description2: "Save money", finalUrl: "https://adiology.online/cabinets/refacing" },
      { text: "Custom Cabinets", description1: "Made to order", description2: "Your style", finalUrl: "https://adiology.online/cabinets/custom" },
      { text: "Free Estimate", description1: "In-home consult", description2: "No obligation", finalUrl: "https://adiology.online/cabinets/estimate" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Licensed Installers" },
      { text: "Quality Materials" },
      { text: "Custom Options" }
    ]
  },
  {
    slug: "countertop-installation-stag",
    title: "Countertop Installation",
    campaign_name: "Countertop Installation - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/countertops.html",
    ad_groups: [
      { name: "Granite Countertops" },
      { name: "Quartz Countertops" },
      { name: "Marble Countertops" }
    ],
    keywords: [
      "countertop installation near me", "granite countertops near me", "quartz countertops near me",
      "marble countertops near me", "kitchen countertop replacement", "countertop contractor near me",
      "bathroom countertops near me", "countertop fabricator near me"
    ],
    negative_keywords: ["countertop for sale", "DIY countertop", "how to install countertop", "jobs", "countertop remnants"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 4.5,
    daily_budget: 130,
    ads: [{
      headline1: "Countertop Installation — Free Quote",
      headline2: "Granite, Quartz & Marble",
      headline3: "Professional Fabrication",
      headline4: "Transform Your Kitchen",
      headline5: "Fast Turnaround",
      description1: "Professional countertop installation. Granite, quartz, marble & more.",
      description2: "Free in-home measurement. Quality fabrication. Fast installation. Call today."
    }],
    final_url: "https://adiology.online/countertops?utm_source=adiology&utm_medium=ads&utm_campaign=countertop_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Granite", description1: "Natural stone beauty", description2: "Durable choice", finalUrl: "https://adiology.online/countertops/granite" },
      { text: "Quartz", description1: "Engineered stone", description2: "Low maintenance", finalUrl: "https://adiology.online/countertops/quartz" },
      { text: "Marble", description1: "Elegant & timeless", description2: "Premium option", finalUrl: "https://adiology.online/countertops/marble" },
      { text: "Free Estimate", description1: "In-home measurement", description2: "No obligation", finalUrl: "https://adiology.online/countertops/estimate" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Fast Installation" },
      { text: "Quality Materials" },
      { text: "Expert Fabrication" }
    ]
  },
  {
    slug: "insulation-installation-ibag",
    title: "Insulation Services",
    campaign_name: "Insulation - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/insulation.html",
    ad_groups: [
      { name: "Attic Insulation Intent" },
      { name: "Spray Foam Intent" },
      { name: "Energy Savings Intent" }
    ],
    keywords: [
      "insulation installation near me", "attic insulation near me", "spray foam insulation near me",
      "insulation contractor near me", "blown-in insulation near me", "home insulation near me",
      "insulation removal near me", "insulation company near me"
    ],
    negative_keywords: ["insulation for sale", "DIY insulation", "how to install insulation", "jobs", "fiberglass rolls"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Insulation Installation — Free Quote",
      headline2: "Lower Energy Bills",
      headline3: "Attic & Spray Foam Experts",
      headline4: "Licensed Insulation Pros",
      headline5: "Improve Home Comfort",
      description1: "Professional insulation installation. Attic, spray foam, blown-in & more.",
      description2: "Free energy assessment. Reduce heating & cooling costs. Call today."
    }],
    final_url: "https://adiology.online/insulation?utm_source=adiology&utm_medium=ads&utm_campaign=insulation_ibag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Attic Insulation", description1: "Improve efficiency", description2: "All attic types", finalUrl: "https://adiology.online/insulation/attic" },
      { text: "Spray Foam", description1: "Superior sealing", description2: "Energy savings", finalUrl: "https://adiology.online/insulation/spray-foam" },
      { text: "Blown-In", description1: "Quick install", description2: "Cost effective", finalUrl: "https://adiology.online/insulation/blown-in" },
      { text: "Free Assessment", description1: "Energy audit", description2: "No obligation", finalUrl: "https://adiology.online/insulation/assessment" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Energy Savings" },
      { text: "Licensed Pros" },
      { text: "Rebates Available" }
    ]
  },
  {
    slug: "home-security-mix",
    title: "Home Security",
    campaign_name: "Home Security - MIX",
    structure: "MIX",
    landing_page_url: "/landing-pages/security.html",
    ad_groups: [
      { name: "Security System Install" },
      { name: "Security Cameras" },
      { name: "Smart Home Security" }
    ],
    keywords: [
      "home security installation near me", "security system near me", "security cameras near me",
      "home alarm installation near me", "smart home security near me", "surveillance cameras near me",
      "home security company near me", "security monitoring near me"
    ],
    negative_keywords: ["security camera for sale", "DIY security", "how to install camera", "jobs", "cheap cameras"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 5.5,
    daily_budget: 160,
    ads: [{
      headline1: "Home Security — Free Quote",
      headline2: "Professional Installation",
      headline3: "24/7 Monitoring Available",
      headline4: "Smart Home Integration",
      headline5: "Protect Your Family",
      description1: "Professional home security installation. Alarms, cameras & smart systems.",
      description2: "Free security assessment. 24/7 monitoring options. Protect what matters. Call today."
    }],
    final_url: "https://adiology.online/security?utm_source=adiology&utm_medium=ads&utm_campaign=security_mix",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Security Systems", description1: "Complete protection", description2: "Pro installation", finalUrl: "https://adiology.online/security/systems" },
      { text: "Security Cameras", description1: "HD surveillance", description2: "Remote viewing", finalUrl: "https://adiology.online/security/cameras" },
      { text: "24/7 Monitoring", description1: "Always protected", description2: "Fast response", finalUrl: "https://adiology.online/security/monitoring" },
      { text: "Free Assessment", description1: "Security audit", description2: "No obligation", finalUrl: "https://adiology.online/security/assessment" }
    ],
    callouts: [
      { text: "Free Assessment" },
      { text: "24/7 Monitoring" },
      { text: "Smart Integration" },
      { text: "Pro Installation" }
    ]
  },
  {
    slug: "junk-removal-skag",
    title: "Junk Removal",
    campaign_name: "Junk Removal - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/junk-removal.html",
    ad_groups: [
      { name: "junk removal near me" },
      { name: "furniture removal near me" },
      { name: "appliance removal near me" },
      { name: "debris removal near me" },
      { name: "estate cleanout near me" }
    ],
    keywords: [
      "junk removal near me", "furniture removal near me", "appliance removal near me",
      "debris removal near me", "estate cleanout near me", "trash removal near me",
      "hauling service near me", "junk pickup near me", "same day junk removal"
    ],
    negative_keywords: ["junk car", "jobs", "how to dispose", "dumpster rental", "free junk removal"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 3.0,
    daily_budget: 90,
    ads: [{
      headline1: "Junk Removal — Same Day Service",
      headline2: "We Haul It All — Free Quote",
      headline3: "Fast & Affordable",
      headline4: "Furniture, Appliances & Debris",
      headline5: "Eco-Friendly Disposal",
      description1: "Professional junk removal service. Furniture, appliances, debris & more.",
      description2: "Same-day service available. Upfront pricing. Eco-friendly disposal. Call now."
    }],
    final_url: "https://adiology.online/junk-removal?utm_source=adiology&utm_medium=ads&utm_campaign=junk_skag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Furniture Removal", description1: "Old couches, beds", description2: "We do the lifting", finalUrl: "https://adiology.online/junk-removal/furniture" },
      { text: "Appliance Removal", description1: "Safe disposal", description2: "Fridges, washers", finalUrl: "https://adiology.online/junk-removal/appliances" },
      { text: "Estate Cleanout", description1: "Full cleanouts", description2: "Respectful service", finalUrl: "https://adiology.online/junk-removal/estate" },
      { text: "Same Day Service", description1: "Fast pickup", description2: "Call now", finalUrl: "https://adiology.online/junk-removal/same-day" }
    ],
    callouts: [
      { text: "Same Day Service" },
      { text: "Upfront Pricing" },
      { text: "Eco-Friendly" },
      { text: "We Do the Lifting" }
    ]
  },
  {
    slug: "pool-service-stag",
    title: "Pool Service",
    campaign_name: "Pool Service - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/pool.html",
    ad_groups: [
      { name: "Pool Cleaning" },
      { name: "Pool Repair" },
      { name: "Pool Maintenance" }
    ],
    keywords: [
      "pool service near me", "pool cleaning near me", "pool repair near me",
      "pool maintenance near me", "pool pump repair near me", "pool heater repair near me",
      "pool company near me", "weekly pool service near me"
    ],
    negative_keywords: ["pool for sale", "DIY pool", "pool supplies", "jobs", "how to clean pool"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 3.0,
    daily_budget: 85,
    ads: [{
      headline1: "Pool Service — Free Quote",
      headline2: "Cleaning, Repair & Maintenance",
      headline3: "Certified Pool Technicians",
      headline4: "Weekly Service Plans",
      headline5: "Crystal Clear Water",
      description1: "Professional pool service. Cleaning, chemical balance, repairs & equipment service.",
      description2: "Free estimate. Weekly & monthly plans available. Keep your pool perfect. Call today."
    }],
    final_url: "https://adiology.online/pool?utm_source=adiology&utm_medium=ads&utm_campaign=pool_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Pool Cleaning", description1: "Regular service", description2: "Crystal clear", finalUrl: "https://adiology.online/pool/cleaning" },
      { text: "Pool Repair", description1: "Pumps, heaters, more", description2: "Expert repair", finalUrl: "https://adiology.online/pool/repair" },
      { text: "Weekly Plans", description1: "Hassle-free", description2: "Consistent care", finalUrl: "https://adiology.online/pool/weekly" },
      { text: "Pool Opening", description1: "Seasonal service", description2: "Get swim ready", finalUrl: "https://adiology.online/pool/opening" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Certified Techs" },
      { text: "Weekly Plans" },
      { text: "Equipment Repair" }
    ]
  },
  {
    slug: "pressure-washing-skag",
    title: "Pressure Washing",
    campaign_name: "Pressure Washing - SKAG",
    structure: "SKAG",
    landing_page_url: "/landing-pages/pressure-washing.html",
    ad_groups: [
      { name: "pressure washing near me" },
      { name: "driveway cleaning near me" },
      { name: "house washing near me" },
      { name: "deck cleaning near me" }
    ],
    keywords: [
      "pressure washing near me", "power washing near me", "driveway pressure washing",
      "house washing near me", "deck cleaning near me", "patio cleaning near me",
      "pressure washing service near me", "commercial pressure washing"
    ],
    negative_keywords: ["pressure washer for sale", "DIY pressure washing", "rent pressure washer", "jobs", "how to pressure wash"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 2.5,
    daily_budget: 75,
    ads: [{
      headline1: "Pressure Washing — Free Quote",
      headline2: "Driveways, Decks & Houses",
      headline3: "Professional Power Washing",
      headline4: "Restore Your Property",
      headline5: "Affordable Rates",
      description1: "Professional pressure washing service. Driveways, decks, patios, siding & more.",
      description2: "Free estimates. Transform your property's appearance. Fast service. Call today."
    }],
    final_url: "https://adiology.online/pressure-washing?utm_source=adiology&utm_medium=ads&utm_campaign=pressure_skag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Driveway Cleaning", description1: "Remove stains", description2: "Look like new", finalUrl: "https://adiology.online/pressure-washing/driveway" },
      { text: "House Washing", description1: "Siding & exterior", description2: "Curb appeal", finalUrl: "https://adiology.online/pressure-washing/house" },
      { text: "Deck Cleaning", description1: "Restore wood", description2: "Remove mold", finalUrl: "https://adiology.online/pressure-washing/deck" },
      { text: "Free Estimate", description1: "No obligation", description2: "Fast quote", finalUrl: "https://adiology.online/pressure-washing/estimate" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Fast Service" },
      { text: "Eco-Friendly" },
      { text: "Affordable Rates" }
    ]
  },
  {
    slug: "handyman-services-mix",
    title: "Handyman Services",
    campaign_name: "Handyman - MIX",
    structure: "MIX",
    landing_page_url: "/landing-pages/handyman.html",
    ad_groups: [
      { name: "General Repairs" },
      { name: "Home Maintenance" },
      { name: "Small Projects" }
    ],
    keywords: [
      "handyman near me", "handyman services near me", "home repair near me",
      "local handyman near me", "fix it man near me", "odd jobs near me",
      "home maintenance near me", "small repairs near me"
    ],
    negative_keywords: ["handyman jobs", "become handyman", "handyman tools", "how to", "DIY"],
    match_distribution: { exact: 0.2, phrase: 0.55, broad_mod: 0.25 },
    max_cpc: 2.5,
    daily_budget: 70,
    ads: [{
      headline1: "Handyman Services — Call Now",
      headline2: "No Job Too Small",
      headline3: "Licensed & Reliable",
      headline4: "Home Repairs & Maintenance",
      headline5: "Same Day Available",
      description1: "Professional handyman services. Repairs, installations, maintenance & more.",
      description2: "Free estimates. Honest pricing. Get your to-do list done. Call today."
    }],
    final_url: "https://adiology.online/handyman?utm_source=adiology&utm_medium=ads&utm_campaign=handyman_mix",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Home Repairs", description1: "Fix anything", description2: "Skilled pros", finalUrl: "https://adiology.online/handyman/repairs" },
      { text: "Installations", description1: "TV mounting, shelves", description2: "Done right", finalUrl: "https://adiology.online/handyman/install" },
      { text: "Maintenance", description1: "Keep home perfect", description2: "Regular service", finalUrl: "https://adiology.online/handyman/maintenance" },
      { text: "Get Quote", description1: "Fast estimate", description2: "No obligation", finalUrl: "https://adiology.online/handyman/quote" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "No Job Too Small" },
      { text: "Licensed Pros" },
      { text: "Same Day Service" }
    ]
  },
  {
    slug: "glass-repair-ibag",
    title: "Glass Repair & Replacement",
    campaign_name: "Glass Repair - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/glass.html",
    ad_groups: [
      { name: "Window Glass Intent" },
      { name: "Door Glass Intent" },
      { name: "Emergency Glass Intent" }
    ],
    keywords: [
      "glass repair near me", "window glass repair near me", "glass replacement near me",
      "broken window repair near me", "door glass replacement near me", "emergency glass repair",
      "glass company near me", "storefront glass repair"
    ],
    negative_keywords: ["glass for sale", "DIY glass", "how to replace glass", "jobs", "glass cutter"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 3.5,
    daily_budget: 100,
    ads: [{
      headline1: "Glass Repair — Fast Service",
      headline2: "Window & Door Glass",
      headline3: "Emergency Service Available",
      headline4: "Licensed Glass Experts",
      headline5: "Free Estimates",
      description1: "Professional glass repair & replacement. Windows, doors, storefronts & more.",
      description2: "Fast service. Emergency repairs available. Quality glass. Call now."
    }],
    final_url: "https://adiology.online/glass?utm_source=adiology&utm_medium=ads&utm_campaign=glass_ibag",
    cta: "Call Now",
    sitelinks: [
      { text: "Window Glass", description1: "All window types", description2: "Fast repair", finalUrl: "https://adiology.online/glass/windows" },
      { text: "Door Glass", description1: "Patio, entry doors", description2: "Expert install", finalUrl: "https://adiology.online/glass/doors" },
      { text: "Emergency Glass", description1: "Broken glass?", description2: "Fast response", finalUrl: "https://adiology.online/glass/emergency" },
      { text: "Free Estimate", description1: "Quick quote", description2: "No obligation", finalUrl: "https://adiology.online/glass/estimate" }
    ],
    callouts: [
      { text: "Free Estimates" },
      { text: "Fast Service" },
      { text: "Emergency Repairs" },
      { text: "Quality Glass" }
    ]
  },
  {
    slug: "mold-remediation-ibag",
    title: "Mold Remediation",
    campaign_name: "Mold Remediation - IBAG",
    structure: "IBAG",
    landing_page_url: "/landing-pages/mold.html",
    ad_groups: [
      { name: "Mold Removal Intent" },
      { name: "Mold Testing Intent" },
      { name: "Black Mold Intent" }
    ],
    keywords: [
      "mold remediation near me", "mold removal near me", "mold inspection near me",
      "black mold removal near me", "mold testing near me", "mold cleanup near me",
      "mold abatement near me", "mold specialist near me"
    ],
    negative_keywords: ["mold killer spray", "DIY mold", "how to remove mold", "jobs", "mold test kit"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 5.5,
    daily_budget: 160,
    ads: [{
      headline1: "Mold Remediation — Free Inspection",
      headline2: "Certified Mold Specialists",
      headline3: "Safe & Thorough Removal",
      headline4: "Protect Your Health",
      headline5: "Insurance Claim Help",
      description1: "Professional mold remediation & testing. Certified specialists, safe removal.",
      description2: "Free mold inspection. Protect your family's health. Insurance claim help. Call today."
    }],
    final_url: "https://adiology.online/mold?utm_source=adiology&utm_medium=ads&utm_campaign=mold_ibag",
    cta: "Get Free Inspection",
    sitelinks: [
      { text: "Mold Testing", description1: "Identify mold types", description2: "Lab analysis", finalUrl: "https://adiology.online/mold/testing" },
      { text: "Mold Removal", description1: "Safe remediation", description2: "Thorough cleanup", finalUrl: "https://adiology.online/mold/removal" },
      { text: "Black Mold", description1: "Dangerous mold", description2: "Expert removal", finalUrl: "https://adiology.online/mold/black-mold" },
      { text: "Free Inspection", description1: "Assess your home", description2: "No obligation", finalUrl: "https://adiology.online/mold/inspection" }
    ],
    callouts: [
      { text: "Free Inspection" },
      { text: "Certified Pros" },
      { text: "Insurance Help" },
      { text: "Health Protection" }
    ]
  },
  {
    slug: "basement-waterproofing-stag",
    title: "Basement Waterproofing",
    campaign_name: "Basement Waterproofing - STAG",
    structure: "STAG",
    landing_page_url: "/landing-pages/waterproofing.html",
    ad_groups: [
      { name: "Interior Waterproofing" },
      { name: "Exterior Waterproofing" },
      { name: "Sump Pump Installation" }
    ],
    keywords: [
      "basement waterproofing near me", "waterproofing contractor near me", "wet basement repair",
      "basement leak repair near me", "sump pump installation near me", "basement sealing near me",
      "foundation waterproofing near me", "basement drainage near me"
    ],
    negative_keywords: ["waterproofing paint", "DIY waterproofing", "how to waterproof", "jobs", "sump pump for sale"],
    match_distribution: { exact: 0.25, phrase: 0.5, broad_mod: 0.25 },
    max_cpc: 6.0,
    daily_budget: 170,
    ads: [{
      headline1: "Basement Waterproofing — Free Quote",
      headline2: "Stop Leaks Permanently",
      headline3: "Licensed Waterproofing Experts",
      headline4: "Lifetime Warranty",
      headline5: "Financing Available",
      description1: "Professional basement waterproofing. Interior, exterior & sump pump solutions.",
      description2: "Free inspection. Lifetime warranty. Protect your basement. Call today."
    }],
    final_url: "https://adiology.online/waterproofing?utm_source=adiology&utm_medium=ads&utm_campaign=waterproofing_stag",
    cta: "Get Free Quote",
    sitelinks: [
      { text: "Interior Solutions", description1: "Drain systems", description2: "Vapor barriers", finalUrl: "https://adiology.online/waterproofing/interior" },
      { text: "Exterior Solutions", description1: "Foundation coating", description2: "Drainage", finalUrl: "https://adiology.online/waterproofing/exterior" },
      { text: "Sump Pumps", description1: "Installation & repair", description2: "Battery backup", finalUrl: "https://adiology.online/waterproofing/sump-pump" },
      { text: "Free Inspection", description1: "Assess your basement", description2: "No obligation", finalUrl: "https://adiology.online/waterproofing/inspection" }
    ],
    callouts: [
      { text: "Free Inspection" },
      { text: "Lifetime Warranty" },
      { text: "Financing Available" },
      { text: "Licensed Experts" }
    ]
  }
];

