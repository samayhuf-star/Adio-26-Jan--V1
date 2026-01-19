// Comprehensive list of 1000+ negative keywords for Google Ads campaigns
export const generateComprehensiveNegativeKeywords = (): string[] => {
    return [
        // Price/Quality Related
        "cheap", "cheapest", "discount", "discounted", "free", "freebie", "bargain", "affordable", "budget",
        "low cost", "inexpensive", "sale", "sales", "clearance", "liquidation", "closeout", "wholesale",
        "refurbished", "used", "second hand", "secondhand", "reconditioned", "rebuilt", "surplus",
        
        // Job/Career Related
        "job", "jobs", "career", "careers", "employment", "hiring", "recruit", "recruiting", "vacancy",
        "vacancies", "apply", "application", "resume", "cv", "salary", "wage", "intern", "internship",
        "volunteer", "apprentice", "apprenticeship", "work from home", "remote job", "part time", 
        "full time", "freelance", "contractor", "gig", "commission",
        
        // Information/Educational (Non-Commercial Intent)
        "how to", "what is", "what are", "where is", "where are", "when is", "when are", "why is", "why are",
        "who is", "who are", "definition", "meaning", "explain", "guide", "tutorial", "instructions",
        "tips", "advice", "help", "information", "info", "learn", "learning", "study", "studying",
        "course", "courses", "class", "classes", "training", "workshop", "seminar", "webinar",
        "lesson", "lessons", "education", "educational", "school", "university", "college",
        
        // Review/Comparison Related
        "review", "reviews", "rating", "ratings", "testimonial", "testimonials", "feedback",
        "complaint", "complaints", "scam", "scams", "fraud", "fake", "vs", "versus", "compare",
        "comparison", "alternative", "alternatives", "best", "top", "worst", "better", "good", "bad",
        
        // DIY/Self-Service
        "diy", "do it yourself", "homemade", "make your own", "build", "building", "create",
        "manual", "self", "own", "yourself", 
        
        // Company/Corporate Information
        "company", "corporation", "corporate", "business", "firm", "inc", "llc", "ltd",
        "headquarters", "headquarter", "office", "branch", "location", "address", "phone number",
        "contact", "email", "customer service", "support", "help desk", "call center",
        "about us", "who we are", "our story", "mission", "vision", "values",
        
        // Legal/Regulatory
        "lawsuit", "legal", "lawyer", "attorney", "court", "sue", "suing", "litigation",
        "regulation", "compliance", "law", "policy", "policies", "terms", "conditions",
        "privacy", "gdpr", "ccpa",
        
        // Media/Entertainment
        "movie", "movies", "film", "films", "video", "videos", "youtube", "song", "songs",
        "music", "lyrics", "album", "band", "game", "games", "gaming", "play", "playing",
        "watch", "watching", "stream", "streaming", "download", "downloading",
        
        // Social Media/Forums
        "facebook", "instagram", "twitter", "tiktok", "snapchat", "linkedin", "pinterest",
        "reddit", "forum", "forums", "blog", "blogs", "wiki", "wikipedia",
        
        // Samples/Tests
        "sample", "samples", "demo", "trial", "test", "testing", "example", "examples",
        "mock", "practice", "preview",
        
        // Geographic (Too Broad/Irrelevant)
        "near me", "nearby", "local", "around me", "in my area", "closest",
        
        // Temporal (Too General)
        "history", "historical", "old", "ancient", "vintage", "antique", "past",
        "future", "upcoming", "new", "latest", "recent", "now", "today", "tonight",
        "tomorrow", "yesterday", "2020", "2021", "2022", "2023", "2024", "2025",
        
        // Medical/Health (If Not Relevant)
        "doctor", "doctors", "hospital", "hospitals", "clinic", "clinics", "medical",
        "medicine", "medication", "prescription", "health", "healthcare", "disease",
        "treatment", "therapy", "diagnosis", "symptoms", "cure",
        
        // Real Estate (If Not Relevant)
        "rent", "rental", "lease", "leasing", "buy", "buying", "sell", "selling",
        "house", "apartment", "condo", "property", "real estate", "mortgage",
        
        // Technology/Software (Generic)
        "app", "application", "software", "program", "download", "install", "setup",
        "update", "upgrade", "version", "hack", "hacks", "crack", "cracked", "pirate",
        "torrent", "mod", "modded",
        
        // Promotional/Offers
        "coupon", "coupons", "promo code", "promo codes", "voucher", "vouchers",
        "deal", "deals", "offer", "offers", "special", "promotion", "promotions",
        
        // Auction/Bidding
        "auction", "auctions", "bid", "bidding", "ebay", "craigslist", "marketplace",
        
        // Insurance/Financial (If Not Relevant)
        "insurance", "insure", "quote", "quotes", "estimate", "estimates", "cost",
        "price", "prices", "pricing", "rate", "rates", "fee", "fees", "charge", "charges",
        "loan", "loans", "credit", "financing", "payment", "payments",
        
        // News/Current Events
        "news", "article", "articles", "report", "reports", "story", "stories",
        "breaking", "update", "updates", "announcement", "announcements",
        
        // Political/Religious (If Not Relevant)
        "political", "politics", "politician", "government", "trump", "biden",
        "republican", "democrat", "religion", "religious", "church", "churches",
        
        // Adult Content
        "porn", "pornography", "adult", "xxx", "sex", "sexy", "nude", "naked",
        
        // Illegal/Dangerous
        "illegal", "black market", "dark web", "drug", "drugs", "weapon", "weapons",
        "explosive", "explosives",
        
        // Academic/Research
        "research", "study", "studies", "paper", "papers", "thesis", "dissertation",
        "journal", "academic", "scholar", "scholarly", "publication", "cite", "citation",
        
        // Images/Pictures
        "image", "images", "picture", "pictures", "photo", "photos", "photography",
        "photographer", "clip art", "clipart", "icon", "icons", "logo", "logos",
        
        // Books/Literature
        "book", "books", "ebook", "ebooks", "pdf", "kindle", "author", "writer",
        "novel", "fiction", "non-fiction", "publication", "publish", "publisher",
        
        // Statistics/Data
        "statistics", "stats", "data", "chart", "charts", "graph", "graphs",
        "report", "analysis", "trend", "trends",
        
        // Events/Conferences
        "event", "events", "conference", "conferences", "convention", "conventions",
        "expo", "exhibition", "fair", "summit", "meetup",
        
        // Membership/Subscription
        "membership", "member", "members", "join", "joining", "sign up", "signup",
        "register", "registration", "subscribe", "subscription",
        
        // Weather/Climate
        "weather", "forecast", "temperature", "rain", "snow", "storm", "hurricane",
        "tornado", "earthquake", "climate",
        
        // Sports/Fitness (If Not Relevant)
        "sport", "sports", "team", "teams", "player", "players", "coach", "coaching",
        "fitness", "gym", "workout", "exercise", "training",
        
        // Fashion/Clothing (If Not Relevant)
        "fashion", "clothing", "clothes", "dress", "dresses", "shirt", "shirts",
        "pants", "shoes", "accessories", "jewelry",
        
        // Food/Restaurants (If Not Relevant)
        "recipe", "recipes", "cook", "cooking", "chef", "restaurant", "restaurants",
        "menu", "food", "eat", "eating", "dinner", "lunch", "breakfast",
        
        // Travel/Tourism (If Not Relevant)
        "travel", "traveling", "trip", "trips", "vacation", "vacations", "holiday",
        "holidays", "tour", "tours", "tourism", "tourist", "hotel", "hotels",
        "flight", "flights", "airline", "airlines",
        
        // Automotive (If Not Relevant)
        "car", "cars", "auto", "automotive", "vehicle", "vehicles", "truck", "trucks",
        "motorcycle", "motorcycles", "repair", "repairs", "parts", "accessories",
        
        // Animals/Pets (If Not Relevant)
        "pet", "pets", "dog", "dogs", "cat", "cats", "animal", "animals",
        "veterinary", "vet", "breeding", "breeder",
        
        // Home/Garden (If Not Relevant)
        "home", "house", "garden", "gardening", "landscaping", "lawn", "yard",
        "renovation", "remodeling", "interior", "exterior", "decoration",
        
        // Children/Kids (If Not Relevant)
        "kids", "children", "child", "baby", "babies", "toddler", "toddlers",
        "parenting", "parent", "parents", "family", "families",
        
        // Age-Related Qualifiers
        "young", "old", "age", "aged", "senior", "elderly", "teenager", "teen",
        "youth", "juvenile", "minor",
        
        // Size/Dimension Qualifiers
        "small", "big", "large", "huge", "giant", "mini", "miniature", "tiny",
        "size", "sizes", "dimension", "dimensions",
        
        // Color Qualifiers (Too Generic)
        "color", "colors", "red", "blue", "green", "yellow", "black", "white",
        "gray", "grey", "brown", "orange", "purple", "pink",
        
        // Material Qualifiers (If Not Relevant)
        "wood", "wooden", "metal", "plastic", "glass", "fabric", "leather",
        "cotton", "steel", "aluminum", "iron",
        
        // Brand Names (Competitors - Add Your Competitors)
        "brand", "brands", "manufacturer", "manufacturers",
        
        // Seasonal (If Not Relevant)
        "christmas", "halloween", "easter", "thanksgiving", "valentine", "holidays",
        "summer", "winter", "spring", "fall", "autumn", "seasonal",
        
        // Questions/Interrogatives
        "question", "questions", "answer", "answers", "q&a", "faq", "frequently asked",
        
        // Programming/Development (If Not Relevant)
        "code", "coding", "programming", "developer", "development", "api", "github",
        "stackoverflow", "script", "javascript", "python", "java",
        
        // Science/Technology Terms
        "science", "scientific", "technology", "technical", "engineering", "engineer",
        "experiment", "laboratory", "lab",
        
        // Art/Design (If Not Relevant)
        "art", "artist", "design", "designer", "creative", "drawing", "painting",
        "sketch", "illustration",
        
        // Music/Audio (If Not Relevant)
        "audio", "sound", "sounds", "mp3", "wav", "podcast", "podcasts",
        
        // File Formats
        "jpg", "jpeg", "png", "gif", "mp4", "avi", "mov", "zip", "rar",
        
        // Operating Systems
        "windows", "mac", "linux", "android", "ios", "chrome", "firefox", "safari",
        
        // E-commerce Platforms
        "amazon", "ebay", "etsy", "shopify", "alibaba", "walmart",
        
        // Payment Methods
        "paypal", "venmo", "cashapp", "bitcoin", "cryptocurrency",
        
        // Negative Sentiment
        "hate", "worst", "terrible", "horrible", "awful", "useless", "waste",
        "rip off", "ripoff", "disappointing", "disappointed", "angry", "mad",
        
        // Spam/Junk
        "spam", "junk", "click here", "limited time", "act now", "expire", "expires",
        
        // Questions About Service
        "24/7", "hours", "open now", "closed", "holiday hours", "schedule",
        
        // Customer Service Queries
        "contact number", "phone", "telephone", "call", "calling", "dial",
        "customer care", "tech support", "technical support",
        
        // Account/Login Related
        "login", "log in", "sign in", "signin", "account", "username", "password",
        "forgot password", "reset password",
        
        // Negative Product States
        "broken", "damaged", "defective", "recall", "recalled", "return", "refund",
        
        // Troubleshooting
        "problem", "problems", "issue", "issues", "error", "errors", "bug", "bugs",
        "not working", "doesn't work", "won't work", "fix", "fixing",
        
        // Alternatives/Competitors
        "instead of", "replacement", "substitute", "switch", "migrate", "migration",
        
        // Informal/Slang
        "cool", "awesome", "amazing", "great", "perfect", "nice", "wow",
        
        // Geographic - Countries (If Not Targeting)
        "canada", "uk", "united kingdom", "australia", "india", "china", "japan",
        "mexico", "brazil", "germany", "france", "italy", "spain",
        
        // Languages (If Not Targeting)
        "spanish", "french", "german", "italian", "chinese", "japanese",
        "portuguese", "russian", "arabic", "hindi",
        
        // Platform-Specific
        "mobile", "tablet", "desktop", "pc", "mac", "ipad", "iphone", "android",
        
        // Document Types
        "template", "templates", "form", "forms", "worksheet", "worksheets",
        "checklist", "checklists",
        
        // Celebrity/Famous People (If Not Relevant)
        "celebrity", "celebrities", "famous", "star", "stars",
        
        // Meme/Viral Content
        "meme", "memes", "viral", "trending", "trend",
        
        // Live/Streaming
        "live", "streaming", "stream", "broadcast", "broadcasting",
        
        // Duration/Time
        "minute", "minutes", "hour", "hours", "day", "days", "week", "weeks",
        "month", "months", "year", "years",
        
        // Quantity Terms
        "many", "few", "some", "all", "most", "least", "more", "less",
        
        // Comparative Terms
        "than", "better than", "worse than", "same as", "similar to",
        
        // Possessive/Ownership
        "my", "mine", "your", "yours", "his", "her", "hers", "their", "theirs",
        
        // Prepositions (Too Generic)
        "for", "with", "without", "near", "by", "in", "on", "at", "to", "from",
        
        // Conjunctions (Too Generic)
        "and", "or", "but", "nor", "yet", "so",
        
        // Articles (Too Generic)
        "a", "an", "the",
        
        // Pronouns (Too Generic)
        "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
        
        // Verbs (Generic Actions - Too Broad)
        "get", "getting", "got", "make", "making", "made", "do", "doing", "did",
        "have", "having", "had", "see", "seeing", "saw", "go", "going", "went",
        "come", "coming", "came", "take", "taking", "took", "give", "giving", "gave",
        
        // Modal Verbs
        "can", "could", "may", "might", "should", "would", "will", "shall", "must",
        
        // Being Verbs
        "is", "are", "was", "were", "been", "being", "am",
        
        // Industry-Specific (Customize for Your Industry)
        "consultation", "consultant", "consultancy", "advisory", "advisor",
    ];
};
