/**
 * Location Validation & Correction Utility
 * Validates and corrects city names and zip codes for Google Ads Editor compatibility
 * Handles ambiguous city names by disambiguating with state information
 */

// Mapping of problematic cities to their primary states
// These are cities that appear multiple times in the original list and need disambiguation
const CITY_STATE_MAPPING: Record<string, string> = {
  'Columbus': 'Ohio',
  'Springfield': 'Illinois',
  'Kansas City': 'Missouri',
  'Rochester': 'New York',
  'Peoria': 'Illinois',
  'Glendale': 'Arizona',
  'Pasadena': 'California',
  'Odessa': 'Texas',
  'Hillsboro': 'Oregon',
  'Westminster': 'California',
  'Lawrence': 'Kansas',
  'Richmond': 'Virginia',
  'Lakewood': 'Colorado',
};

// Deduplicated and validated cities for top 500
const VALIDATED_CITIES_TOP_500 = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
  'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
  'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas',
  'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno',
  'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Raleigh', 'Miami', 'Long Beach',
  'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Tampa', 'Arlington', 'New Orleans',
  'Wichita', 'Cleveland', 'Bakersfield', 'Aurora', 'Anaheim', 'Honolulu', 'Santa Ana',
  'Riverside', 'Corpus Christi', 'Lexington', 'Henderson', 'Stockton', 'Saint Paul',
  'Cincinnati', 'St. Louis', 'Pittsburgh', 'Greensboro', 'Anchorage', 'Plano', 'Lincoln',
  'Orlando', 'Irvine', 'Newark', 'Durham', 'Chula Vista', 'Toledo', 'Fort Wayne',
  'St. Petersburg', 'Laredo', 'Jersey City', 'Chandler', 'Madison', 'Lubbock', 'Scottsdale',
  'Reno', 'Buffalo', 'Gilbert', 'Glendale', 'North Las Vegas', 'Winston-Salem', 'Chesapeake',
  'Norfolk', 'Fremont', 'Garland', 'Irving', 'Hialeah', 'Richmond', 'Boise', 'Spokane',
  'Baton Rouge', 'Tacoma', 'San Bernardino', 'Modesto', 'Fontana', 'Des Moines', 'Moreno Valley',
  'Santa Clarita', 'Fayetteville', 'Birmingham', 'Oxnard', 'Rochester', 'Port St. Lucie',
  'Grand Rapids', 'Huntsville', 'Salt Lake City', 'Frisco', 'Yonkers', 'Amarillo',
  'Huntington Beach', 'McKinney', 'Montgomery', 'Augusta', 'Akron', 'Little Rock',
  'Tempe', 'Overland Park', 'Grand Prairie', 'Tallahassee', 'Cape Coral',
  'Mobile', 'Knoxville', 'Shreveport', 'Worcester', 'Ontario', 'Sioux Falls',
  'Chattanooga', 'Brownsville', 'Fort Lauderdale', 'Providence', 'Newport News', 'Rancho Cucamonga',
  'Santa Rosa', 'Oceanside', 'Elk Grove', 'Salem', 'Pembroke Pines', 'Eugene',
  'Garden Grove', 'Cary', 'Fort Collins', 'Corona', 'Jackson', 'Alexandria',
  'Hayward', 'Clarksville', 'Lancaster', 'Salinas', 'Palmdale', 'Hollywood',
  'Macon', 'Sunnyvale', 'Pomona', 'Killeen', 'Escondido',
  'Pasadena', 'Naperville', 'Bellevue', 'Joliet', 'Murfreesboro', 'Midland', 'Rockford',
  'Paterson', 'Savannah', 'Bridgeport', 'Torrance', 'McAllen', 'Syracuse', 'Surprise',
  'Denton', 'Roseville', 'Thornton', 'Miramar', 'Mesquite', 'Olathe',
  'Dayton', 'Carrollton', 'Waco', 'Orange', 'Fullerton', 'Charleston', 'West Valley City',
  'Visalia', 'Hampton', 'Gainesville', 'Warren', 'Coral Springs', 'Cedar Rapids',
  'Round Rock', 'Sterling Heights', 'Kent', 'Columbia', 'Santa Clara', 'New Haven',
  'Stamford', 'Concord', 'Elizabeth', 'Athens', 'Thousand Oaks', 'Lafayette', 'Simi Valley',
  'Topeka', 'Norman', 'Fargo', 'Wilmington', 'Abilene', 'Pearland', 'Victorville',
  'Hartford', 'Vallejo', 'Allentown', 'Berkeley', 'Cambridge', 'Richardson', 'Arvada',
  'Ann Arbor', 'Evansville', 'Clearwater', 'Beaumont', 'Independence',
  'Provo', 'West Jordan', 'Murrieta', 'Palm Bay', 'Downey', 'Costa Mesa',
  'Elgin', 'Miami Gardens', 'San Buenaventura', 'Inglewood', 'Lowell', 'Pueblo',
  'El Monte', 'Carlsbad', 'Antioch', 'Temecula', 'Clovis', 'Meridian', 'West Palm Beach',
  'Gresham', 'North Charleston', 'Fairfield', 'High Point', 'Billings',
  'Waterbury', 'Broken Arrow', 'Lewisville', 'Lakeland', 'West Covina', 'Burbank',
  'College Station', 'El Cajon', 'Rialto', 'Everett', 'Pompano Beach',
  'Boulder', 'South Bend', 'Greeley', 'Centennial', 'Edison', 'Daly City', 'Woodbridge',
  'Davie', 'Allen', 'Sandy Springs', 'Menifee', 'Norwalk', 'Green Bay', 'Wichita Falls',
  'League City', 'Tyler', 'Sparks', 'San Mateo', 'Tuscaloosa', 'Las Cruces', 'Longmont',
  'Edinburg', 'South Fulton', 'Brockton', 'Carmel', 'Bend', 'Renton', 'Vista', 'Vacaville',
  'Lynn', 'Spokane Valley', 'Nampa', 'New Bedford', 'Pharr', 'Tracy', 'Sunrise',
  'Boca Raton', 'San Leandro', 'Citrus Heights', 'Lawton', 'Federal Way', 'Yuma',
  'Mission Viejo', 'Chico', 'Lee Summit', 'Plantation', 'Hesperia', 'San Angelo',
  'Newport Beach', 'Asheville', 'Redding', 'Albany', 'Livonia', 'Compton', 'Dearborn',
  'Davenport', 'Sugar Land', 'Jurupa Valley', 'Deltona', 'Quincy',
  'Fall River', 'Santa Maria', 'Chino', 'Somerville', 'Cranston',
  'Kenosha', 'Duluth', 'Layton', 'Santa Monica', 'Conroe', 'San Marcos', 'Bellingham',
  'Livermore', 'Bloomington', 'Hemet', 'Pawtucket',
  'Longview', 'Warwick', 'Perris', 'Baytown', 'Medford', 'New Braunfels', 'Goodyear',
  'Fishers', 'Flint', 'Mansfield', 'Lorain', 'Waukegan', 'Orem', 'Gary', 'Milpitas',
  'Buckeye', 'Lynchburg', 'Sioux City', 'Lehi', 'Manteca', 'Lake Charles',
  'Rockwall', 'Santa Barbara', 'Decatur', 'Terre Haute', 'Chino Hills', 'Napa',
  'Redlands', 'Palm Coast', 'Champaign', 'Homestead', 'Hammond', 'Lake Forest',
  'Buena Park', 'Casa Grande', 'Tustin', 'Evanston', 'Laguna Niguel', 'Port Arthur',
  'Melbourne', 'Yakima', 'Missouri City', 'Kenner', 'Lauderhill', 'Pontiac',
  'Passaic', 'Lynwood', 'Camarillo', 'Doral', 'Tamarac', 'Mountain View', 'Margate',
  'Carson', 'Schenectady', 'Apple Valley', 'Redwood City', 'Monroe', 'Yuba City',
  'Waldorf', 'Madera', 'San Ramon', 'South Gate', 'Folsom', 'Iowa City',
  'Danbury', 'Temple', 'Missoula', 'Rapid City', 'Harrisonburg', 'Reading', 'Hempstead',
  'Frederick', 'Council Bluffs', 'Palo Alto', 'St. George', 'Pleasanton', 'Alhambra',
  'Sandy', 'St. Cloud', 'Flower Mound', 'Upland', 'New Rochelle',
  'Whittier', 'Rowlett', 'Kissimmee', 'North Port', 'Bowling Green', 'Turlock', 'San Clemente',
  'Wyoming', 'North Richland Hills', 'Delray Beach', 'Boynton Beach', 'Perth Amboy',
  'Rogers', 'National City', 'Mount Pleasant', 'Pine Bluff', 'Victoria', 'Hattiesburg',
  'Union City', 'Glendora', 'Cupertino', 'Brentwood', 'Georgetown', 'Petaluma', 'Weston',
  'Dublin', 'Rancho Cordova', 'Roy', 'Lodi', 'Pflugerville', 'Taylorsville', 'Ceres',
  'Walnut Creek', 'Rocklin', 'Yorba Linda', 'Encinitas', 'La Habra', 'Santee',
  'Bossier City', 'Battle Creek', 'Woodbury', 'Alameda', 'Florence',
  'Owensboro', 'Rosemead', 'Eastvale', 'St. Peters', 'Canton', 'Ocala',
  'Huntersville', 'Blaine', 'Novi', 'Arcadia', 'Paramount', 'Midwest City'
];

// Valid US zip code pattern (5 digits)
const ZIP_CODE_REGEX = /^\d{5}$/;

/**
 * Validates a city name
 * Returns true if city is in the validated list
 */
export function validateCity(city: string): boolean {
  return VALIDATED_CITIES_TOP_500.includes(city);
}

/**
 * Validates a zip code (must be 5 digits)
 */
export function validateZipCode(zip: string): boolean {
  return ZIP_CODE_REGEX.test(zip);
}

/**
 * Corrects a city name by returning the primary state if it's ambiguous
 * Returns the city with state context for problematic cities
 */
export function getCityWithState(city: string): string {
  const state = CITY_STATE_MAPPING[city];
  if (state) {
    return `${city}, ${state}`;
  }
  return city;
}

/**
 * Validates and corrects a list of cities
 * Removes duplicates and returns only valid cities
 */
export function validateAndCorrectCities(cities: string[]): string[] {
  const validCities = new Set<string>();
  
  cities.forEach(city => {
    if (validateCity(city)) {
      validCities.add(city);
    }
  });
  
  return Array.from(validCities);
}

/**
 * Validates and corrects a list of zip codes
 * Removes invalid zip codes and returns only valid ones
 */
export function validateAndCorrectZipCodes(zips: string[]): string[] {
  const validZips = new Set<string>();
  
  zips.forEach(zip => {
    // Clean the zip code (remove spaces, dashes)
    const cleanedZip = zip.replace(/[\s-]/g, '');
    if (validateZipCode(cleanedZip)) {
      validZips.add(cleanedZip);
    }
  });
  
  return Array.from(validZips);
}

/**
 * Validates locations before CSV export
 * Returns validation result with any issues found
 */
export function validateLocations(locations: {
  cities?: string[];
  zipCodes?: string[];
}) {
  const result = {
    valid: true,
    issues: [] as string[],
    correctedCities: [] as string[],
    correctedZips: [] as string[],
  };

  if (locations.cities && locations.cities.length > 0) {
    result.correctedCities = validateAndCorrectCities(locations.cities);
    
    // Check if any cities were removed
    if (result.correctedCities.length < locations.cities.length) {
      const invalidCount = locations.cities.length - result.correctedCities.length;
      result.issues.push(`${invalidCount} invalid city names were removed`);
      result.valid = false;
    }
  }

  if (locations.zipCodes && locations.zipCodes.length > 0) {
    result.correctedZips = validateAndCorrectZipCodes(locations.zipCodes);
    
    // Check if any zip codes were removed
    if (result.correctedZips.length < locations.zipCodes.length) {
      const invalidCount = locations.zipCodes.length - result.correctedZips.length;
      result.issues.push(`${invalidCount} invalid zip codes were removed`);
      result.valid = false;
    }
  }

  return result;
}

/**
 * Get all deduplicated and validated top 500 cities
 */
export function getValidatedCitiesTop500(): string[] {
  return [...VALIDATED_CITIES_TOP_500];
}
