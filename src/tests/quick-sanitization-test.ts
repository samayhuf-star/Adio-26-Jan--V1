import { sanitizeAdText } from '../utils/googleAdsRules.js';

console.log('Testing repetitive word removal:');
console.log('Input: "BEST BEST SERVICE"');
console.log('Output:', sanitizeAdText('BEST BEST SERVICE'));
console.log('Expected: "Best Service"');

console.log('\nTesting multiple repetitions:');
console.log('Input: "Best Best Best Service"');
console.log('Output:', sanitizeAdText('Best Best Best Service'));
console.log('Expected: "Best Service"');