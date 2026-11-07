// IBC News Online — Data Layer (localStorage CMS)
const DB_KEY = 'ibc_news_articles';
const CATEGORIES_KEY = 'ibc_news_categories';
const SETTINGS_KEY = 'ibc_news_settings';
const BREAKING_KEY = 'ibc_news_breaking';

const DEFAULT_CATEGORIES = [
  { id: 'national', name: 'National', slug: 'national' },
  { id: 'international', name: 'International', slug: 'international' },
  { id: 'politics', name: 'Politics', slug: 'politics' },
  { id: 'business', name: 'Business', slug: 'business' },
  { id: 'technology', name: 'Technology', slug: 'technology' },
  { id: 'sports', name: 'Sports', slug: 'sports' },
  { id: 'entertainment', name: 'Entertainment', slug: 'entertainment' },
  { id: 'health', name: 'Health', slug: 'health' },
  { id: 'science', name: 'Science', slug: 'science' },
  { id: 'opinion', name: 'Opinion', slug: 'opinion' },
  { id: 'world', name: 'World', slug: 'world' },
  { id: 'lifestyle', name: 'Lifestyle', slug: 'lifestyle' }
];

const SAMPLE_ARTICLES = [
  {
    id: 'a1',
    title: 'Global Climate Summit 2026: World Leaders Agree on Historic Carbon Reduction Treaty',
    excerpt: 'In a landmark decision, representatives from 195 nations signed the most ambitious climate agreement since the Paris Accord, committing to a 60% reduction in carbon emissions by 2035.',
    content: `<p>In a landmark decision at the Global Climate Summit held in Geneva, representatives from 195 nations signed what experts are calling the most ambitious climate agreement since the Paris Accord.</p><p>The treaty, formally known as the Geneva Climate Compact, commits signatory nations to achieving a 60% reduction in carbon emissions by 2035, with interim targets set for 2028 and 2032.</p><p>"This is a historic moment for our planet," said UN Secretary-General during the closing ceremony. "For the first time, we have a binding agreement that matches the scale of the climate crisis."</p><p>Key provisions of the compact include:</p><ul><li>Mandatory carbon pricing mechanisms in all signatory nations by 2028</li><li>A $500 billion annual climate finance fund for developing nations</li><li>Phase-out of coal power by 2030 in developed nations</li><li>Binding methane reduction targets across all sectors</li></ul><p>The agreement also establishes a new international monitoring body with the authority to verify compliance and recommend sanctions for nations that fail to meet their targets.</p>`,
    category: 'international',
    author: 'Sarah Mitchell',
    image: '',
    featured: true,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    views: 15420,
    tags: ['climate', 'summit', 'treaty', 'carbon']
  },
  {
    id: 'a2',
    title: 'Tech Giants Report Record AI Investment as Industry Transformation Accelerates',
    excerpt: 'Major technology companies collectively invested over $200 billion in artificial intelligence development this year, reshaping industries from healthcare to finance.',
    content: `<p>The world's leading technology companies have collectively invested over $200 billion in artificial intelligence research and development in 2026, marking a 150% increase from the previous year.</p><p>The surge in AI spending is being driven by breakthroughs in generative AI, autonomous systems, and enterprise automation tools that are rapidly transforming traditional business models.</p><p>Industry analysts note that this investment wave is creating new job categories while displacing others, leading to calls for comprehensive workforce retraining programs.</p><p>"We're witnessing the most significant technological transformation since the internet," said a prominent industry analyst. "Companies that fail to adapt risk becoming irrelevant within the next five years."</p>`,
    category: 'technology',
    author: 'James Chen',
    image: '',
    featured: true,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    views: 12300,
    tags: ['AI', 'technology', 'investment']
  },
  {
    id: 'a3',
    title: 'Breaking: Major Earthquake Hits Pacific Region, Tsunami Warnings Issued',
    excerpt: 'A 7.8 magnitude earthquake struck the Pacific Ring of Fire, prompting immediate tsunami warnings across multiple coastal nations.',
    content: `<p>A powerful 7.8 magnitude earthquake struck the Pacific Ring of Fire early this morning, sending shockwaves across the region and prompting immediate tsunami warnings for multiple coastal nations.</p><p>Emergency services have been mobilized across the affected areas, with evacuation orders issued for low-lying coastal communities.</p><p>The earthquake's epicenter was located approximately 120 kilometers off the coast, at a depth of 35 kilometers. Initial reports indicate significant structural damage in several urban areas.</p><p>International aid organizations have begun mobilizing relief efforts, with emergency supplies being staged at regional hubs.</p>`,
    category: 'world',
    author: 'Maria Rodriguez',
    image: '',
    featured: false,
    breaking: true,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
    views: 28900,
    tags: ['earthquake', 'tsunami', 'emergency']
  },
  {
    id: 'a4',
    title: 'Stock Markets Rally as Central Banks Signal Rate Cuts in 2027',
    excerpt: 'Global stock markets surged following coordinated signals from major central banks indicating a shift toward monetary easing in the coming year.',
    content: `<p>Global stock markets experienced their strongest rally in months after central banks from the US, Europe, and Asia simultaneously signaled a shift toward monetary easing policies expected to begin in early 2027.</p><p>The coordinated messaging sent the S&P 500 up 3.2%, while European markets gained an average of 2.8%. Asian markets followed suit in overnight trading.</p><p>Economists say the pivot reflects growing confidence that inflation has been brought under control, with consumer price indices in most major economies now trending below 3%.</p>`,
    category: 'business',
    author: 'David Park',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    views: 8700,
    tags: ['stocks', 'markets', 'economy', 'rates']
  },
  {
    id: 'a5',
    title: 'FIFA World Cup 2026: Host Cities Reveal Final Stadium Preparations',
    excerpt: 'With the tournament just months away, host cities across North America showcase state-of-the-art venues and infrastructure upgrades.',
    content: `<p>Host cities across the United States, Canada, and Mexico have unveiled the final preparations for the 2026 FIFA World Cup, showcasing world-class stadiums and extensive infrastructure upgrades.</p><p>The tournament, set to be the largest in World Cup history with 48 teams competing, will feature matches in 16 cities across three countries.</p><p>Stadium upgrades include advanced cooling systems, expanded seating capacities, and cutting-edge broadcast facilities designed to deliver an unprecedented viewing experience.</p><p>Transportation infrastructure has also received significant investment, with new transit lines and highway improvements connecting venues to city centers and airports.</p>`,
    category: 'sports',
    author: 'Alex Thompson',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    views: 19500,
    tags: ['FIFA', 'world cup', 'football', 'stadiums']
  },
  {
    id: 'a6',
    title: 'New Study Reveals Breakthrough in Alzheimer\'s Treatment',
    excerpt: 'Researchers announce a promising new drug therapy that has shown significant results in slowing cognitive decline in early-stage Alzheimer\'s patients.',
    content: `<p>A groundbreaking clinical trial has demonstrated that a new combination drug therapy can slow cognitive decline by up to 45% in patients with early-stage Alzheimer's disease.</p><p>The Phase III trial, conducted across 200 medical centers in 15 countries, enrolled over 5,000 participants and ran for three years.</p><p>"These results exceed our most optimistic projections," said the lead researcher. "For the first time, we have a treatment that doesn't just manage symptoms but actually slows the underlying disease progression."</p><p>The therapy combines two novel compounds that target different mechanisms of the disease — one that reduces amyloid plaque buildup and another that protects neural connections from degradation.</p>`,
    category: 'health',
    author: 'Dr. Emily Watson',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
    views: 11200,
    tags: ['alzheimers', 'medical', 'breakthrough', 'health']
  },
  {
    id: 'a7',
    title: 'Opinion: The Future of Remote Work Is Hybrid, and Companies Must Adapt',
    excerpt: 'As the dust settles on the remote work revolution, it\'s clear that the future lies not in fully remote or fully in-office models, but in a thoughtful hybrid approach.',
    content: `<p>The debate over remote work has evolved significantly since the pandemic era. As we approach 2027, the data is clear: hybrid work models consistently outperform both fully remote and fully in-office arrangements in terms of productivity, employee satisfaction, and retention.</p><p>Companies that have embraced flexible hybrid models report 23% higher employee satisfaction scores and 18% lower turnover rates compared to those mandating full-time office attendance.</p><p>The key to successful hybrid implementation lies in intentional design — not simply allowing employees to work from home two days a week, but thoughtfully structuring which activities benefit from in-person collaboration and which are better suited to focused remote work.</p><p><em>The views expressed in this article are those of the author and do not necessarily reflect the editorial position of IBC News Online.</em></p>`,
    category: 'opinion',
    author: 'Prof. Michael Torres',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 36000000).toISOString(),
    views: 6800,
    tags: ['remote work', 'hybrid', 'workplace', 'opinion']
  },
  {
    id: 'a8',
    title: 'Space Agency Announces Manned Mars Mission Timeline for 2032',
    excerpt: 'After years of development, the international space consortium has unveiled a detailed timeline for the first manned mission to Mars.',
    content: `<p>The International Mars Exploration Consortium (IMEC) has announced a definitive timeline for the first crewed mission to Mars, targeting a launch window in September 2032.</p><p>The mission plan involves a crew of six astronauts from five different countries, who will spend approximately 18 months in transit and 60 days on the Martian surface.</p><p>Preparatory missions, including automated habitat construction and supply deliveries, are scheduled to begin in 2029.</p><p>The estimated cost of the program is $180 billion, shared among 12 participating nations and several private space companies.</p>`,
    category: 'science',
    author: 'Dr. Kenji Yamamoto',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 43200000).toISOString(),
    views: 14600,
    tags: ['mars', 'space', 'NASA', 'exploration']
  },
  {
    id: 'a9',
    title: 'Election Results: Historic Voter Turnout Shapes New Political Landscape',
    excerpt: 'Record-breaking voter participation in regional elections signals a shift in political engagement, with youth turnout reaching unprecedented levels.',
    content: `<p>Regional elections across multiple states recorded historic voter turnout, with overall participation rates exceeding 72% — the highest in four decades.</p><p>Most notably, voter turnout among 18-29 year olds surged to 58%, nearly double the figure from the previous election cycle. Analysts attribute this increase to digital voter registration drives and increased political engagement on social media platforms.</p><p>The results have reshaped the political landscape significantly, with several long-held seats changing hands and new parties gaining representation for the first time.</p>`,
    category: 'politics',
    author: 'Rachel Kim',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 50400000).toISOString(),
    views: 9300,
    tags: ['election', 'voting', 'politics', 'democracy']
  },
  {
    id: 'a10',
    title: 'Bollywood\'s Latest Blockbuster Breaks All-Time Box Office Records',
    excerpt: 'The highly anticipated action thriller has shattered domestic and international box office records in its opening weekend.',
    content: `<p>The latest Bollywood action thriller has shattered all-time box office records, earning over ₹500 crore in its opening weekend globally.</p><p>The film, which features cutting-edge visual effects and a star-studded cast, has been praised by critics for its innovative storytelling and technical achievements.</p><p>International markets contributed significantly to the total, with strong performances in North America, the UK, and the Middle East.</p><p>Industry experts predict the film could become the highest-grossing Indian film in history within its first month of release.</p>`,
    category: 'entertainment',
    author: 'Priya Sharma',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    publishedAt: new Date(Date.now() - 57600000).toISOString(),
    views: 22100,
    tags: ['bollywood', 'movies', 'box office']
  },
  {
    id: 'a11',
    title: 'National Infrastructure Bill Promises $2 Trillion in Development Projects',
    excerpt: 'The sweeping infrastructure legislation aims to modernize transportation, energy grids, and digital connectivity across the nation.',
    content: `<p>Lawmakers have passed a landmark infrastructure bill allocating $2 trillion over the next decade for comprehensive modernization of the nation's physical and digital infrastructure.</p><p>Key allocations include $600 billion for transportation, $400 billion for clean energy transition, $300 billion for broadband expansion, and $200 billion for water systems.</p><p>The bill is expected to create an estimated 15 million jobs over its implementation period and significantly boost economic growth in underserved regions.</p>`,
    category: 'national',
    author: 'John Williams',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 64800000).toISOString(),
    views: 7500,
    tags: ['infrastructure', 'economy', 'development']
  },
  {
    id: 'a12',
    title: 'Wellness Trends 2027: Longevity Science Goes Mainstream',
    excerpt: 'From NAD+ supplements to cold plunge therapy, longevity-focused health practices are moving from niche biohacking to mainstream wellness culture.',
    content: `<p>The longevity wellness market has exploded in 2026, with practices once considered fringe biohacking now embraced by mainstream health and fitness culture.</p><p>Cold plunge therapy, red light treatment, and supplements targeting cellular aging have become standard offerings at gyms and wellness centers worldwide.</p><p>The global longevity market is projected to reach $44 billion by 2028, driven by an aging population increasingly focused on healthspan rather than just lifespan.</p>`,
    category: 'lifestyle',
    author: 'Nina Patel',
    image: '',
    featured: false,
    breaking: false,
    videoUrl: '',
    publishedAt: new Date(Date.now() - 72000000).toISOString(),
    views: 5400,
    tags: ['wellness', 'longevity', 'health', 'lifestyle']
  }
];

// --- Storage helpers ---
function getArticles() {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveArticles(articles) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(articles)); } catch {}
}

function initData() {
  if (!getArticles()) {
    saveArticles(SAMPLE_ARTICLES);
  }
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(BREAKING_KEY)) {
    localStorage.setItem(BREAKING_KEY, JSON.stringify({
      enabled: true,
      text: 'Breaking: Major Earthquake Hits Pacific Region — Tsunami Warnings Issued for Multiple Coastal Nations'
    }));
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      siteName: 'IBC News Online',
      tagline: 'Your Trusted Source for Global News',
      logo: 'IBC<span class="logo-highlight">NEWS</span>',
      adminPassword: 'admin123'
    }));
  }
}

function getAllArticles() {
  return getArticles() || SAMPLE_ARTICLES;
}

function getArticleById(id) {
  return getAllArticles().find(a => a.id === id);
}

function getArticlesByCategory(cat) {
  return getAllArticles().filter(a => a.category === cat).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function getFeaturedArticles() {
  return getAllArticles().filter(a => a.featured).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function getBreakingArticles() {
  return getAllArticles().filter(a => a.breaking).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function getLatestArticles(limit = 10) {
  return getAllArticles().sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, limit);
}

function getTrendingArticles(limit = 5) {
  return getAllArticles().sort((a,b) => b.views - a.views).slice(0, limit);
}

function getVideoArticles(limit = 6) {
  return getAllArticles().filter(a => a.videoUrl).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, limit);
}

function getCategories() {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
}

function getBreakingNews() {
  try {
    const data = localStorage.getItem(BREAKING_KEY);
    return data ? JSON.parse(data) : { enabled: false, text: '' };
  } catch { return { enabled: false, text: '' }; }
}

function getSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveArticle(article) {
  const articles = getAllArticles();
  const idx = articles.findIndex(a => a.id === article.id);
  if (idx >= 0) {
    articles[idx] = article;
  } else {
    articles.unshift(article);
  }
  saveArticles(articles);
}

function deleteArticle(id) {
  const articles = getAllArticles().filter(a => a.id !== id);
  saveArticles(articles);
}

function generateId() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

initData();
