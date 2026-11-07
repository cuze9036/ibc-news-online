// IBC News Online — Fully Automated News Aggregator Engine
// Fetches ALL feeds every 15 min, auto-rewrites and posts to localStorage CMS

const AGG_KEY = 'ibc_news_aggregator';
const AGG_LOG_KEY = 'ibc_news_agg_log';

const DEFAULT_FEEDS = [
  // --- NATIONAL ---
  { id: 'ndtv-india', name: 'NDTV India', url: 'https://feeds.feedburner.com/ndtvnews-india-news', category: 'national', enabled: true },
  { id: 'toi-india', name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', category: 'national', enabled: true },

  // --- INTERNATIONAL ---
  { id: 'bbc-world', name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'international', enabled: true },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international', enabled: true },

  // --- POLITICS ---
  { id: 'bbc-politics', name: 'BBC Politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', category: 'politics', enabled: true },
  { id: 'guardian-politics', name: 'Guardian Politics', url: 'https://www.theguardian.com/politics/rss', category: 'politics', enabled: true },

  // --- BUSINESS ---
  { id: 'bbc-business', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'business', enabled: true },
  { id: 'cnbc', name: 'CNBC Top News', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', category: 'business', enabled: true },

  // --- TECHNOLOGY ---
  { id: 'bbc-tech', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology', enabled: true },
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology', enabled: true },

  // --- SPORTS ---
  { id: 'bbc-sport', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'sports', enabled: true },
  { id: 'espn-sports', name: 'ESPN Sports', url: 'https://www.espn.com/espn/rss/news', category: 'sports', enabled: true },

  // --- ENTERTAINMENT ---
  { id: 'bbc-entertainment', name: 'BBC Entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', category: 'entertainment', enabled: true },
  { id: 'variety', name: 'Variety', url: 'https://variety.com/feed/', category: 'entertainment', enabled: true },

  // --- HEALTH ---
  { id: 'bbc-health', name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', category: 'health', enabled: true },

  // --- SCIENCE ---
  { id: 'bbc-science', name: 'BBC Science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'science', enabled: true },
  { id: 'space-com', name: 'Space.com', url: 'https://www.space.com/feeds/all', category: 'science', enabled: true },

  // --- OPINION ---
  { id: 'guardian-opinion', name: 'Guardian Opinion', url: 'https://www.theguardian.com/commentisfree/rss', category: 'opinion', enabled: true },

  // --- WORLD ---
  { id: 'guardian-world', name: 'Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'world', enabled: true },

  // --- LIFESTYLE ---
  { id: 'lifehacker', name: 'Lifehacker', url: 'https://lifehacker.com/feed/rss', category: 'lifestyle', enabled: true },
];

const AUTO_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ARTICLE_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours — auto-cleanup old aggregated articles
const MAX_ARTICLES_TOTAL = 200; // cap to prevent localStorage bloat

function getAggConfig() {
  try {
    const raw = localStorage.getItem(AGG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (!cfg.feeds || cfg.feeds.length < DEFAULT_FEEDS.length) {
        cfg.feeds = DEFAULT_FEEDS;
        saveAggConfig(cfg);
      }
      return cfg;
    }
  } catch {}
  return { feeds: DEFAULT_FEEDS, autoFetch: true, intervalMinutes: 15, maxPerFeed: 4, lastFetch: null };
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

// Fetch single RSS feed — rss2json with retry, then allorigins fallback
async function fetchFeed(feedUrl) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
      const resp = await fetch(apiUrl);
      if (resp.status === 429) {
        if (attempt === 0) { await delay(10000); continue; }
        throw new Error('rate-limited');
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.status !== 'ok') throw new Error(data.message || 'Feed parse error');
      return data.items || [];
    } catch (e) {
      if (attempt === 1 || e.message !== 'rate-limited') return fetchFeedFallback(feedUrl);
    }
  }
  return fetchFeedFallback(feedUrl);
}

function parseFeedXml(text) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const items = [];
  xml.querySelectorAll('item, entry').forEach(entry => {
    const getTag = (tags) => {
      for (const t of tags) {
        const el = entry.querySelector(t);
        if (el) return el.textContent || '';
      }
      return '';
    };
    const linkEl = entry.querySelector('link');
    const link = linkEl ? (linkEl.getAttribute('href') || linkEl.textContent || '') : '';
    const enc = entry.querySelector('enclosure');
    const media = entry.querySelector('thumbnail, content');
    const thumbnail = enc ? (enc.getAttribute('url') || '') : (media ? (media.getAttribute('url') || '') : '');
    items.push({
      title: getTag(['title']),
      link,
      description: getTag(['description', 'summary']),
      content: getTag(['description', 'summary']),
      pubDate: getTag(['pubDate', 'published', 'updated']),
      thumbnail,
    });
  });
  return items;
}

async function fetchFeedFallback(feedUrl) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}&t=${Date.now()}`;
  try {
    const resp = await fetch(proxyUrl);
    if (resp.ok) {
      const json = await resp.json();
      if (json.contents && json.contents.includes('<')) return parseFeedXml(json.contents);
    }
  } catch {}
  throw new Error('Fallback proxy failed');
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
    console.warn('[IBC AI] Title fallback:', e.message);
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
    console.warn('[IBC AI] Content fallback:', e.message);
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
  const patterns = [
    { rx: /^(.+?)\s+says?\s+(.+)$/i, fn: (m) => Math.random() > 0.5 ? `${m[2]}, says ${m[1]}` : `According to ${m[1]}, ${m[2]}` },
    { rx: /^([^:]{3,30}):\s*(.+)$/, fn: (m) => `${m[2]} — ${m[1]}` },
    { rx: /^(.+?)\s+killed\s+in\s+(.+)$/i, fn: (m) => `${m[2]}: ${m[1]} reported dead` },
    { rx: /^(.+?)\s+announces?\s+(.+)$/i, fn: (m) => `${m[2]} announced by ${m[1]}` },
    { rx: /^(.+?)\s+to\s+(launch|start|begin|open|release|unveil)\s+(.+)$/i, fn: (m) => `${m[3]}: ${m[1]} set to ${m[2]}` },
  ];
  for (const p of patterns) {
    const m = t.match(p.rx);
    if (m) return p.fn(m);
  }
  const prefixes = ['Report: ', 'Update: ', 'Developing: ', 'Latest: ', 'Breaking Update: ', 'News Alert: ', 'Just In: '];
  const suffixes = [' — Latest Updates', ' — Full Report', ' — What We Know', ' — Key Details', ' — Developing Story'];
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
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const rewritten = sentences.map(s => {
    let line = s.trim();
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
  const intros = [
    'In a developing story, ', 'As events continue to unfold, ', 'In a significant development, ',
    'Breaking from international wires, ', 'According to the latest reports, ', 'In what has drawn widespread attention, ',
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];
  rewritten[0] = intro + rewritten[0].charAt(0).toLowerCase() + rewritten[0].slice(1);
  const paragraphs = [];
  for (let i = 0; i < rewritten.length; i += 3) {
    paragraphs.push('<p>' + rewritten.slice(i, i + 3).join(' ') + '</p>');
  }
  paragraphs.push('<p><em>(This article has been compiled from international news wire services and edited by IBC News Online editorial team.)</em></p>');
  return paragraphs.join('\n');
}

function rewriteExcerpt(text) {
  if (!text) return '';
  let clean = text.replace(/<[^>]*>/g, '').trim();
  clean = clean.replace(/\bsaid\b/gi, 'stated');
  clean = clean.replace(/\breported\b/gi, 'confirmed');
  clean = clean.replace(/\bannounced\b/gi, 'revealed');
  clean = clean.replace(/\baccording to\b/gi, 'as per');
  return clean.slice(0, 280) + (clean.length > 280 ? '...' : '');
}

// Convert RSS item to article
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

function titleSimilarity(a, b) {
  const wa = new Set(a.split(/\s+/));
  const wb = new Set(b.split(/\s+/));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.max(wa.size, wb.size, 1);
}

// Cleanup old aggregated articles and cap total
function cleanupOldArticles() {
  const articles = getAllArticles();
  const now = Date.now();
  const kept = [];
  let removed = 0;
  for (const a of articles) {
    if (a.aggregated && (now - new Date(a.publishedAt).getTime()) > MAX_ARTICLE_AGE_MS) {
      removed++;
    } else {
      kept.push(a);
    }
  }
  // Cap total: keep newest first
  if (kept.length > MAX_ARTICLES_TOTAL) {
    kept.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    kept.length = MAX_ARTICLES_TOTAL;
  }
  if (removed > 0 || articles.length > MAX_ARTICLES_TOTAL) {
    localStorage.setItem(DB_KEY, JSON.stringify(kept));
    console.log(`[IBC Aggregator] Cleaned up ${removed} old articles, total now: ${kept.length}`);
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Run aggregator — ALL enabled feeds, staggered to avoid rate limits
async function runAggregator() {
  const config = getAggConfig();
  const feeds = config.feeds.filter(f => f.enabled);
  let totalNew = 0;
  let totalErrors = 0;
  const results = [];

  cleanupOldArticles();

  for (let i = 0; i < feeds.length; i++) {
    const feed = feeds[i];
    if (i > 0) await delay(6000);
    try {
      const items = await fetchFeed(feed.url);
      const limit = config.maxPerFeed || 4;
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

  if (totalNew > 0) {
    if (typeof renderHero === 'function') try { renderHero(); } catch {}
    if (typeof renderLatestNews === 'function') try { renderLatestNews(); } catch {}
    if (typeof renderTrending === 'function') try { renderTrending(); } catch {}
    if (typeof renderCategoryNews === 'function') try { renderCategoryNews('all'); } catch {}
  }

  console.log(`[IBC Aggregator] ${totalNew} new articles from ${feeds.length} feeds (${totalErrors} errors)`);
  return { totalNew, totalErrors, results, feedsChecked: feeds.length };
}

// Auto-scheduler
let aggTimer = null;

function startAutoAggregator() {
  stopAutoAggregator();

  runAggregator().catch(e => console.warn('[IBC Aggregator] Initial fetch error:', e.message));

  aggTimer = setInterval(() => {
    runAggregator().catch(e => console.warn('[IBC Aggregator] Cycle error:', e.message));
  }, AUTO_INTERVAL_MS);

  console.log('[IBC Aggregator] Auto-mode ON — all feeds every 15 min');
}

function stopAutoAggregator() {
  if (aggTimer) { clearInterval(aggTimer); aggTimer = null; }
}

// Add/remove/toggle feeds (admin panel use)
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

// --- AUTO-START ON PAGE LOAD ---
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      startAutoAggregator();
    }, 3000); // 3 sec delay to let page render first
  });
}
