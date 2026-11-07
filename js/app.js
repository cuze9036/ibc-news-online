// IBC News Online — Main Application Script

document.addEventListener('DOMContentLoaded', () => {
  initData();
  renderNav();
  renderBreakingTicker();
  renderHero();
  renderLatestNews();
  renderTrending();
  renderVideoSection();
  renderCategoryTabs();
  renderOpinionSection();
  renderFooter();
  updateDateTime();
  setInterval(updateDateTime, 30000);
  initBackToTop();
  initTheme();
});

// --- Date/Time ---
function updateDateTime() {
  const now = new Date();
  const dateEl = document.getElementById('currentDate');
  const timeEl = document.getElementById('currentTime');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fy = document.getElementById('footerYear');
  if (fy) fy.textContent = now.getFullYear();
}

// --- Nav ---
function renderNav() {
  const list = document.getElementById('navList');
  if (!list) return;
  const cats = getCategories();
  cats.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" onclick="filterByCategory('${c.slug}', event)">${c.name}</a>`;
    list.appendChild(li);
  });
}

function toggleMobileNav() {
  const nav = document.getElementById('mainNav');
  nav.classList.toggle('mobile-open');
}

// --- Breaking Ticker ---
function renderBreakingTicker() {
  const bn = getBreakingNews();
  const ticker = document.getElementById('breakingTicker');
  const tickerText = document.getElementById('tickerText');
  if (!ticker || !tickerText) return;
  if (bn.enabled && bn.text) {
    tickerText.textContent = bn.text + '   |||   ' + bn.text + '   |||   ' + bn.text;
    ticker.style.display = 'flex';
  } else {
    const breakingArticles = getBreakingArticles();
    if (breakingArticles.length > 0) {
      const txt = breakingArticles.map(a => a.title).join('   |||   ');
      tickerText.textContent = txt + '   |||   ' + txt;
      ticker.style.display = 'flex';
    }
  }
}

// --- Hero ---
function renderHero() {
  const grid = document.getElementById('heroGrid');
  if (!grid) return;
  const featured = getFeaturedArticles();
  const latest = getLatestArticles(20);
  const mainArticle = featured[0] || latest[0];
  const sideArticles = (featured.length > 1 ? featured.slice(1, 4) : latest.slice(1, 4));

  let html = '';
  if (mainArticle) {
    const cat = getCategories().find(c => c.id === mainArticle.category);
    html += `
      <div class="hero-main" onclick="openArticle('${mainArticle.id}')">
        <div class="hero-main-img">
          <img src="${articleImg(mainArticle)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(mainArticle.category,mainArticle.id)}'">
        </div>
        <div class="hero-main-overlay"></div>
        <div class="hero-main-content">
          <span class="category-tag">${cat ? cat.name : mainArticle.category}</span>
          <h2>${mainArticle.title}</h2>
          <p>${mainArticle.excerpt}</p>
          <div class="hero-meta">
            <span>${mainArticle.author}</span>
            <span>${formatDate(mainArticle.publishedAt)}</span>
            <span>${formatViews(mainArticle.views)} views</span>
          </div>
        </div>
      </div>`;
  }

  html += '<div class="hero-sidebar">';
  sideArticles.forEach(a => {
    const cat = getCategories().find(c => c.id === a.category);
    html += `
      <div class="hero-side-card" onclick="openArticle('${a.id}')">
        <div class="hero-side-img">
          <img src="${articleImg(a)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(a.category,a.id)}'">
        </div>
        <div class="hero-side-info">
          <span class="category-tag">${cat ? cat.name : a.category}</span>
          <h3>${a.title}</h3>
          <div class="meta">${a.author} &middot; ${formatDate(a.publishedAt)}</div>
        </div>
      </div>`;
  });
  html += '</div>';
  grid.innerHTML = html;
}

// --- Latest News ---
function renderLatestNews() {
  const grid = document.getElementById('latestGrid');
  if (!grid) return;
  const articles = getLatestArticles(6);
  grid.innerHTML = articles.map(a => {
    const cat = getCategories().find(c => c.id === a.category);
    return `
      <div class="news-card" onclick="openArticle('${a.id}')">
        <div class="news-card-img">
          <img src="${articleImg(a)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(a.category,a.id)}'">
          ${a.videoUrl ? '<span class="video-badge">&#9654; Video</span>' : ''}
        </div>
        <div class="news-card-body">
          <span class="category-tag">${cat ? cat.name : a.category}</span>
          <h3>${a.title}</h3>
          <p>${a.excerpt}</p>
          <div class="news-card-meta">
            <span>${a.author}</span>
            <span>${formatDate(a.publishedAt)}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// --- Trending ---
function renderTrending() {
  const list = document.getElementById('trendingList');
  if (!list) return;
  const trending = getTrendingArticles(5);
  list.innerHTML = trending.map((a, i) => `
    <div class="trending-item" onclick="openArticle('${a.id}')">
      <div class="trending-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="trending-info">
        <h4>${a.title}</h4>
        <div class="meta">${formatDate(a.publishedAt)} &middot; ${formatViews(a.views)} views</div>
      </div>
    </div>`).join('');
}

// --- Videos ---
function renderVideoSection() {
  const section = document.getElementById('videoSection');
  const grid = document.getElementById('videoGrid');
  if (!section || !grid) return;
  const videos = getVideoArticles(6);
  if (videos.length === 0) return;
  section.style.display = 'block';
  grid.innerHTML = videos.map(a => `
    <div class="video-card" onclick="openArticle('${a.id}')"
      <div class="video-thumb">
        <div class="play-icon">&#9654;</div>
      </div>
      <div class="video-card-body">
        <h3>${a.title}</h3>
        <div class="meta">${formatDate(a.publishedAt)}</div>
      </div>
    </div>`).join('');
}

// --- Category Tabs ---
function renderCategoryTabs() {
  const tabs = document.getElementById('categoryTabs');
  if (!tabs) return;
  const cats = getCategories().slice(0, 8);
  tabs.innerHTML = cats.map((c, i) =>
    `<button class="category-tab${i === 0 ? ' active' : ''}" onclick="switchCategory('${c.slug}', this)">${c.name}</button>`
  ).join('');
  if (cats.length > 0) renderCategoryNews(cats[0].slug);
}

function switchCategory(slug, btn) {
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderCategoryNews(slug);
}

function renderCategoryNews(slug) {
  const list = document.getElementById('categoryNewsList');
  if (!list) return;
  const articles = getArticlesByCategory(slug).slice(0, 5);
  if (articles.length === 0) {
    list.innerHTML = '<p style="padding:20px;color:#888;">No articles in this category yet.</p>';
    return;
  }
  list.innerHTML = articles.map(a => `
    <div class="news-list-item" onclick="openArticle('${a.id}')">
      <div class="news-list-img">
        <img src="${articleImg(a)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(a.category,a.id)}'">
      </div>
      <div class="news-list-content">
        <span class="category-tag">${slug}</span>
        <h3>${a.title}</h3>
        <p>${a.excerpt}</p>
        <div class="news-card-meta">
          <span>${a.author} &middot; ${formatDate(a.publishedAt)}</span>
          <span>${formatViews(a.views)} views</span>
        </div>
      </div>
    </div>`).join('');
}

// --- Opinion ---
function renderOpinionSection() {
  const section = document.getElementById('opinionSection');
  const grid = document.getElementById('opinionGrid');
  if (!section || !grid) return;
  const opinions = getArticlesByCategory('opinion').slice(0, 3);
  if (opinions.length === 0) return;
  section.style.display = 'block';
  grid.innerHTML = opinions.map(a => `
    <div class="opinion-card" onclick="openArticle('${a.id}')">
      <div class="opinion-author">
        <div class="opinion-avatar">${a.author.charAt(0)}</div>
        <div class="opinion-author-info">
          <h4>${a.author}</h4>
          <span>${formatDate(a.publishedAt)}</span>
        </div>
      </div>
      <h3>${a.title}</h3>
      <p>${a.excerpt}</p>
    </div>`).join('');
}

// --- Footer ---
function renderFooter() {
  const fc = document.getElementById('footerCategories');
  if (!fc) return;
  const cats = getCategories().slice(0, 8);
  fc.innerHTML = cats.map(c => `<li><a href="#" onclick="filterByCategory('${c.slug}', event)">${c.name}</a></li>`).join('');
}

// --- Article View ---
function openArticle(id) {
  const article = getArticleById(id);
  if (!article) return;

  // Increment views
  article.views = (article.views || 0) + 1;
  saveArticle(article);

  const cat = getCategories().find(c => c.id === article.category);
  document.getElementById('articleCatBreadcrumb').textContent = cat ? cat.name : article.category;
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleAuthor').textContent = article.author;
  document.getElementById('articleDate').textContent = formatFullDate(article.publishedAt);
  document.getElementById('articleViews').textContent = formatViews(article.views) + ' views';
  document.getElementById('articleBody').innerHTML = article.content;

  const tagsEl = document.getElementById('articleTags');
  tagsEl.innerHTML = (article.tags || []).map(t => `<span class="article-tag">#${t}</span>`).join('');

  // Related articles sidebar
  const sidebar = document.getElementById('articleSidebar');
  const related = getArticlesByCategory(article.category).filter(a => a.id !== id).slice(0, 4);
  let sidebarHtml = '<div class="sidebar-widget"><div class="widget-header">Related News</div><div class="widget-body">';
  related.forEach(a => {
    sidebarHtml += `
      <div class="trending-item" onclick="openArticle('${a.id}')">
        <div class="trending-info">
          <h4>${a.title}</h4>
          <div class="meta">${formatDate(a.publishedAt)}</div>
        </div>
      </div>`;
  });
  sidebarHtml += '</div></div>';

  // Trending
  sidebarHtml += '<div class="sidebar-widget"><div class="widget-header">&#128293; Trending</div><div class="widget-body">';
  getTrendingArticles(5).forEach((a, i) => {
    sidebarHtml += `
      <div class="trending-item" onclick="openArticle('${a.id}')">
        <div class="trending-num">${String(i+1).padStart(2,'0')}</div>
        <div class="trending-info">
          <h4>${a.title}</h4>
          <div class="meta">${formatViews(a.views)} views</div>
        </div>
      </div>`;
  });
  sidebarHtml += '</div></div>';
  sidebar.innerHTML = sidebarHtml;

  renderComments(id);

  document.getElementById('articleOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// --- Comments ---
const COMMENTS_KEY = 'ibc_news_comments';
let currentArticleId = null;

function getComments(articleId) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    return all[articleId] || [];
  } catch { return []; }
}

function saveComment(articleId, comment) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    if (!all[articleId]) all[articleId] = [];
    all[articleId].unshift(comment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  } catch {}
}

function deleteComment(articleId, commentId) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    if (all[articleId]) {
      all[articleId] = all[articleId].filter(c => c.id !== commentId);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
    }
  } catch {}
}

function renderComments(articleId) {
  currentArticleId = articleId;
  const comments = getComments(articleId);
  document.getElementById('commentCount').textContent = comments.length;
  const list = document.getElementById('commentsList');

  if (comments.length === 0) {
    list.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    return;
  }

  list.innerHTML = comments.map(c => {
    const initials = (c.name || 'A').slice(0, 2).toUpperCase();
    const timeAgo = getTimeAgo(c.time);
    const isAdmin = sessionStorage.getItem('ibc_admin') === 'true';
    return `<div class="comment-item">
      <div class="comment-user-avatar">${initials}</div>
      <div class="comment-body">
        <span class="comment-user-name">${escapeHtml(c.name)}</span>
        <span class="comment-time">${timeAgo}</span>
        <div class="comment-text">${escapeHtml(c.text)}</div>
        <div class="comment-actions">
          <button class="comment-action-btn" onclick="likeComment('${articleId}','${c.id}')">&#9825; ${c.likes || 0}</button>
          <button class="comment-action-btn" onclick="replyToComment('${escapeHtml(c.name)}')">Reply</button>
          ${isAdmin ? `<button class="comment-action-btn" style="color:var(--primary);" onclick="removeComment('${articleId}','${c.id}')">Delete</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function postComment() {
  const name = document.getElementById('commentName').value.trim();
  const text = document.getElementById('commentText').value.trim();
  if (!name || !text) { showToast('Please enter your name and comment.'); return; }

  const comment = {
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: name,
    text: text,
    time: new Date().toISOString(),
    likes: 0
  };

  saveComment(currentArticleId, comment);
  document.getElementById('commentText').value = '';
  renderComments(currentArticleId);
  showToast('Comment posted!');
}

function likeComment(articleId, commentId) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    const c = (all[articleId] || []).find(c => c.id === commentId);
    if (c) { c.likes = (c.likes || 0) + 1; localStorage.setItem(COMMENTS_KEY, JSON.stringify(all)); renderComments(articleId); }
  } catch {}
}

function removeComment(articleId, commentId) {
  deleteComment(articleId, commentId);
  renderComments(articleId);
  showToast('Comment deleted.');
}

function replyToComment(name) {
  document.getElementById('commentText').value = `@${name} `;
  document.getElementById('commentText').focus();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hour' + (hrs > 1 ? 's' : '') + ' ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
  return new Date(dateStr).toLocaleDateString();
}

function closeArticle(e) {
  if (e) e.preventDefault();
  document.getElementById('articleOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function copyArticleLink() {
  navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied to clipboard!'));
}

// --- Search ---
function handleSearch(e) {
  if (e.key === 'Enter') performSearch();
}

function performSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) return;
  const results = getAllArticles().filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.excerpt.toLowerCase().includes(q) ||
    (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
    a.category.toLowerCase().includes(q) ||
    a.author.toLowerCase().includes(q)
  );
  document.getElementById('searchHeading').textContent = `Search results for "${q}" (${results.length} found)`;
  const container = document.getElementById('searchResults');
  if (results.length === 0) {
    container.innerHTML = '<p style="padding:20px;color:#888;">No articles found. Try different keywords.</p>';
  } else {
    container.innerHTML = results.map(a => `
      <div class="news-list-item" onclick="closeSearch();openArticle('${a.id}')">
        <div class="news-list-img">
          <img src="${articleImg(a)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(a.category,a.id)}'">
        </div>
        <div class="news-list-content">
          <span class="category-tag">${a.category}</span>
          <h3>${a.title}</h3>
          <p>${a.excerpt}</p>
          <div class="news-card-meta">
            <span>${a.author} &middot; ${formatDate(a.publishedAt)}</span>
          </div>
        </div>
      </div>`).join('');
  }
  document.getElementById('searchOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSearch(e) {
  if (e) e.preventDefault();
  document.getElementById('searchOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// --- Category Filter ---
function filterByCategory(slug, e) {
  if (e) e.preventDefault();
  const articles = getArticlesByCategory(slug);
  const cat = getCategories().find(c => c.slug === slug);
  document.getElementById('searchHeading').textContent = `${cat ? cat.name : slug} (${articles.length} articles)`;
  const container = document.getElementById('searchResults');
  container.innerHTML = articles.map(a => `
    <div class="news-list-item" onclick="closeSearch();openArticle('${a.id}')">
      <div class="news-list-img">
        <img src="${articleImg(a)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(a.category,a.id)}'">
      </div>
      <div class="news-list-content">
        <span class="category-tag">${a.category}</span>
        <h3>${a.title}</h3>
        <p>${a.excerpt}</p>
        <div class="news-card-meta">
          <span>${a.author} &middot; ${formatDate(a.publishedAt)}</span>
        </div>
      </div>
    </div>`).join('');
  document.getElementById('searchOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showAllNews(e) {
  if (e) e.preventDefault();
  const articles = getLatestArticles(100);
  document.getElementById('searchHeading').textContent = `All News (${articles.length} articles)`;
  const container = document.getElementById('searchResults');
  container.innerHTML = articles.map(a => `
    <div class="news-list-item" onclick="closeSearch();openArticle('${a.id}')">
      <div class="news-list-img">
        <img src="${articleImg(a)}" alt="" onerror="this.onerror=null;this.src='${getFallbackImg(a.category,a.id)}'">
      </div>
      <div class="news-list-content">
        <span class="category-tag">${a.category}</span>
        <h3>${a.title}</h3>
        <p>${a.excerpt}</p>
        <div class="news-card-meta">
          <span>${a.author} &middot; ${formatDate(a.publishedAt)}</span>
        </div>
      </div>
    </div>`).join('');
  document.getElementById('searchOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// --- Video ---
function playVideo(url) {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('videoPlayer');
  player.src = url;
  player.play();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('videoPlayer');
  player.pause();
  player.src = '';
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// --- Login ---
function showLoginModal() {
  document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('adminPassword').value = '';
}

function doLogin() {
  const pw = document.getElementById('adminPassword').value;
  const settings = getSettings();
  if (pw === (settings.adminPassword || 'admin123')) {
    sessionStorage.setItem('ibc_admin', 'true');
    window.location.href = 'admin.html';
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

// --- Back to Top ---
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

// --- Toast ---
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// --- Theme ---
function initTheme() {
  try {
    const saved = localStorage.getItem('ibc_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      updateThemeIcon(saved);
    }
  } catch {}
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('ibc_theme', next); } catch {}
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '&#9728;' : '&#9790;';
}

// --- Helpers ---
function formatViews(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function getCategoryIcon(cat) {
  const svgs = {
    national: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    international: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    politics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>',
    business: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    technology: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    sports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 20M12 2a7 7 0 0 1 0 20M2 12h20"/></svg>',
    entertainment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>',
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v7l5 8H4l5-8V3z"/><line x1="8" y1="3" x2="16" y2="3"/><circle cx="12" cy="16" r="1"/></svg>',
    opinion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    world: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    lifestyle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
  };
  return svgs[cat] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z M7 8h10M7 12h10M7 16h6"/></svg>';
}

function proxyImg(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.includes('wsrv.nl')) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&h=450&fit=cover&output=webp`;
}

function getFallbackImg(cat, id) {
  const seed = id || cat || 'news';
  return `https://picsum.photos/seed/${seed}/800/450`;
}

function articleImg(article) {
  if (article.image) return proxyImg(article.image);
  return getFallbackImg(article.category, article.id);
}
