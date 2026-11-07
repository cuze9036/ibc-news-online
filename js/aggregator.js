// IBC News Online — Auto News Aggregator Engine
// Fetches RSS feeds via rss2json API and auto-posts to localStorage CMS

const AGG_KEY = 'ibc_news_aggregator';
const AGG_LOG_KEY = 'ibc_news_agg_log';

const DEFAULT_FEEDS = [
  { id: 'bbc-world', name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'international', enabled: true },
  { id: 'bbc-tech', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology', enabled: true },
  { id: 'bbc-business', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'business', enabled: true },
  { id: 'bbc-health', name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', category: 'health', enabled: true },
  { id: 'bbc-science', name: 'BBC Science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'science', enabled: true },
  { id: 'bbc-entertainment', name: 'BBC Entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', category: 'entertainment', enabled: true },
  { id: 'reuters-world', name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best', category: 'world', enabled: true },
  { id: 'espn-sports', name: 'ESPN Sports', url: 'https://www.espn.com/espn/rss/news', category: 'sports', enabled: true },
  { id: 'guardian-opinion', name: 'The Guardian Opinion', url: 'https://www.theguardian.com/commentisfree/rss', category: 'opinion', enabled: true },
  { id: 'hn-tech', name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'technology', enabled: false },
];

function getAggConfig() {
  try {
    const raw = localStorage.getItem(AGG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { feeds: DEFAULT_FEEDS, autoFetch: true, intervalMinutes: 60, maxPerFeed: 5, lastFetch: null };
}

function saveAggConfig(config) {
  localStorage.setItem(AGG_KEY, JSON.stringify(config));
}

function getAggLog() {
  try {
    const raw = localStorage.getItem(AGG_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function addAggLog(entry) {
  const log = getAggLog();
  log.unshift({ ...entry, time: new Date().toISOString() });
  if (log.length > 100) log.length = 100;
  localStorage.setItem(AGG_LOG_KEY, JSON.stringify(log));
}

function clearAggLog() {
  localStorage.removeItem(AGG_LOG_KEY);
}

// Fetch single RSS feed via rss2json
async function fetchFeed(feedUrl) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const resp = await fetch(apiUrl);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.status !== 'ok') throw new Error(data.message || 'Feed parse error');
  return data.items || [];
}

// --- Google Gemini AI Rewriter (FREE) ---
const GEMINI_MODEL = 'gemini-2.0-flash';

function getGeminiKey() {
  try { return (JSON.parse(localStorage.getItem('ibc_news_settings') || '{}')).geminiKey || ''; } catch { return ''; }
}

async function geminiGenerate(systemPrompt, userText, maxTokens) {
  const key = getGeminiKey();
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
    })
  });
  if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
  const data = await resp.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

async function aiRewriteTitle(title) {
  const key = getGeminiKey();
  if (!key) return rewriteTitle(title);
  try {
    const result = await geminiGenerate(
      'You are a news editor. Rewrite the given headline in a fresh, original way. Keep the core facts. Output ONLY the new headline, nothing else.',
      title, 120
    );
    return result || rewriteTitle(title);
  } catch (e) {
    console.warn('[IBC AI Rewriter] Title failed, using fallback:', e.message);
    return rewriteTitle(title);
  }
}

async function aiRewriteContent(html) {
  const key = getGeminiKey();
  if (!key) return rewriteContent(html);
  const text = (html || '').replace(/<[^>]*>/g, '').trim();
  if (!text) return '<p>Story developing. Check back for updates.</p>';
  try {
    const result = await geminiGenerate(
      'You are a professional news editor at IBC News Online. Rewrite the following article in your own words, keeping all facts accurate. Use formal journalistic style. Output HTML paragraphs (<p>...</p>). Add an editorial intro line. End with: <p><em>(This article has been compiled from international news wire services and edited by IBC News Online editorial team.)</em></p>',
      text, 1500
    );
    return result || rewriteContent(html);
  } catch (e) {
    console.warn('[IBC AI Rewriter] Content failed, using fallback:', e.message);
    return rewriteContent(html);
  }
}

async function aiRewriteExcerpt(text) {
  const key = getGeminiKey();
  if (!key) return rewriteExcerpt(text);
  const clean = (text || '').replace(/<[^>]*>/g, '').trim();
  if (!clean) return '';
  try {
    const result = await geminiGenerate(
      'Rewrite this news excerpt in 1-2 sentences, keeping the key facts. Output plain text only, no HTML.',
      clean, 150
    );
    return (result || '').slice(0, 300) || rewriteExcerpt(text);
  } catch (e) {
    return rewriteExcerpt(text);
  }
}

// --- Fallback Rewriter Engine (no API key) ---

function rewriteTitle(title) {
  if (!title) return 'Breaking Update';
  const t = title.trim();

  // Shuffle structure: move leading clause after a dash to front, etc.
  const patterns = [
    // "X says Y" → "Y, says X" or "According to X, Y"
    { rx: /^(.+?)\s+says?\s+(.+)$/i, fn: (m) => Math.random() > 0.5 ? `${m[2]}, says ${m[1]}` : `According to ${m[1]}, ${m[2]}` },
    // "X: Y" → "Y — X"
    { rx: /^([^:]{3,30}):\s*(.+)$/, fn: (m) => `${m[2]} — ${m[1]}` },
    // "X killed in Y" → "Y leaves X dead"
    { rx: /^(.+?)\s+killed\s+in\s+(.+)$/i, fn: (m) => `${m[2]}: ${m[1]} reported dead` },
    // "X announces Y" → "Y announced by X"
    { rx: /^(.+?)\s+announces?\s+(.+)$/i, fn: (m) => `${m[2]} announced by ${m[1]}` },
    // "X to Y" → "Y expected from X"
    { rx: /^(.+?)\s+to\s+(launch|start|begin|open|release|unveil)\s+(.+)$/i, fn: (m) => `${m[3]}: ${m[1]} set to ${m[2]}` },
  ];

  for (const p of patterns) {
    const m = t.match(p.rx);
    if (m) return p.fn(m);
  }

  // Fallback rewrites: prepend context phrases
  const prefixes = [
    'Report: ', 'Update: ', 'Developing: ', 'Latest: ',
    'Breaking Update: ', 'News Alert: ', 'Just In: '
  ];
  const suffixes = [
    ' — Latest Updates', ' — Full Report', ' — What We Know',
    ' — Key Details', ' — Developing Story'
  ];

  // Use prefix OR suffix, not both
  if (Math.random() > 0.5) {
    return prefixes[Math.floor(Math.random() * prefixes.length)] + t;
  } else {
    return t + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
}

function rewriteContent(html) {
  if (!html) return '<p>Story developing. Check back for updates.</p>';
  let text = html.replace(/<[^>]*>/g, '').trim();
  if (!text) return '<p>Story developing. Check back for updates.</p>';

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  // Rewrite techniques
  const rewritten = sentences.map(s => {
    let line = s.trim();
    // Swap passive/active voice patterns
    line = line.replace(/\bit is reported that\b/gi, 'Reports indicate');
    line = line.replace(/\bit has been confirmed\b/gi, 'Confirmation came');
    line = line.replace(/\baccording to sources\b/gi, 'Sources reveal');
    line = line.replace(/\baccording to\b/gi, 'As per');
    line = line.replace(/\bofficials said\b/gi, 'officials confirmed');
    line = line.replace(/\bsaid in a statement\b/gi, 'stated officially');
    line = line.replace(/\bsaid\b/gi, () => ['stated', 'noted', 'mentioned', 'remarked', 'indicated'][Math.floor(Math.random() * 5)]);
    line = line.replace(/\breported\b/gi, () => ['confirmed', 'disclosed', 'revealed', 'shared'][Math.floor(Math.random() * 4)]);
    line = line.replace(/\bannounced\b/gi, () => ['declared', 'revealed', 'unveiled', 'made known'][Math.floor(Math.random() * 4)]);
    line = line.replace(/\bkilled\b/gi, () => ['lost their lives', 'were fatally injured', 'perished'][Math.floor(Math.random() * 3)]);
    line = line.replace(/\binjured\b/gi, () => ['sustained injuries', 'were hurt', 'were wounded'][Math.floor(Math.random() * 3)]);
    line = line.replace(/\bthe government\b/gi, () => ['authorities', 'the administration', 'governing officials'][Math.floor(Math.random() * 3)]);
    line = line.replace(/\bpolice\b/gi, () => ['law enforcement', 'security forces', 'authorities'][Math.floor(Math.random() * 3)]);
    line = line.replace(/\bhowever\b/gi, () => ['nonetheless', 'on the other hand', 'yet'][Math.floor(Math.random() * 3)]);
    line = line.replace(/\balso\b/gi, () => ['additionally', 'furthermore', 'moreover'][Math.floor(Math.random() * 3)]);
    line = line.replace(/\bbut\b/gi, () => ['however', 'yet', 'nevertheless'][Math.floor(Math.random() * 3)]);
    return line;
  });

  // Shuffle middle sentences slightly (keep first and last)
  if (rewritten.length > 3) {
    const mid = rewritten.slice(1, -1);
    for (let i = mid.length - 1; i > 0; i--) {
      if (Math.random() > 0.6) {
        const j = Math.floor(Math.random() * (i + 1));
        [mid[i], mid[j]] = [mid[j], mid[i]];
      }
    }
    rewritten.splice(1, rewritten.length - 2, ...mid);
  }

  // Add IBC editorial intro
  const intros = [
    'In a developing story, ',
    'As events continue to unfold, ',
    'In a significant development, ',
    'Breaking from international wires, ',
    'According to the latest reports, ',
    'In what has drawn widespread attention, ',
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];
  rewritten[0] = intro + rewritten[0].charAt(0).toLowerCase() + rewritten[0].slice(1);

  // Build paragraphs (3-4 sentences each)
  const paragraphs = [];
  for (let i = 0; i < rewritten.length; i += 3) {
    paragraphs.push('<p>' + rewritten.slice(i, i + 3).join(' ') + '</p>');
  }

  // Add source attribution at end
  paragraphs.push('<p><em>(This article has been compiled from international news wire services and edited by IBC News Online editorial team.)</em></p>');

  return paragraphs.join('\n');
}

function rewriteExcerpt(text) {
  if (!text) return '';
  let clean = text.replace(/<[^>]*>/g, '').trim();
  // Synonym swaps on excerpt too
  clean = clean.replace(/\bsaid\b/gi, 'stated');
  clean = clean.replace(/\breported\b/gi, 'confirmed');
  clean = clean.replace(/\bannounced\b/gi, 'revealed');
  clean = clean.replace(/\baccording to\b/gi, 'as per');
  // Trim and add IBC tag
  return clean.slice(0, 280) + (clean.length > 280 ? '...' : '');
}

// Convert RSS item to article (with AI or fallback rewriting)
async function rssItemToArticle(item, feedConfig) {
  const existing = getAllArticles();
  if (existing.some(a => a.sourceUrl === item.link)) return null;

  const rawContent = item.content || item.description || '';
  const rawExcerpt = (item.description || '').replace(/<[^>]*>/g, '').slice(0, 300);
  const rawTitle = item.title || 'Untitled';

  const newTitleLower = rawTitle.toLowerCase();
  if (existing.some(a => {
    const sim = titleSimilarity(a.title.toLowerCase(), newTitleLower);
    return sim > 0.7;
  })) return null;

  const [title, content, excerpt] = await Promise.all([
    aiRewriteTitle(rawTitle),
    aiRewriteContent(rawContent),
    aiRewriteExcerpt(rawExcerpt)
  ]);

  return {
    id: 'agg_' + generateId(),
    title: title,
    category: feedConfig.category,
    author: 'IBC News Desk',
    excerpt: excerpt || title,
    content: content,
    image: item.thumbnail || item.enclosure?.link || '',
    videoUrl: '',
    tags: ['wire-service', feedConfig.category],
    featured: false,
    breaking: false,
    publishedAt: item.pubDate || new Date().toISOString(),
    views: Math.floor(Math.random() * 500) + 50,
    sourceUrl: item.link || '',
    sourceName: feedConfig.name,
    aggregated: true
  };
}

// Simple title similarity check (Jaccard on words)
function titleSimilarity(a, b) {
  const wa = new Set(a.split(/\s+/));
  const wb = new Set(b.split(/\s+/));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.max(wa.size, wb.size, 1);
}

// Fetch all enabled feeds and import new articles
async function runAggregator() {
  const config = getAggConfig();
  const feeds = config.feeds.filter(f => f.enabled);
  let totalNew = 0;
  let totalErrors = 0;
  const results = [];

  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed.url);
      const limit = config.maxPerFeed || 5;
      let added = 0;

      for (const item of items.slice(0, limit)) {
        const article = await rssItemToArticle(item, feed);
        if (article) {
          saveArticle(article);
          added++;
          totalNew++;
        }
      }

      results.push({ feed: feed.name, status: 'ok', added, total: items.length });
      addAggLog({ feed: feed.name, status: 'ok', added, total: items.length });
    } catch (err) {
      totalErrors++;
      results.push({ feed: feed.name, status: 'error', error: err.message });
      addAggLog({ feed: feed.name, status: 'error', error: err.message });
    }
  }

  config.lastFetch = new Date().toISOString();
  saveAggConfig(config);

  return { totalNew, totalErrors, results, feedsChecked: feeds.length };
}

// Auto-scheduler: runs aggregator on interval
let aggTimer = null;

function startAutoAggregator() {
  const config = getAggConfig();
  if (!config.autoFetch) return;
  stopAutoAggregator();
  const ms = (config.intervalMinutes || 60) * 60 * 1000;
  aggTimer = setInterval(() => {
    runAggregator().then(r => {
      if (r.totalNew > 0) {
        console.log(`[IBC Aggregator] Fetched ${r.totalNew} new articles from ${r.feedsChecked} feeds`);
      }
    }).catch(console.error);
  }, ms);
}

function stopAutoAggregator() {
  if (aggTimer) { clearInterval(aggTimer); aggTimer = null; }
}

// Add a custom feed
function addFeed(name, url, category) {
  const config = getAggConfig();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (config.feeds.some(f => f.id === id || f.url === url)) return false;
  config.feeds.push({ id, name, url, category, enabled: true });
  saveAggConfig(config);
  return true;
}

function removeFeed(id) {
  const config = getAggConfig();
  config.feeds = config.feeds.filter(f => f.id !== id);
  saveAggConfig(config);
}

function toggleFeed(id) {
  const config = getAggConfig();
  const feed = config.feeds.find(f => f.id === id);
  if (feed) { feed.enabled = !feed.enabled; saveAggConfig(config); }
}

function removeAggregatedArticles() {
  const articles = getAllArticles().filter(a => !a.aggregated);
  localStorage.setItem(DB_KEY, JSON.stringify(articles));
}
