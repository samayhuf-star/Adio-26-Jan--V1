import { validateRSA } from '../utils/googleAdsRules.js';

// Test maximum RSA
const maxHeadlines = Array.from({length: 15}, (_, i) => `Headline ${i + 1}`);
const maxDescriptions = Array.from({length: 4}, (_, i) => `Description ${i + 1}`);

console.log('Headlines:', maxHeadlines.length);
console.log('Descriptions:', maxDescriptions.length);

const result = validateRSA(maxHeadlines, maxDescriptions);
console.log('Valid:', result.valid);
console.log('Headline errors:', result.headlineErrors);
console.log('Description errors:', result.descriptionErrors);
console.log('Warnings:', result.warnings);