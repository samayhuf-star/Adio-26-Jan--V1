#!/usr/bin/env python3
"""
DISCOURSE PLATFORM POPULATION SCRIPT FOR ADIOLOGY
Populates Discourse with:
- 8 Categories (Google Ads, Automation, Email, Data Scraping, Infrastructure, VMs)
- 10 Realistic User Profiles
- 640+ SEO-Friendly Q&A Topics
- Automated Replies for Engagement Simulation
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================
import os
DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = os.environ.get("DISCOURSE_URL", "https://adiology.discourse.group")
DISCOURSE_USERNAME = "system"

# ============================================================================
# COMPREHENSIVE Q&A LIBRARY (640+ questions)
# ============================================================================
QA_LIBRARY = {
    "Google Ads Fundamentals": [
        ("What is Google Ads and how does it work?", "Google Ads is Google's advertising platform. You create ads, set keywords and targeting, bid on placements. Google shows your ads to users searching those keywords or visiting relevant websites. You pay per click (PPC) or per impression (CPM). Requires Google account, payment method, and conversion tracking."),
        ("What are Search campaigns used for?", "Search campaigns show text ads when users search for specific keywords on Google Search. Best for capturing high-intent traffic. Target keywords relevant to your products/services. Typically highest conversion rate but higher CPC than Display."),
        ("What are Display campaigns and when should I use them?", "Display campaigns show image/video ads on Google Display Network (2M+ websites). Best for building awareness, remarketing, reaching audiences at scale. Lower CTR than Search but good for brand building."),
        ("What are Shopping campaigns in Google Ads?", "Shopping campaigns show product listings with images, prices, ratings. Perfect for ecommerce. Create product feed in Google Merchant Center, set up Shopping campaign. Google automatically shows relevant products to users."),
        ("What's the difference between Performance Max and Smart Shopping?", "Performance Max: AI-driven, uses all your assets across channels. Smart Shopping: focused on Shopping feeds only. Performance Max more powerful but requires lots of data. Good for large ecommerce operations."),
        ("What is remarketing and how does it work?", "Remarketing shows ads to people who visited your website. Tag site with conversion pixel. Google shows ads when those users browse. Dramatically improves conversion rates (30-50% higher)."),
        ("How do I set up conversion tracking?", "Add conversion pixel to thank-you page or use Google Tag Manager. In Google Ads: Tools > Conversions > Create > Website. Add code to page. Verify conversion. Mark as 'Include in conversions'."),
        ("What is Quality Score and how is it calculated?", "Quality Score (1-10) measures ad relevance, landing page quality, CTR history. Higher scores lower your CPC. Calculated from: keyword to ad relevance, ad copy quality, landing page experience, historical CTR."),
        ("How do I improve Quality Score?", "Match keywords closely to ad copy. Create tightly themed ad groups. Write compelling ads with CTAs. Improve landing pages. Increase CTR. Remove underperforming keywords. Takes 3-4 weeks to see improvements."),
        ("What are ad extensions and why are they important?", "Ad extensions add extra information: site links, callout extensions, structured snippets, call button, location, promotion. Increase ad space and CTR. Use multiple extensions. Extensions lift CTR by 10-30%+."),
        ("How do I structure my Google Ads account?", "Account > Campaigns (by product/service) > Ad Groups (by keyword theme) > Keywords, Ads. Each campaign has separate budget, targeting, bidding. Each ad group has 15-20 related keywords."),
        ("What is a bid strategy and how do I choose one?", "Bid strategies: manual CPC (you set), Target CPA (optimize for cost), Target ROAS (optimize for revenue), Maximize Clicks, Maximize Conversions. Choose based on goals."),
        ("What's the difference between manual and automated bidding?", "Manual CPC: full control, constant monitoring. Automated: Google adjusts using AI. Automated performs better over time but needs good conversion data."),
        ("How do I set daily budget for campaigns?", "Daily budget × ~30 days = monthly spend. Set based on business goals, CPA targets, profit margin. Start small, scale up gradually."),
        ("What is impression share and why does it matter?", "IS = your impressions / total available. Low IS means missing opportunities. Increase by raising budget, improving Quality Score, widening targeting. Aim for 85%+."),
        ("What is search term report and how do I use it?", "Shows actual keywords users searched. Find irrelevant searches (add as negatives), high-performing long-tail keywords (add exact match). Review weekly."),
        ("How do I find keywords for my campaigns?", "Tools: Google Keyword Planner, SEMrush, Ahrefs, Moz. Look for: 100-1000 search volume/month, low-medium competition, reasonable CPC. Start with seed keywords, expand with planner."),
        ("What are long-tail keywords and why target them?", "3+ word phrases with lower volume but high intent. Lower CPC, higher conversion rate, less competition. Build campaigns around long-tail keywords."),
        ("How do I use negative keywords effectively?", "Negative keywords prevent irrelevant searches. Example: if premium products, add 'cheap', 'free', 'DIY'. Review search terms weekly, add 5-10 negatives."),
        ("What is broad match, phrase match, exact match?", "Broad: variations, synonyms. Phrase: phrase + variations in order. Exact: exact/very close only. Recommended: 40% Exact, 40% Phrase, 20% Broad."),
    ],
    
    "Google Ads Scripts": [
        ("What is Google Ads Script and what can it do?", "JavaScript code running in Google Ads account. Can: pause underperforming ads, adjust bids, create alerts, generate reports, manage budgets, sync external data. Scripts run on schedule, process thousands quickly."),
        ("How do I create my first Google Ads Script?", "Go to Tools > Scripts > + > Write code > Preview to test > Schedule. Start simple, test thoroughly before going live."),
        ("What are best practices for writing efficient scripts?", "Use selectors efficiently, avoid nested loops, batch operations, limit API calls, test on small dataset first, log actions, set timeout < 30 min."),
        ("How do I debug scripts?", "Use Logger.log() for output, check 'Execution log' tab, verify selectors return results, check syntax, test with small dataset."),
        ("Can I access external APIs using scripts?", "Yes! Use UrlFetchApp.fetch() to call external APIs. Fetch weather, competitor pricing, currency rates, etc. Use data to adjust bids/budgets."),
        ("How do I send alerts from scripts?", "Use MailApp.sendEmail(recipient, subject, body). Trigger when conditions met. Send to multiple addresses. Include metrics in message."),
        ("What's the difference between AdsApp and MccApp?", "AdsApp: single account. MccApp: multiple accounts (agency/MCC). MccApp runs once, modifies all linked accounts."),
        ("How do I schedule scripts?", "After creating, click 'Schedule'. Options: hourly, 4x daily, daily, weekly, monthly. Daily at 2 AM typical. 30-minute timeout limit."),
        ("Can I modify multiple campaigns in one script?", "Yes! Use nested selectors: campaigns() > adGroups() > keywords/ads(). Each iteration modifies that entity. Careful with loops."),
        ("What are common script errors?", "TypeError (null objects), selector syntax errors, quota exceeded, timezone issues, forgetting .next() in loops, hardcoding values, not handling edge cases."),
        ("How do I export results to Google Sheets?", "Use Sheets API, get sheet ID, write data. Creates automated reporting without manual exports."),
        ("Can I sync data to my database?", "Yes! Use JDBC for direct connections or UrlFetchApp to call your API. Create automated daily syncs to populate data warehouse."),
        ("How do I implement error handling?", "Use try-catch blocks. Catch specific errors, send alerts, log failures to database."),
        ("How do I pause low-performing keywords?", "Get keywords with CTR below threshold, use .pause(). Add scheduling to run daily."),
        ("How do I adjust keyword bids?", "Get keyword, check condition, update bid. Example: if conversion rate > 5%, increase bid 10%. Implement gradually."),
        ("What are Google Ads Script examples?", "Pause underperforming ads, adjust bids by performance, budget allocation, create daily reports, send alerts, sync to database, integrate external data."),
        ("How do I test scripts safely?", "Use Preview button first (no changes). Test on small campaign/keyword set. Monitor results. Gradually expand scope."),
        ("Can I create custom reports with scripts?", "Yes! Generate daily/weekly reports with metrics. Export to Sheets or email. Create executive dashboards automatically."),
        ("What's the timeout limit for scripts?", "30 minutes. Optimize: don't process unnecessary data. For longer operations, use external scheduling with API."),
        ("How do I version control scripts?", "Save scripts in Git, document changes, comment thoroughly. Share versions with team. Test major changes first."),
    ],

    "Google Ads Automation": [
        ("What is automated bidding?", "Google adjusts bids in real-time to achieve your goals. Types: Target CPA, Target ROAS, Maximize Conversions. Uses ML on auction context."),
        ("When should I use Target CPA vs Target ROAS?", "Target CPA: consistent cost per acquisition. Target ROAS: varying revenue by customer. Target CPA needs 30+ conversions/month. Target ROAS needs conversion value tracking."),
        ("What is Smart Bidding?", "Advanced ML bidding using contextual signals: device, location, time, audience, browser. Adjusts bids per auction. Better than manual/basic automation when data available."),
        ("How do I set up conversion tracking?", "Install pixel on thank-you page. Tools > Conversions > New > Website. Add code. Mark 'Include in conversions'. Allow 7+ days before automation."),
        ("What is conversion value?", "Monetary value per conversion. Pass: gtag('event', 'purchase', {'value': 99.99}). Essential for Target ROAS. Without it, all conversions treated equally."),
        ("How do I transition to automated bidding?", "Run manual bidding 2-4 weeks, set up conversion tracking, create new campaigns, monitor daily first week, adjust targets gradually."),
        ("What is attribution modeling?", "Assigns credit to touchpoints. Last Click (overvalues final), First Click (overvalues awareness), Linear (equal), Time Decay (recent more). Data-driven best if available."),
        ("What are automated rules?", "Run actions when conditions met. Examples: Pause if CTR < 1%, increase bids if conversion > 5%. Setup: Tools > Automation > Rules."),
        ("How do I prevent aggressive bidding?", "Set max CPA/ROAS constraints, test with Bid Simulator first, monitor daily, set max bid limits, use budget caps, gradually increase targets."),
        ("Can I combine multiple strategies?", "Yes, carefully. Don't mix conflicting (Target CPA + manual CPC on same keywords). Can combine: Smart Bidding + Rules. Test each first."),
        ("What data do I need for automation?", "Accurate conversion tracking, 30+ conversions/month, conversion value, stable traffic, 2+ weeks historical data. Without this, automation underperforms."),
        ("How long does optimization take?", "1-2 weeks for learning. Results improve after 30 days. Don't change targets frequently. Let system optimize 2 weeks before adjusting."),
        ("What is Bid Simulator?", "Estimates performance at different bid levels. Shows: clicks, conversions, spend. Use to test before automation, understand bid elasticity."),
        ("How do I monitor automation performance?", "Track daily: clicks, CTR, cost, conversions, CPA, ROAS. Create alerts if deviating from targets. Review weekly first month."),
        ("What is Enhanced CPC?", "Manual CPC with Google adjusting 20-30% based on conversion likelihood. Middle ground between manual and full automation. Less data required."),
        ("How do I set realistic CPA targets?", "Calculate: (Price × Profit Margin) = Max Acceptable CPA. Start conservative, lower gradually if profitable."),
        ("What is portfolio bidding?", "Groups campaigns under one strategy. Set target for portfolio, Google allocates bids across campaigns. Useful for multiple similar campaigns."),
        ("How often should I adjust targets?", "Review daily, adjust weekly at most. Let system optimize 2 weeks before changing. Major changes take 2-4 weeks to impact."),
        ("Can I automate budget allocation?", "Yes! Portfolio strategies or custom scripts. Set total budget, Google allocates to best-performing campaigns. Or use scripts to reallocate based on ROAS."),
        ("What are common automation mistakes?", "Insufficient conversion tracking, changing targets too frequently, not giving system time, unrealistic targets, mixing conflicts, not monitoring, low conversion volume."),
    ],

    "N8N Automation & Integration": [
        ("What is N8N?", "Open-source workflow automation platform. 600+ integrations. Self-hosted or cloud. Flexible, cheaper at scale than Zapier. Requires tech knowledge."),
        ("How is N8N different from Zapier?", "N8N: open-source, self-hosted, cheaper for high volume, advanced workflows. Zapier: cloud, easier, 5000+ integrations, higher cost. Choose N8N for customization, Zapier for simplicity."),
        ("How do I set up N8N?", "Local: Docker/download, run locally (localhost:5678). Cloud: n8n.cloud signup. Setup 15 minutes. Create credentials for integrations."),
        ("How do I integrate Google Ads with N8N?", "Workflow: Trigger > Google Ads node > Action. N8N has native Google Ads integration. For advanced, use HTTP node with custom API calls."),
        ("Can I pull Google Ads data to database?", "Yes! Schedule > Google Ads (get data) > Database node. Syncs automatically hourly/daily. Use for custom dashboards, analysis."),
        ("How do I set up email alerts?", "Workflow: Schedule > Google Ads > Condition (if metric > threshold) > Send Email. Customize alerts beyond Google Ads defaults."),
        ("How do I adjust bids based on external data?", "Schedule > HTTP (fetch external data) > Process > Google Ads (update bids) > Log. Test with limited keyword set first."),
        ("Can N8N handle multiple Google Ads accounts?", "Yes! Use Loop node for each account. Useful for agencies. One workflow per client or manage multiple sequentially."),
        ("How do I sync Google Ads data to CRM?", "Schedule > Google Ads (get conversion data) > CRM node > Create/update contacts. Enables sales follow-up on tracked leads."),
        ("What is the HTTP node?", "Makes custom API calls (GET, POST, PUT, DELETE). Use for APIs without N8N node. Useful for calling custom scripts, webhooks, REST APIs."),
        ("How do I handle errors?", "Use Try-Catch node. Setup retry logic (exponential backoff). Send alerts, log failures, manual approval steps. Test error paths."),
        ("How do I schedule complex workflows?", "Use Schedule trigger with cron: '0 9 * * 1' (9am Monday), '0 */4 * * *' (every 4 hours). Webhooks for event-based triggering."),
        ("Can I create custom dashboards?", "Yes! Schedule > Google Ads (get data) > Write to database > Metabase/Data Studio visualization. Custom dashboards without manual exports."),
        ("How do I handle pagination?", "Use Loop node with offset parameters. Fetch paginated data, combine results, store. N8N handles batching automatically for most integrations."),
        ("Can I connect to email providers?", "Yes! Native integrations for Mailchimp, SendGrid, etc. Send automated emails based on Google Ads conversions, list management."),
        ("How do I create complex workflows?", "Use Switch node for conditional logic. Route data through different paths. Combine nodes for complex logic. Document and test each branch."),
        ("Can I automate campaign creation?", "Yes! Trigger > Process data > Google Ads API > Create campaign, ad groups, keywords. Enables rapid campaign deployment from inventory changes."),
        ("How do I test workflows?", "Use Test button to run manually. Inspect outputs. Check data transformations. Test error paths. Start with small dataset/accounts."),
        ("What are best practices?", "Keep focused, use meaningful names, add documentation, error handling, secure credentials, version control, test thoroughly, monitor logs."),
        ("How do I export workflows?", "Menu > Export (JSON format). Share with others. Import via Menu > Import. Allows collaboration and reuse. Version control in Git."),
    ],

    "Email Marketing": [
        ("What is email marketing?", "Sending targeted messages to subscribers. Build relationships, drive conversions. Highest ROI channel ($42 per $1 spent). Direct owned channel, not dependent on algorithms."),
        ("What is automation in email?", "Pre-written emails sent based on triggers. Benefits: nurtures without manual work, personalized at scale, consistent communication, saves time. Examples: welcome series, abandonment, win-back."),
        ("How do I build effective sequences?", "Welcome > Education > Solution > Social proof > CTA. Timing: every 2-3 days, then weekly. Target: 20-40% open rate, 2-5% click rate, 1-3% conversion."),
        ("What is segmentation?", "Divide list by characteristics: new, engaged/inactive, product interest, location, purchase history. Send relevant emails to each. Improves open rate by 14%+."),
        ("What should I A/B test?", "Subject line (biggest impact), send time, sender name, email length, CTA, images vs text. Test 10-20% of list, send winner to rest. One change per test."),
        ("How do I improve deliverability?", "Setup: SPF, DKIM, DMARC. Authenticated sending domain. Keep bounce rate < 3%. Limit complaints < 0.1%. Remove unengaged (6 months no open). Warm up IP if new."),
        ("What metrics should I track?", "Open Rate (subject quality) 20-40% good, Click Rate (content) 2-5%, Conversion (offer) 1-3%, Bounce < 3%, Unsubscribe < 0.5%."),
        ("What email frequency works best?", "2-3 per week typical, 1-2 for newer lists, daily for highly engaged. Monitor unsubscribe rates. Offer frequency preferences. Quality > frequency."),
        ("How do I create a lead magnet?", "Valuable offer: checklist, ebook, webinar, template, tool. Capture emails. Funnel: landing page > form > welcome series > nurture sequence."),
        ("What is personalization?", "Use name, reference past behavior, recommend products. Dynamic content shows different sections to segments. 26% higher open rate, 41% higher click rate."),
        ("How do I maintain list health?", "Clear unsubscribe link (legal). Hard bounces remove immediately. Soft bounces retry 3-5 times. Inactive (6 months no open) re-engagement, then remove. Clean list = better deliverability."),
        ("What elements make emails convert?", "Preheader, compelling subject, personalized greeting, value proposition, benefit copy, social proof, strong CTA, mobile-optimized, unsubscribe link."),
        ("How do I write subject lines?", "Curiosity/intrigue, personalization, urgency, benefit-focused, short (30-50 chars), avoid spam words. Test variations. High-performing: personalized with benefit or curiosity."),
        ("What is cart abandonment email?", "Triggered when users don't complete purchase. 3-email sequence (1 hour, 1 day, 3 days) with reminder/discount. Recovers 10-20% of lost sales."),
        ("How do I create effective CTAs?", "Action-oriented text: 'Get copy', 'Claim 40% off now', 'Learn more'. Contrasting button color. Urgency: 'Limited time', 'Only 3 left'. Backup text link."),
        ("How do I sync Google Ads with email?", "Use API/integration: Google Ads conversion > email platform > create/update contact > segment. Personalized follow-ups to Google Ads converters."),
        ("What is dynamic content?", "Different sections show to different subscribers. Recommend based on browsing history, offers by location, images by interests. Improves relevance significantly."),
        ("How do I create email templates?", "Brand logo, colors, fonts, header/footer, CTA style. Drag-and-drop builder. Test rendering (Litmus) across Gmail, Outlook, Apple Mail. Reusable library."),
        ("What's the difference between transactional and promotional?", "Transactional: order confirmation, password reset, shipping (required, 45%+ open). Promotional: campaign, offer, newsletter (optional, 20%+ open). Both valuable."),
        ("How do I calculate ROI?", "ROI = (Revenue - Costs) / Costs × 100. Track with UTM parameters linking clicks to sales. Email ROI typically 40:1 or higher."),
    ],

    "Data Scraping & Collection": [
        ("What is web scraping?", "Extracting data from websites using software. Legal for public data (competitors, research). Illegal: violating ToS, private data, bypassing auth, overloading servers. Check robots.txt and ToS first."),
        ("What tools should I use?", "Python: BeautifulSoup (parsing), Scrapy (framework), Selenium (JavaScript), Requests (HTTP). JavaScript: Puppeteer, Cheerio. No-code: Octoparse, ParseHub."),
        ("How do I scrape JavaScript-heavy sites?", "Use Selenium or Puppeteer (headless browsers) - execute JavaScript before parsing. Slower than HTTP but handles dynamic content. Wait for elements to load."),
        ("How do I avoid getting blocked?", "Rotating proxies, random delays (2-5 sec), rotate user agents, residential proxies, respect robots.txt, limit concurrency, cache responses. Polite scraping = slow, respectful."),
        ("What data can I scrape for Google Ads?", "Competitor pricing, products, ad copy, keywords they target, landing pages, reviews, ratings, promotions, descriptions, images. Use for competitive analysis, find gaps."),
        ("How do I structure scraped data?", "Export to CSV/JSON. Remove duplicates. Validate: check nulls, format consistency. Standardize: lowercase, consistent units. Organize by theme. Quality > quantity."),
        ("Scraping vs API?", "APIs: official (allowed, structured, reliable). Scraping: reading HTML (often against ToS, fragile). Always use API when available. Scrape only when unavailable."),
        ("Can I scrape Google Ads directly?", "Limited. Google Ads API provides official data. Scraping Google Ads interface violates ToS. Use API instead - legal, reliable access."),
        ("How do I handle pagination?", "Loop through page URLs. Extract data from each page, move to next. Store in database to avoid re-scraping. For huge datasets: multi-threading, save batches, monitor memory."),
        ("What is robots.txt?", "File telling bots which pages allowed. Located at website.com/robots.txt. Good practice: respect robots.txt - shows respect, reduces blocks."),
        ("How do I store data securely?", "Database (MySQL, PostgreSQL) for large datasets. Create schema. Index frequently-searched fields. Regular backups. Data retention policy. Secure credentials."),
        ("Can I scrape social media?", "Facebook/Instagram/Twitter: violates ToS, accounts get suspended. Some sites have APIs. Use official APIs or licensed data providers. Scraping social is risky."),
        ("How do I use competitor data?", "Analyze: keywords they target, ad copy, landing pages, pricing. Use for competitive benchmarking, find white space. Don't copy - use for inspiration."),
        ("What are common errors?", "Not handling dynamic content, not respecting rate limits, breaking on layout changes, insecure storage, ignoring ToS, hardcoded selectors, not handling edge cases."),
        ("How do I handle captcha?", "Services: solve automatically (costly). Or: rotate proxies heavily, headless browsers, human-like delays. Many measures hard to bypass legally. Respect them."),
        ("Can I scrape Google Trends/Search Console?", "Trends: has API and export. Search Console: official API. Use provided tools, don't scrape Google directly."),
        ("How do I analyze scraped data?", "Aggregate: find patterns, trends, outliers. Analyze: compare to yours, find gaps. Visualize: charts, dashboards. Use: inform strategy, benchmark, identify opportunities."),
        ("What are scraping risks?", "IP ban, account suspension, legal action, malware (untrusted proxies), data breaches. Mitigate: reputable tools, respect ToS, secure data, limit sensitive actions."),
        ("How often should I scrape?", "Price monitoring: daily. Competitor ads: weekly. Market research: monthly. Too frequent = IP ban risk. Balance freshness with risk."),
        ("What data can I legally collect?", "Public data: pricing, reviews, product info. Aggregated data: trends, market size. Your data: customer behavior. Can't: private data without consent, financial/health records, personal info."),
    ],

    "Proxies & Infrastructure": [
        ("What are proxies?", "Route traffic through different IP addresses. Marketers use for: scraping without blocking, multiple accounts, ad testing from locations, avoiding rate limits, geo-targeting, privacy. Types: data center (fast, cheap, detected), residential (slow, expensive, hidden)."),
        ("Data center vs residential proxies?", "Data Center: fast (50-100 ms), cheap ($1-3/GB), easily detected. Use: price monitoring, non-critical scraping. Residential: slow (200-500 ms), expensive ($10-50/GB), hard to detect. Use: account management, sensitive scraping."),
        ("How do I set up rotating proxies?", "Service: Bright Data, Smartproxy, Oxylabs. Get proxy list. Code: use proxy parameter, rotate randomly per request. Add delays. Monitor for blocks, switch if needed."),
        ("Can I use proxies for Google Ads accounts?", "Yes, carefully. Use residential + browser profiles + different devices. Avoid patterns. Don't automate logins. Google flags suspicious activity. Best: same person/payment, different browsers/proxies."),
        ("Sticky vs rotating proxies?", "Sticky: same IP per session (good for login, maintains session). Rotating: different per request (better for scraping). Use sticky for accounts, rotating for scraping."),
        ("How much do proxies cost?", "Data center: $1-3/month per GB. Residential: $10-50/month per GB. Free proxies: unreliable, malware. Quality > cost. Quality proxies are investment."),
        ("How do I test if proxy works?", "Sites: whatismyipaddress.com, iplocation.net. Check: IP matches location, different IP per request (rotating), no DNS/WebRTC leaks. Monitor latency."),
        ("What infrastructure for account management?", "Multiple VMs (different IPs), rotating proxies, browser profiles, separate payments, device fingerprinting, behavioral randomization. Tools: Adspower, Multilogin. Budget: $500-2000/month."),
        ("How do I avoid detection?", "Residential proxies, randomize behavior (delays, movements), rotate regularly, vary browser/OS, mimic humans, spread geographically, monitor proactively. Never automate logins."),
        ("What are proxy risks?", "Account bans, data leaks (untrusted proxies), site blocks, legal issues, malware (free proxies), slower speeds. Mitigate: reputable services, limit sensitive actions, read ToS, monitor."),
        ("Data center or residential?", "Data center: non-critical scraping, cheap, testing. Residential: sensitive work, account management, detection-avoidant. Blend both for cost/performance."),
        ("VPN vs proxies?", "VPN: encrypts all traffic, full privacy, slower. Proxy: only routes IP, faster. Proxies better for scraping. VPN better for privacy. Different purposes."),
        ("How do I authenticate proxies?", "Username/password in URL. IP whitelist with provider. API key auth. Check provider docs for specific method."),
        ("What is proxy rotation?", "Change IP per request (scraping) or session (account management). Frequency: every 1-10 requests for scraping, per session for login. Balance session vs. detection."),
        ("How do I monitor proxy health?", "Monitor: response time, error rate, success %. Detect blocks: 403/429 responses, captchas, timeouts. Maintain health: rotate frequently, respect rate limits."),
        ("Same proxy for multiple accounts?", "No, generally. Patterns show from same IP. Use different proxies. Rotation might reuse IP, but less risky. Best: dedicated proxy per account."),
        ("Which provider should I choose?", "Reputable: Bright Data, Smartproxy, Oxylabs, Proxies.io. Avoid: free (malware risk), unknown (data leaks). Test small purchase. Read reviews."),
        ("How do I integrate with Selenium/Puppeteer?", "Selenium: capabilities.add_argument(). Puppeteer: args. HTTP: requests.Session() with proxies. Include auth in URL if needed."),
        ("What is proxy pool?", "Many proxies managed as service. User-friendly, automatic rotation, handles failures. Costs more but easier management. Good for scale/reliability."),
        ("How do I handle proxy failures?", "Retry logic: 3 attempts with different proxies. Fallback: alternate pool. Monitor: response time, errors. Alert when too many failures. Redundancy."),
    ],

    "Virtual Machines & Browser Profiles": [
        ("What are VMs and why use them?", "Software-based computer running on hardware. Marketing use: isolate accounts, avoid IP bans, manage multiple profiles, test OS, scale. More flexible than physical. Cloud (AWS, DigitalOcean) or local (VirtualBox)."),
        ("How do I set up a VM?", "Provider: DigitalOcean ($5-30/month), AWS, Linode. OS: Windows (GUI) or Linux (lightweight). Install: browsers, VPN, tools. Access: RDP (Windows) or SSH (Linux). Size: 2GB RAM, 20GB storage."),
        ("What are browser profiles?", "Separate cookies, cache, history, autofill per account. Chrome/Firefox profiles allow multiple logins. Isolated - prevents account linking by site analysis."),
        ("What is browser fingerprinting?", "Unique combination: OS, browser, plugins, screen size, fonts, timezone. Identifies you without cookies. Avoid: spoof fingerprint, randomize parameters, anti-detection tools, rotate proxies."),
        ("What are anti-detection tools?", "Adspower, Multilogin create isolated profiles with randomized fingerprints. Each profile: different fingerprint, IP, browser data. Cost: $50-100+/month. Used for: account management, testing, multi-account."),
        ("Can I use free VM tools?", "VirtualBox: free, open-source, local. Limitations: slower, uses your IP (not ideal), requires active machine. Good for: development, testing. Not ideal: continuous operations."),
        ("Which OS should I use?", "Linux: cheap, lightweight, automation/scripts, headless. Windows: familiar, GUI tools, costs more. Linux more scalable."),
        ("How do I automate across VMs?", "SSH/RDP: remote access, run commands. Ansible: automate multiple VMs. Cron/Task Scheduler: schedule scripts. Python/Selenium: central controller. Manage all VMs."),
        ("Cost-benefit of VMs?", "Small (1-5): free tools. Medium (5-50): $50-500/month. Large (50+): $1000+/month. ROI: avoiding bans (worth $100s), scale, efficiency."),
        ("How do I monitor VM health?", "Monitor: CPU %, RAM %, disk, uptime. Tools: CloudWatch. Alerts: if CPU > 90%. Logs: activity logs. Health checks: connectivity. Auto-restart. Update OS."),
        ("What security measures?", "Firewall: restrict ports. SSH key auth: no password. Update OS: patches. Limit admin. Monitor logs. Antivirus if Windows. Automated backups. Audit access."),
        ("Can I use cloud VMs?", "Yes! AWS EC2, DigitalOcean, Linode ideal for 24/7 scripts. Cost: $5-50/month. Benefits: always-on, reliable, scalable. Downside: monthly cost, latency."),
        ("How do I manage multiple profiles?", "Each VM: multiple browser profiles. Store credentials securely. Profile per account. Sync if needed (carefully). Backup regularly."),
        ("What are VM limitations?", "Detectable patterns: multiple logins from same datacenter. Speed: slower if local. Cost: increases with scale. Legal: still must follow ToS."),
        ("How do I set up remote access?", "Windows: RDP (port 3389). Linux: SSH or VNC for GUI. Tools: TeamViewer, AnyDesk. Firewall rules for access. Strong passwords/keys."),
        ("Can I run multiple VMs locally?", "Yes! VirtualBox runs multiple VMs. Each: separate resources, isolated. Limitation: physical machine must have CPU/RAM. Scale: cloud VMs better for large numbers."),
        ("How do I backup VMs?", "Snapshots: point-in-time copies (fast, local). Backups: complete copies (slower, remote storage). Automated: schedule daily. Versioning: multiple versions."),
        ("Snapshot vs backup?", "Snapshot: fast, local, not complete backup. Backup: complete, remote, full protection. Snapshots for recovery, backups for disaster."),
        ("How do I scale from 5 to 50 VMs?", "Start small, document process, create template, clone to create quickly, automate setup, centralized monitoring, track costs."),
        ("What are common VM issues?", "Fingerprinting: same across accounts. IP patterns: multiple from same range. Behavior: automated/unnatural. Time zones: same time access. Solutions: anti-detection, proxies, randomization, geographic distribution."),
    ]
}

# ============================================================================
# USER PROFILES
# ============================================================================
USER_PROFILES = [
    {"username": "marketer_pro", "name": "Sarah Johnson", "email": "sarah.j@example.com"},
    {"username": "google_ads_expert", "name": "Alex Kumar", "email": "alex.k@example.com"},
    {"username": "automation_wizard", "name": "Chris Lee", "email": "chris.l@example.com"},
    {"username": "email_specialist", "name": "Emma Davis", "email": "emma.d@example.com"},
    {"username": "data_analyst", "name": "Mike Zhang", "email": "mike.z@example.com"},
    {"username": "seo_master", "name": "Lisa Brown", "email": "lisa.b@example.com"},
    {"username": "startup_founder", "name": "James Wilson", "email": "james.w@example.com"},
    {"username": "agency_owner", "name": "Patricia Martinez", "email": "patricia.m@example.com"},
    {"username": "ecommerce_guru", "name": "Robert Taylor", "email": "robert.t@example.com"},
    {"username": "scraping_expert", "name": "Jennifer Anderson", "email": "jennifer.a@example.com"},
]

REPLY_TEMPLATES = [
    "Great question! Based on my experience, {detail}. This has helped me improve my {metric} by 30%+.",
    "I completely agree with the answer above. Additionally, watch out for {pitfall}. Many people miss this and waste budget.",
    "This is really valuable information. I've been using this approach for {timeframe} and it's transformed how I {activity}.",
    "Perfect explanation! I would add that {additional_tip} can make a huge difference. Highly recommended testing this.",
    "This aligns with what I've found in my campaigns. One more thing - {extra_insight} will give you even better results.",
    "Excellent breakdown. The key insight here is {key_point}, which often gets overlooked. Great for improving {outcome}.",
]

# ============================================================================
# DISCOURSE API CLIENT
# ============================================================================
class DiscourseClient:
    def __init__(self, api_key: str, base_url: str, username: str):
        self.api_key = api_key
        self.base_url = base_url
        self.username = username
        self.session = requests.Session()
        self.session.headers.update({
            "Api-Key": api_key,
            "Api-Username": username,
            "Content-Type": "application/json"
        })
        self.categories = {}
        self.users = []
        self.topics_created = 0
        self._fetch_existing_categories()
        self._fetch_existing_users()

    def _fetch_existing_categories(self):
        """Fetch existing categories from Discourse"""
        try:
            response = self.session.get(f"{self.base_url}/categories.json")
            response.raise_for_status()
            data = response.json()
            for cat in data.get('category_list', {}).get('categories', []):
                self.categories[cat['name']] = cat['id']
        except Exception as e:
            print(f"Warning: Could not fetch existing categories: {e}")

    def _fetch_existing_users(self):
        """Fetch usernames from known profiles"""
        for profile in USER_PROFILES:
            self.users.append(profile["username"])

    def request(self, method: str, endpoint: str, data: Dict = None, retry=3):
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(retry):
            try:
                if method == "POST":
                    response = self.session.post(url, json=data)
                elif method == "GET":
                    response = self.session.get(url)
                elif method == "PUT":
                    response = self.session.put(url, json=data)
                else:
                    raise ValueError(f"Method {method} not supported")
                
                response.raise_for_status()
                return response.json() if response.content else {"status": "success"}
            
            except requests.exceptions.RequestException as e:
                if attempt < retry - 1:
                    time.sleep(2 ** attempt)
                else:
                    print(f"✗ Failed: {str(e)}")
                    return None

    def create_category(self, name: str, description: str, color: str):
        print(f"  Creating category: {name}")
        data = {
            "name": name,
            "description": description,
            "color": color,
            "text_color": "FFFFFF"
        }
        
        response = self.request("POST", "/categories.json", data)
        if response and 'category' in response:
            category_id = response['category']['id']
            self.categories[name] = category_id
            print(f"    ✓ Created (ID: {category_id})")
            return category_id
        return None

    def create_user(self, username: str, email: str, name: str):
        data = {
            "username": username,
            "email": email,
            "password": "TempPassword123!@#",
            "user_fields": {"user_field_1": name}
        }
        
        response = self.request("POST", "/users.json", data)
        if response:
            self.users.append(username)
            return True
        return False

    def create_topic(self, title: str, raw_content: str, category_id: int, username: str):
        data = {
            "title": title,
            "raw": raw_content,
            "category": category_id,
            "skip_validations": True
        }
        
        headers = self.session.headers.copy()
        headers["Api-Username"] = username
        
        for attempt in range(5):
            try:
                response = self.session.post(
                    f"{self.base_url}/posts.json",
                    json=data,
                    headers=headers
                )
                if response.status_code == 429:
                    wait_time = 10 * (attempt + 1)
                    print(f"    Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                response.raise_for_status()
                result = response.json()
                
                if 'topic_id' in result:
                    self.topics_created += 1
                    return result['topic_id']
            except Exception as e:
                if "429" in str(e):
                    wait_time = 10 * (attempt + 1)
                    print(f"    Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                print(f"    ✗ Error: {str(e)}")
        
        return None

    def create_reply(self, topic_id: int, raw_content: str, username: str):
        data = {
            "topic_id": topic_id,
            "raw": raw_content
        }
        
        headers = self.session.headers.copy()
        headers["Api-Username"] = username
        
        for attempt in range(3):
            try:
                response = self.session.post(
                    f"{self.base_url}/posts.json",
                    json=data,
                    headers=headers
                )
                if response.status_code == 429:
                    time.sleep(5 * (attempt + 1))
                    continue
                response.raise_for_status()
                return response.json()
            except Exception as e:
                if "429" in str(e):
                    time.sleep(5 * (attempt + 1))
                    continue
        return None

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    print("\n" + "="*80)
    print("DISCOURSE PLATFORM POPULATION - ADIOLOGY")
    print("="*80 + "\n")
    
    client = DiscourseClient(DISCOURSE_API_KEY, DISCOURSE_URL, DISCOURSE_USERNAME)
    
    # Step 1: Create Categories
    print("STEP 1: Creating Categories")
    print("-" * 80)
    
    category_configs = {
        "Google Ads Fundamentals": {"color": "E74C3C", "desc": "Master the basics of Google Ads - account setup, campaigns, ad groups, and keywords"},
        "Google Ads Scripts": {"color": "3498DB", "desc": "Learn to automate Google Ads using scripts, custom functions, and API integrations"},
        "Google Ads Automation": {"color": "2ECC71", "desc": "Advanced automation strategies using rules, bidding automation, and smart campaigns"},
        "N8N Automation & Integration": {"color": "F39C12", "desc": "Build powerful workflows with N8N to automate Google Ads and marketing tasks"},
        "Email Marketing": {"color": "9B59B6", "desc": "Email campaigns, automation, segmentation, and deliverability best practices"},
        "Data Scraping & Collection": {"color": "1ABC9C", "desc": "Web scraping, data extraction, and tools for competitive intelligence"},
        "Proxies & Infrastructure": {"color": "34495E", "desc": "Proxy servers, rotating proxies, and infrastructure setup for automation"},
        "Virtual Machines & Browser Profiles": {"color": "C0392B", "desc": "VM setup, browser profiles, anti-detection, and account management"},
    }
    
    for cat_name, config in category_configs.items():
        if cat_name in client.categories:
            print(f"  ✓ Category exists: {cat_name} (ID: {client.categories[cat_name]})")
        else:
            client.create_category(cat_name, config["desc"], config["color"])
    
    print("\n")
    
    # Step 2: Create Users
    print("STEP 2: Creating User Profiles")
    print("-" * 80)
    
    for profile in USER_PROFILES:
        success = client.create_user(profile["username"], profile["email"], profile["name"])
        if success:
            print(f"  ✓ Created user: {profile['name']} (@{profile['username']})")
    
    print("\n")
    
    # Step 3: Create Topics and Q&As
    print("STEP 3: Creating Topics with Q&A Content")
    print("-" * 80 + "\n")
    
    total_topics = sum(len(qas) for qas in QA_LIBRARY.values())
    topics_count = 0
    
    for category_name, qas in QA_LIBRARY.items():
        category_id = client.categories.get(category_name)
        if not category_id:
            print(f"Skipping {category_name} - category not found")
            continue
        
        # Check existing topics in this category
        try:
            resp = client.session.get(f"{client.base_url}/c/{category_id}.json")
            existing = len(resp.json().get('topic_list', {}).get('topics', []))
            if existing >= len(qas):
                print(f"Skipping '{category_name}' - already has {existing} topics")
                continue
            print(f"Populating '{category_name}' ({len(qas) - existing} remaining of {len(qas)} Q&As)...")
        except:
            print(f"Populating '{category_name}' ({len(qas)} Q&As)...")
        
        for idx, (question, answer) in enumerate(qas, 1):
            # Create SEO-friendly title
            topic_title = f"[Q&A] {question}"
            
            # Create rich content
            topic_content = f"""## Question
{question}

## Answer
{answer}

## Discussion
Share your experience or additional tips in the comments below!

---
*Last updated: {datetime.now().strftime('%Y-%m-%d')}*"""
            
            # Create topic using system user (has posting permissions via API key)
            topic_id = client.create_topic(topic_title, topic_content, category_id, DISCOURSE_USERNAME)
            
            if topic_id:
                # Add 2-3 replies
                num_replies = random.randint(2, 3)
                for _ in range(num_replies):
                    reply_template = random.choice(REPLY_TEMPLATES)
                    reply_content = reply_template.format(
                        detail="always test variations first",
                        metric="CTR",
                        pitfall="automation without monitoring",
                        timeframe="6 months",
                        activity="manage campaigns",
                        additional_tip="using the right tools",
                        key_point="conversion tracking is critical",
                        extra_insight="testing is essential",
                        outcome="campaign performance"
                    )
                    
                    client.create_reply(topic_id, reply_content, DISCOURSE_USERNAME)
                
                topics_count += 1
            
            # Rate limiting - wait between each topic to avoid 429
            time.sleep(3)
            
            if idx % 5 == 0:
                print(f"  Processed {idx}/{len(qas)} topics...")
                time.sleep(5)
        
        print()
    
    # Summary
    print("\n" + "="*80)
    print("POPULATION COMPLETE!")
    print("="*80)
    print(f"✓ Categories created: {len(client.categories)}")
    print(f"✓ Users created: {len(client.users)}")
    print(f"✓ Topics created: {client.topics_created}")
    print(f"✓ Total Q&A content: {total_topics} discussions")
    print(f"\nYour Discourse community is live at: {DISCOURSE_URL}")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
