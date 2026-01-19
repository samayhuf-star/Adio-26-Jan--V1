export interface VerticalProfile {
  name: string;
  description: string;
  wrongProcedures: string[];
  competitors: string[];
  diyModifiers: string[];
  budgetModifiers: string[];
  infoModifiers: string[];
  jobModifiers: string[];
  negativeOutcomeModifiers: string[];
  locationModifiers: string[];
  customCategories?: Record<string, {
    name: string;
    modifiers: string[];
    matchType: 'phrase' | 'exact' | 'broad';
    patterns: ('prefix' | 'suffix' | 'standalone')[];
  }>;
}

export const VERTICAL_PROFILES: Record<string, VerticalProfile> = {
  plastic_surgery: {
    name: 'Plastic Surgery / Cosmetic',
    description: 'Cosmetic surgery and aesthetic procedures',
    wrongProcedures: [
      'facelift', 'rhinoplasty', 'liposuction', 'breast augmentation', 'blepharoplasty',
      'otoplasty', 'brow lift', 'chin implant', 'neck lift', 'arm lift',
      'thigh lift', 'body lift', 'buttock augmentation', 'bbl', 'brazilian butt lift',
      'mommy makeover', 'tummy tuck', 'abdominoplasty', 'breast reduction', 'breast lift',
      'gynecomastia', 'labiaplasty', 'vaginoplasty', 'hair transplant', 'fat transfer'
    ],
    competitors: [],
    diyModifiers: [
      'exercises', 'workout', 'diet', 'massage', 'cream',
      'pills', 'supplements', 'natural remedies', 'home treatment', 'yoga',
      'weight loss', 'shapewear', 'waist trainer', 'compression', 'skin tightening cream',
      'firming lotion', 'cellulite treatment', 'stretch mark cream', 'scar cream', 'essential oils'
    ],
    budgetModifiers: [
      'cheap', 'affordable', 'low cost', 'discount', 'financing',
      'payment plan', 'mexico', 'abroad', 'overseas', 'medical tourism',
      'groupon', 'coupon', 'deal', 'sale', 'special offer'
    ],
    infoModifiers: [
      'cost', 'price', 'how much', 'average cost', 'price range',
      'before and after', 'photos', 'pictures', 'gallery', 'results',
      'recovery time', 'healing', 'downtime', 'pain level', 'risks',
      'complications', 'side effects', 'scars', 'reviews', 'ratings'
    ],
    jobModifiers: [
      'jobs', 'career', 'salary', 'training', 'school',
      'certification', 'residency', 'fellowship', 'medical school', 'become',
      'how to be', 'requirements', 'education', 'license', 'board certified'
    ],
    negativeOutcomeModifiers: [
      'botched', 'failed', 'gone wrong', 'disaster', 'horror story',
      'malpractice', 'lawsuit', 'death', 'died', 'complications',
      'infection', 'revision', 'fix', 'redo', 'corrective'
    ],
    locationModifiers: [
      'mexico', 'tijuana', 'cancun', 'colombia', 'medellin',
      'turkey', 'istanbul', 'thailand', 'bangkok', 'costa rica',
      'dominican republic', 'brazil', 'korea', 'overseas', 'abroad'
    ],
    customCategories: {
      non_surgical_alternatives: {
        name: 'Non-Surgical Alternatives',
        modifiers: [
          'non surgical', 'non invasive', 'without surgery', 'no surgery', 'alternative to',
          'botox', 'fillers', 'coolsculpting', 'kybella', 'laser',
          'ultherapy', 'thermage', 'sculptra', 'thread lift', 'pdo threads'
        ],
        matchType: 'phrase',
        patterns: ['prefix', 'suffix']
      }
    }
  },

  home_services: {
    name: 'Home Services',
    description: 'Plumbers, electricians, HVAC, roofers, etc.',
    wrongProcedures: [
      'plumber', 'electrician', 'hvac', 'roofer', 'painter',
      'landscaper', 'handyman', 'contractor', 'carpenter', 'mason',
      'flooring', 'siding', 'gutter', 'window', 'door',
      'fence', 'deck', 'patio', 'driveway', 'garage door'
    ],
    competitors: [],
    diyModifiers: [
      'diy', 'how to', 'tutorial', 'guide', 'step by step',
      'fix yourself', 'home repair', 'do it yourself', 'instructions', 'tips',
      'youtube', 'video', 'home depot', 'lowes', 'parts'
    ],
    budgetModifiers: [
      'cheap', 'cheapest', 'affordable', 'low cost', 'budget',
      'free estimate', 'free quote', 'discount', 'coupon', 'deal',
      'handyman', 'unlicensed', 'cash', 'under the table', 'bargain'
    ],
    infoModifiers: [
      'cost', 'price', 'how much', 'average cost', 'estimate',
      'quote', 'hourly rate', 'per hour', 'labor cost', 'materials cost',
      'reviews', 'ratings', 'bbb', 'complaints', 'license lookup'
    ],
    jobModifiers: [
      'jobs', 'hiring', 'career', 'salary', 'apprentice',
      'apprenticeship', 'training', 'school', 'license', 'certification',
      'union', 'journeyman', 'master', 'test', 'exam'
    ],
    negativeOutcomeModifiers: [
      'scam', 'fraud', 'ripoff', 'complaint', 'lawsuit',
      'bbb', 'warning', 'avoid', 'bad', 'terrible',
      'worst', 'nightmare', 'horror story', 'ripped off', 'overcharged'
    ],
    locationModifiers: [],
    customCategories: {
      parts_only: {
        name: 'Parts / Materials Only',
        modifiers: [
          'parts', 'supplies', 'materials', 'wholesale', 'buy',
          'order', 'purchase', 'for sale', 'online', 'store',
          'home depot', 'lowes', 'amazon', 'ebay', 'hardware store'
        ],
        matchType: 'phrase',
        patterns: ['prefix', 'suffix']
      }
    }
  },

  legal: {
    name: 'Legal Services',
    description: 'Lawyers, attorneys, law firms',
    wrongProcedures: [
      'personal injury', 'car accident', 'divorce', 'family law', 'criminal defense',
      'dui', 'dwi', 'bankruptcy', 'immigration', 'estate planning',
      'real estate', 'business law', 'corporate', 'intellectual property', 'patent',
      'trademark', 'employment', 'workers comp', 'medical malpractice', 'wrongful death'
    ],
    competitors: [],
    diyModifiers: [
      'diy', 'do it yourself', 'without lawyer', 'pro se', 'self represent',
      'forms', 'templates', 'legal zoom', 'rocket lawyer', 'nolo',
      'free forms', 'online forms', 'file yourself', 'how to file', 'guide'
    ],
    budgetModifiers: [
      'free', 'free consultation', 'pro bono', 'cheap', 'affordable',
      'low cost', 'payment plan', 'no fee', 'contingency', 'sliding scale',
      'legal aid', 'public defender', 'discount', 'budget', 'inexpensive'
    ],
    infoModifiers: [
      'cost', 'fee', 'fees', 'how much', 'average cost',
      'hourly rate', 'retainer', 'reviews', 'ratings', 'avvo',
      'martindale', 'super lawyers', 'best', 'top rated', 'rankings'
    ],
    jobModifiers: [
      'jobs', 'career', 'salary', 'law school', 'lsat',
      'bar exam', 'paralegal', 'legal assistant', 'clerk', 'intern',
      'associate', 'partner', 'hiring', 'employment', 'positions'
    ],
    negativeOutcomeModifiers: [
      'complaint', 'disciplinary', 'disbarred', 'suspended', 'malpractice',
      'lawsuit against', 'sued', 'scam', 'fraud', 'warning',
      'avoid', 'bad', 'terrible', 'worst', 'nightmare'
    ],
    locationModifiers: [],
    customCategories: {
      information_only: {
        name: 'Information / Definitions',
        modifiers: [
          'definition', 'meaning', 'what is', 'explained', 'law',
          'statute', 'code', 'regulation', 'rule', 'requirement',
          'wiki', 'wikipedia', 'article', 'information', 'learn about'
        ],
        matchType: 'phrase',
        patterns: ['prefix', 'suffix']
      }
    }
  },

  medical: {
    name: 'Medical / Healthcare',
    description: 'Doctors, dentists, clinics, medical practices',
    wrongProcedures: [
      'dentist', 'orthodontist', 'dermatologist', 'cardiologist', 'neurologist',
      'orthopedic', 'pediatrician', 'obgyn', 'psychiatrist', 'psychologist',
      'chiropractor', 'physical therapist', 'optometrist', 'ophthalmologist', 'ent',
      'urologist', 'gastroenterologist', 'oncologist', 'surgeon', 'radiologist'
    ],
    competitors: [],
    diyModifiers: [
      'home remedy', 'natural', 'herbal', 'holistic', 'alternative',
      'self treatment', 'otc', 'over the counter', 'supplements', 'vitamins',
      'essential oils', 'acupuncture', 'massage', 'yoga', 'meditation'
    ],
    budgetModifiers: [
      'free', 'cheap', 'affordable', 'low cost', 'discount',
      'no insurance', 'uninsured', 'cash pay', 'sliding scale', 'charity care',
      'community health', 'free clinic', 'payment plan', 'financing', 'medicaid'
    ],
    infoModifiers: [
      'symptoms', 'causes', 'treatment options', 'side effects', 'risks',
      'recovery', 'prognosis', 'diagnosis', 'test', 'what is',
      'reviews', 'ratings', 'healthgrades', 'zocdoc', 'vitals'
    ],
    jobModifiers: [
      'jobs', 'career', 'salary', 'school', 'degree',
      'residency', 'fellowship', 'certification', 'license', 'board',
      'nursing', 'medical assistant', 'technician', 'hiring', 'positions'
    ],
    negativeOutcomeModifiers: [
      'malpractice', 'lawsuit', 'complaint', 'death', 'died',
      'injured', 'harm', 'negligence', 'error', 'mistake',
      'warning', 'avoid', 'bad', 'terrible', 'worst'
    ],
    locationModifiers: [
      'abroad', 'overseas', 'medical tourism', 'mexico', 'india',
      'thailand', 'costa rica', 'travel for', 'destination', 'international'
    ],
    customCategories: {
      insurance_related: {
        name: 'Insurance / Coverage',
        modifiers: [
          'insurance', 'covered', 'coverage', 'medicare', 'medicaid',
          'in network', 'out of network', 'copay', 'deductible', 'prior authorization',
          'claim', 'denied', 'appeal', 'reimbursement', 'billing'
        ],
        matchType: 'phrase',
        patterns: ['prefix', 'suffix']
      }
    }
  },

  automotive: {
    name: 'Automotive Services',
    description: 'Auto repair, dealers, body shops',
    wrongProcedures: [
      'oil change', 'brake repair', 'transmission', 'engine repair', 'tire',
      'alignment', 'suspension', 'exhaust', 'muffler', 'ac repair',
      'battery', 'alternator', 'starter', 'radiator', 'tune up',
      'inspection', 'smog', 'emissions', 'body work', 'paint'
    ],
    competitors: [],
    diyModifiers: [
      'diy', 'how to', 'tutorial', 'guide', 'step by step',
      'fix yourself', 'home mechanic', 'do it yourself', 'youtube', 'video',
      'autozone', 'oreilly', 'napa', 'parts', 'tools'
    ],
    budgetModifiers: [
      'cheap', 'cheapest', 'affordable', 'low cost', 'budget',
      'discount', 'coupon', 'deal', 'special', 'used parts',
      'junkyard', 'salvage', 'rebuilt', 'refurbished', 'aftermarket'
    ],
    infoModifiers: [
      'cost', 'price', 'how much', 'average cost', 'estimate',
      'quote', 'labor rate', 'hourly', 'reviews', 'ratings',
      'yelp', 'google reviews', 'bbb', 'complaints', 'warranty'
    ],
    jobModifiers: [
      'jobs', 'career', 'salary', 'technician', 'mechanic',
      'training', 'school', 'certification', 'ase', 'apprentice',
      'hiring', 'employment', 'positions', 'openings', 'work as'
    ],
    negativeOutcomeModifiers: [
      'scam', 'ripoff', 'overcharged', 'complaint', 'lawsuit',
      'bbb', 'warning', 'avoid', 'bad', 'terrible',
      'worst', 'nightmare', 'lemon', 'fraud', 'dishonest'
    ],
    locationModifiers: [],
    customCategories: {
      parts_only: {
        name: 'Parts Only',
        modifiers: [
          'parts', 'oem', 'aftermarket', 'buy', 'order',
          'for sale', 'online', 'store', 'amazon', 'ebay',
          'rockauto', 'autozone', 'oreilly', 'napa', 'advance auto'
        ],
        matchType: 'phrase',
        patterns: ['prefix', 'suffix']
      }
    }
  }
};

export function getVerticalModifiers(verticalKey: string): Record<string, string[]> {
  const profile = VERTICAL_PROFILES[verticalKey];
  if (!profile) return {};

  return {
    diy: profile.diyModifiers,
    budget: profile.budgetModifiers,
    info_seeker: profile.infoModifiers,
    job_seeker: profile.jobModifiers,
    negative_outcome: profile.negativeOutcomeModifiers,
    wrong_location: profile.locationModifiers,
    wrong_procedure: profile.wrongProcedures,
    competitor: profile.competitors
  };
}

export function getVerticalCustomCategories(verticalKey: string): Record<string, {
  name: string;
  modifiers: string[];
  matchType: 'phrase' | 'exact' | 'broad';
  patterns: ('prefix' | 'suffix' | 'standalone')[];
}> {
  const profile = VERTICAL_PROFILES[verticalKey];
  return profile?.customCategories || {};
}

export function getAllVerticals(): { key: string; name: string; description: string }[] {
  return Object.entries(VERTICAL_PROFILES).map(([key, profile]) => ({
    key,
    name: profile.name,
    description: profile.description
  }));
}
