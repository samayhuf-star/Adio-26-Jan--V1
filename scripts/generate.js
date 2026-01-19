const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

// Register Handlebars helpers
Handlebars.registerHelper('times', function(n, block) {
    let accum = '';
    for (let i = 0; i < n; ++i) {
        accum += block.fn(i);
    }
    return accum;
});

// Load templates
const templatePath = path.join(__dirname, '../templates/template.html');
const policyTemplatePath = path.join(__dirname, '../templates/policy-template.html');
const themesPath = path.join(__dirname, '../templates/themes.json');

// Load themes
const themes = JSON.parse(fs.readFileSync(themesPath, 'utf8'));

// Compile templates
const mainTemplate = Handlebars.compile(fs.readFileSync(templatePath, 'utf8'));
const policyTemplate = Handlebars.compile(fs.readFileSync(policyTemplatePath, 'utf8'));

// Function to get theme colors
function getThemeColors(themeId) {
    const theme = themes.themes.find(t => t.id === themeId);
    if (!theme) {
        console.warn(`Theme ${themeId} not found, using green-edge`);
        return themes.themes[0];
    }
    return theme;
}

// Function to generate HTML from manifest
function generateHTML(manifest) {
    // Get theme colors
    const theme = getThemeColors(manifest.themeId || 'green-edge');
    
    // Merge theme colors into manifest
    const data = {
        ...manifest,
        accent: theme.accent,
        accentAlt: theme.accentAlt,
        accentLight: theme.accentLight,
        accentDark: theme.accentDark,
        bgHero: manifest.hero_image ? `url('${manifest.hero_image}')` : theme.bgHero,
        textPrimary: theme.textPrimary,
        textSecondary: theme.textSecondary,
        bgPrimary: theme.bgPrimary,
        bgSecondary: theme.bgSecondary,
    };

    return mainTemplate(data);
}

// Function to generate policy page
function generatePolicyPage(manifest, policyType, content) {
    const theme = getThemeColors(manifest.themeId || 'green-edge');
    
    const data = {
        policyType: policyType === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
        businessName: manifest.title,
        lastUpdated: manifest.policies[policyType]?.lastUpdated || new Date().toISOString().split('T')[0],
        content: content,
        accent: theme.accent,
        accentAlt: theme.accentAlt,
        contact: manifest.contact,
    };

    return policyTemplate(data);
}

// Main generation function
async function generateTemplates() {
    const manifestsPath = path.join(__dirname, '../templates/manifests');
    const distPath = path.join(__dirname, '../dist');
    
    // Ensure directories exist
    await fs.ensureDir(manifestsPath);
    await fs.ensureDir(distPath);
    
    // Check if manifests directory has files
    const manifestFiles = await fs.readdir(manifestsPath);
    
    if (manifestFiles.length === 0) {
        console.log('No manifest files found. Creating sample manifest...');
        // Create a sample manifest
        const sampleManifest = {
            slug: 'lawn-care',
            title: 'GreenEdge Lawn Care',
            themeId: 'green-edge',
            hero: {
                heading: 'Professional Lawn Care Services',
                subheading: 'Transform your yard with expert lawn care and landscaping',
                ctaText: 'Get Free Quote'
            },
            hero_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
            features: {
                heading: 'Why Choose GreenEdge',
                items: [
                    { icon: '🌱', title: 'Expert Care', desc: 'Professional lawn care specialists' },
                    { icon: '💚', title: 'Eco-Friendly', desc: 'Sustainable and green solutions' },
                    { icon: '⚡', title: 'Fast Service', desc: 'Quick response times' },
                    { icon: '✅', title: 'Satisfaction Guaranteed', desc: '100% satisfaction guarantee' }
                ]
            },
            services: {
                heading: 'Our Services',
                subheading: 'Complete lawn care solutions',
                items: [
                    {
                        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
                        title: 'Lawn Mowing',
                        desc: 'Regular lawn mowing and trimming',
                        price: 'From $59/visit'
                    },
                    {
                        image: 'https://images.unsplash.com/photo-1599629954294-2f46e0b87b02?w=400&h=300&fit=crop',
                        title: 'Landscape Design',
                        desc: 'Custom landscape design services',
                        price: 'From $499'
                    },
                    {
                        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
                        title: 'Hardscaping',
                        desc: 'Patios, walkways, and retaining walls',
                        price: 'Custom Quote'
                    }
                ]
            },
            testimonials: {
                heading: 'What Our Customers Say',
                items: [
                    {
                        name: 'John Smith',
                        company: 'Homeowner',
                        rating: 5,
                        text: 'Excellent service! Our lawn has never looked better.',
                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
                    },
                    {
                        name: 'Sarah Johnson',
                        company: 'Property Manager',
                        rating: 5,
                        text: 'Professional and reliable. Highly recommend!',
                        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
                    }
                ]
            },
            cta: {
                heading: 'Ready to Transform Your Lawn?',
                subheading: 'Contact us today for a free consultation',
                ctaText: 'Call Now'
            },
            contact: {
                phone: '+1-800-GREEN-GO',
                email: 'info@greenedge.com',
                hours: 'Mon-Sat: 7AM-6PM'
            },
            footer: {
                companyName: 'GreenEdge Lawn Care',
                tagline: 'Creating Beautiful Outdoor Spaces',
                address: '123 Garden Lane, Your City, ST 12345',
                links: [
                    { text: 'Privacy Policy', href: '/policies/privacy.html' },
                    { text: 'Terms of Service', href: '/policies/terms.html' },
                    { text: 'Services', href: '#services' }
                ],
                copyright: `© ${new Date().getFullYear()} GreenEdge Lawn Care. All rights reserved.`
            },
            seo: {
                title: 'GreenEdge Lawn Care - Professional Lawn Care Services',
                description: 'Professional lawn care and landscaping services. Expert mowing, design, and hardscaping.',
                keywords: 'lawn care, landscaping, lawn mowing, landscape design'
            },
            policies: {
                privacy: {
                    lastUpdated: new Date().toISOString().split('T')[0],
                    content: '<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>'
                },
                terms: {
                    lastUpdated: new Date().toISOString().split('T')[0],
                    content: '<h2>Terms of Service</h2><p>By using our services...</p>'
                }
            }
        };
        
        await fs.writeJSON(path.join(manifestsPath, 'lawn-care.json'), sampleManifest, { spaces: 2 });
        console.log('Created sample manifest: lawn-care.json');
    }
    
    // Read all manifest files
    const jsonFiles = manifestFiles.filter(f => f.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
        console.log('No JSON manifest files found in manifests directory.');
        return;
    }
    
    console.log(`Found ${jsonFiles.length} manifest file(s). Generating templates...`);
    
    // Process each manifest
    for (const file of jsonFiles) {
        const manifestPath = path.join(manifestsPath, file);
        const manifest = await fs.readJSON(manifestPath);
        
        console.log(`Generating template for: ${manifest.slug || manifest.title}`);
        
        // Generate main page
        const html = generateHTML(manifest);
        const outputDir = path.join(distPath, manifest.slug);
        await fs.ensureDir(outputDir);
        await fs.writeFile(path.join(outputDir, 'index.html'), html);
        
        // Generate policy pages
        const policiesDir = path.join(outputDir, 'policies');
        await fs.ensureDir(policiesDir);
        
        if (manifest.policies?.privacy) {
            const privacyHTML = generatePolicyPage(manifest, 'privacy', manifest.policies.privacy.content);
            await fs.writeFile(path.join(policiesDir, 'privacy.html'), privacyHTML);
        }
        
        if (manifest.policies?.terms) {
            const termsHTML = generatePolicyPage(manifest, 'terms', manifest.policies.terms.content);
            await fs.writeFile(path.join(policiesDir, 'terms.html'), termsHTML);
        }
        
        console.log(`✓ Generated: ${outputDir}`);
    }
    
    console.log(`\n✅ Generated ${jsonFiles.length} template(s) successfully!`);
    console.log(`Output directory: ${distPath}`);
}

// Run generator
if (require.main === module) {
    generateTemplates().catch(console.error);
}

module.exports = { generateTemplates, generateHTML, generatePolicyPage };

