/**
 * Auto-fill utility for testing - randomly fills form inputs with realistic data
 */

// Sample data pools
const BUSINESS_NAMES = [
    'Plumbing Pro', 'Tech Solutions', 'Home Services', 'Quick Fix', 'Expert Repairs',
    'Premium Services', 'Local Experts', '24/7 Support', 'Fast Response', 'Quality Care'
];

const KEYWORDS = [
    'plumber near me', 'emergency plumbing', 'drain cleaning', 'water heater repair',
    'airline number', 'contact airline', 'delta phone', 'united customer service',
    'electrician', 'hvac repair', 'roofing services', 'landscaping'
];

const NEGATIVE_KEYWORDS = [
    'free', 'cheap', 'discount', 'job', 'career', 'hiring', 'reviews', 'scam',
    'information', 'when', 'why', 'where', 'how', 'best', 'worst'
];

const CITIES = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville'
];

const STATES = [
    'California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania',
    'Ohio', 'Georgia', 'North Carolina', 'Michigan'
];

const ZIP_CODES = [
    '10001', '90210', '60601', '77001', '85001', '19101',
    '78201', '92101', '75201', '95101', '78701', '32201'
];

const PHONE_NUMBERS = [
    '(555) 123-4567', '(555) 234-5678', '(555) 345-6789', '(555) 456-7890',
    '1-800-555-1234', '1-888-555-5678'
];

const URLS = [
    'https://www.example.com', 'https://www.plumbingservices.com', 'https://www.homeservices.com',
    'https://www.quickfix.com', 'https://www.experts.com', 'https://www.localpros.com'
];

const HEADLINES = [
    'Get Professional Service Today', 'Fast & Reliable Solutions', 'Expert Help Available 24/7',
    'Quality Service You Can Trust', 'Call Now for Free Quote', 'Same Day Service Available',
    'Licensed & Insured Professionals', 'Satisfaction Guaranteed', 'Top Rated Service',
    'Emergency Service Available'
];

const DESCRIPTIONS = [
    'Professional service you can trust. Call now for immediate assistance.',
    'Fast, reliable, and affordable. Get your problem solved today.',
    'Expert technicians ready to help. Available 24/7 for your convenience.',
    'Quality workmanship guaranteed. Contact us for a free estimate.',
    'Licensed professionals with years of experience. Satisfaction guaranteed.'
];

/**
 * Get random item from array
 */
function randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array
 */
function randomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Generate random campaign name
 */
export function generateCampaignName(): string {
    const business = randomItem(BUSINESS_NAMES);
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${business} Campaign - ${day}${month} ${hour}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Generate random seed keywords
 */
export function generateSeedKeywords(): string {
    return randomItems(KEYWORDS, 3).join(', ');
}

/**
 * Generate random negative keywords
 */
export function generateNegativeKeywords(): string {
    return randomItems(NEGATIVE_KEYWORDS, 8).join('\n');
}

/**
 * Generate random URL
 */
export function generateURL(): string {
    return randomItem(URLS);
}

/**
 * Generate random phone number
 */
export function generatePhoneNumber(): string {
    return randomItem(PHONE_NUMBERS);
}

/**
 * Generate random location input
 */
export function generateLocationInput(type: 'ZIP' | 'CITY' | 'STATE'): string {
    if (type === 'ZIP') {
        return randomItems(ZIP_CODES, 3).join(', ');
    } else if (type === 'CITY') {
        return randomItems(CITIES, 3).join(', ');
    } else {
        return randomItems(STATES, 2).join(', ');
    }
}

/**
 * Generate random headlines
 */
export function generateHeadlines(count: number = 5): string[] {
    return randomItems(HEADLINES, count);
}

/**
 * Generate random descriptions
 */
export function generateDescriptions(count: number = 2): string[] {
    return randomItems(DESCRIPTIONS, count);
}

/**
 * Auto-fill all inputs in a form by finding input elements and filling them
 */
export function autoFillForm(): void {
    // Find all input elements
    const inputs = document.querySelectorAll('input[type="text"], input[type="url"], input[type="email"], textarea');
    
    inputs.forEach((input) => {
        const element = input as HTMLInputElement | HTMLTextAreaElement;
        const placeholder = element.placeholder?.toLowerCase() || '';
        const name = element.name?.toLowerCase() || '';
        const id = element.id?.toLowerCase() || '';
        const label = element.closest('label')?.textContent?.toLowerCase() || '';
        const parentText = element.closest('div')?.textContent?.toLowerCase() || '';
        
        const combinedText = `${placeholder} ${name} ${id} ${label} ${parentText}`;
        
        // Skip if already has value
        if (element.value && element.value.trim()) {
            return;
        }
        
        // Determine what to fill based on context
        if (combinedText.includes('campaign name') || combinedText.includes('name')) {
            element.value = generateCampaignName();
        } else if (combinedText.includes('keyword') && !combinedText.includes('negative')) {
            element.value = generateSeedKeywords();
        } else if (combinedText.includes('negative')) {
            element.value = generateNegativeKeywords();
        } else if (combinedText.includes('url') || combinedText.includes('website') || combinedText.includes('link')) {
            element.value = generateURL();
        } else if (combinedText.includes('phone') || combinedText.includes('call')) {
            element.value = generatePhoneNumber();
        } else if (combinedText.includes('location') || combinedText.includes('geo') || combinedText.includes('zip') || combinedText.includes('city') || combinedText.includes('state')) {
            // Try to detect type from context
            let type: 'ZIP' | 'CITY' | 'STATE' = 'ZIP';
            if (combinedText.includes('city')) type = 'CITY';
            else if (combinedText.includes('state')) type = 'STATE';
            element.value = generateLocationInput(type);
        } else if (combinedText.includes('headline')) {
            element.value = randomItem(HEADLINES);
        } else if (combinedText.includes('description')) {
            element.value = randomItem(DESCRIPTIONS);
        } else if (element.tagName === 'TEXTAREA') {
            // For textareas, fill with multiple lines if it seems like keywords
            if (combinedText.includes('keyword')) {
                element.value = generateSeedKeywords();
            } else {
                element.value = randomItem(DESCRIPTIONS);
            }
        } else {
            // Generic text input
            element.value = `${randomItem(BUSINESS_NAMES)} ${randomItem(['Service', 'Solutions', 'Experts', 'Pro'])}`;
        }
        
        // Trigger input event to update React state
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
        element.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Also handle select elements
    const selects = document.querySelectorAll('select');
    selects.forEach((select) => {
        const element = select as HTMLSelectElement;
        if (element.options.length > 1 && !element.value) {
            // Select a random option (skip first if it's empty/placeholder)
            const startIndex = element.options[0].value === '' ? 1 : 0;
            const randomIndex = Math.floor(Math.random() * (element.options.length - startIndex)) + startIndex;
            element.selectedIndex = randomIndex;
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

