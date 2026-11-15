// IBC News Online — Admin Panel Script

document.addEventListener('DOMContentLoaded', () => {
  // Auth check — show inline login if not authed
  if (sessionStorage.getItem('ibc_admin') !== 'true') {
    document.querySelector('.admin-main').innerHTML = `
      <div style="max-width:400px;margin:80px auto;text-align:center;">
        <div class="logo" style="margin-bottom:24px;">IBC<span class="logo-highlight">NEWS</span></div>
        <div class="editor-wrap">
          <h2 style="margin-bottom:20px;">Admin Login</h2>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="inlineAdminPw" placeholder="Enter admin password" onkeyup="if(event.key==='Enter')inlineLogin()">
          </div>
          <button class="btn-primary" onclick="inlineLogin()">Login</button>
          <p style="margin-top:12px;font-size:11px;color:#999;">Default: admin123</p>
          <p id="inlineLoginError" style="color:var(--primary);font-size:12px;margin-top:8px;display:none;">Invalid password</p>
        </div>
      </div>`;
    initThemeAdmin();
    return;
  }
  initData();
  initThemeAdmin();
  renderDashboard();
  renderCategorySelect();

  // Responsive sidebar
  const mqCheck = () => {
    const btn = document.getElementById('adminMenuBtn');
    if (btn) btn.style.display = window.innerWidth <= 768 ? 'block' : 'none';
  };
  mqCheck();
  window.addEventListener('resize', mqCheck);
});

// --- Views ---
const views = ['dashboard', 'articles', 'create', 'breaking', 'categories', 'aggregator', 'settings'];

function showView(name, navEl, e) {
  if (e) e.preventDefault();
  views.forEach(v => {
    const el = document.getElementById(v + 'View');
    if (el) el.style.display = v === name ? '' : 'none';
  });
  const titles = {
    dashboard: 'Dashboard', articles: 'All Articles', create: 'New Article',
    breaking: 'Breaking News', categories: 'Categories', aggregator: 'News Aggregator', settings: 'Settings'
  };
  document.getElementById('viewTitle').textContent = titles[name] || name;

  // Nav active
  if (navEl) {
    document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
    navEl.classList.add('active');
  }

  // Render view data
  if (name === 'dashboard') renderDashboard();
  if (name === 'articles') renderAllArticles();
  if (name === 'create') { clearEditor(); document.getElementById('editorTitle').textContent = 'Create New Article'; }
  if (name === 'breaking') renderBreakingView();
  if (name === 'categories') renderCategoriesView();
  if (name === 'aggregator') renderAggregatorView();
  if (name === 'settings') renderSettingsView();

  // Close mobile sidebar
  document.getElementById('adminSidebar').classList.remove('open');
}

function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

// --- Dashboard ---
function renderDashboard() {
  const articles = getAllArticles();
  const totalViews = articles.reduce((s, a) => s + (a.views || 0), 0);
  const cats = getCategories();
  const featured = articles.filter(a => a.featured).length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon red">&#128240;</div>
      <h3>${articles.length}</h3>
      <p>Total Articles</p>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue">&#128065;</div>
      <h3>${formatViewsAdmin(totalViews)}</h3>
      <p>Total Views</p>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">&#128193;</div>
      <h3>${cats.length}</h3>
      <p>Categories</p>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">&#11088;</div>
      <h3>${featured}</h3>
      <p>Featured</p>
    </div>`;

  const recent = getLatestArticles(8);
  document.getElementById('recentTableBody').innerHTML = recent.map(a => articleRow(a)).join('');
}

// --- All Articles ---
function renderAllArticles() {
  const articles = getAllArticles().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  document.getElementById('articleCount').textContent = articles.length;
  document.getElementById('allTableBody').innerHTML = articles.map(a => articleRow(a)).join('');
  const catFilter = document.getElementById('artCategoryFilter');
  if (catFilter && catFilter.options.length <= 1) {
    getCategories().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catFilter.appendChild(opt);
    });
  }
}

function filterAllArticles() {
  const q = (document.getElementById('artSearchInput').value || '').trim().toLowerCase();
  const cat = (document.getElementById('artCategoryFilter').value || '');
  let articles = getAllArticles().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (cat) articles = articles.filter(a => a.category === cat);
  if (q) articles = articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.author.toLowerCase().includes(q) ||
    (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
    a.category.toLowerCase().includes(q) ||
    a.excerpt.toLowerCase().includes(q)
  );
  document.getElementById('articleCount').textContent = articles.length;
  document.getElementById('allTableBody').innerHTML = articles.map(a => articleRow(a)).join('');
}

function filterDashboardArticles() {
  const q = (document.getElementById('dashSearchInput').value || '').trim().toLowerCase();
  let articles = getLatestArticles(100);
  if (q) articles = articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.author.toLowerCase().includes(q) ||
    (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
    a.category.toLowerCase().includes(q)
  );
  document.getElementById('recentTableBody').innerHTML = articles.slice(0, 20).map(a => articleRow(a)).join('');
}

function articleRow(a) {
  const cat = getCategories().find(c => c.id === a.category);
  let status = '<span class="status-badge published">Published</span>';
  if (a.breaking) status = '<span class="status-badge breaking">Breaking</span>';
  if (a.featured) status += ' <span class="status-badge featured">Featured</span>';
  return `<tr>
    <td class="title-cell">${a.title}</td>
    <td>${cat ? cat.name : a.category}</td>
    <td>${a.author}</td>
    <td>${formatDate(a.publishedAt)}</td>
    <td>${formatViewsAdmin(a.views || 0)}</td>
    <td>${status}</td>
    <td class="action-btns">
      <button class="action-btn" onclick="boostArticleViews('${a.id}', 1000)" title="+1K views" style="font-size:11px;">+1K</button>
      <button class="action-btn" onclick="boostArticleViews('${a.id}', 10000)" title="+10K views" style="font-size:11px;">+10K</button>
      <button class="action-btn" onclick="editArticle('${a.id}')">Edit</button>
      <button class="action-btn delete" onclick="confirmDelete('${a.id}')">Delete</button>
    </td>
  </tr>`;
}

// --- Editor ---
function renderCategorySelect() {
  const sel = document.getElementById('artCategory');
  if (!sel) return;
  sel.innerHTML = getCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function clearEditor() {
  document.getElementById('editId').value = '';
  document.getElementById('artTitle').value = '';
  document.getElementById('artCategory').selectedIndex = 0;
  document.getElementById('artAuthor').value = 'IBC News Desk';
  document.getElementById('artExcerpt').value = '';
  document.getElementById('artContent').value = '';
  document.getElementById('artImage').value = '';
  document.getElementById('artVideo').value = '';
  document.getElementById('artTags').value = '';
  document.getElementById('artViews').value = '';
  document.getElementById('artFeatured').checked = false;
  document.getElementById('artBreaking').checked = false;
  document.getElementById('artDate').value = new Date().toISOString().slice(0, 16);
}

function editArticle(id) {
  const a = getArticleById(id);
  if (!a) return;
  showView('create', null);
  document.getElementById('editId').value = a.id;
  document.getElementById('artTitle').value = a.title;
  document.getElementById('artCategory').value = a.category;
  document.getElementById('artAuthor').value = a.author;
  document.getElementById('artExcerpt').value = a.excerpt;
  // Strip auto-generated video/image HTML wrapper to show just article text
  let editContent = a.content;
  editContent = editContent.replace(/<div class="video-player-wrap"[\s\S]*?<\/div>\s*<\/div>/gi, '');
  editContent = editContent.replace(/<div style="position:relative[\s\S]*?<\/iframe><\/div>/gi, '');
  editContent = editContent.replace(/<div style="text-align:center;padding:10px[\s\S]*?<\/span><\/div>/gi, '');
  editContent = editContent.replace(/<div style="margin:0 0 24px[\s\S]*?<\/div>/gi, '');
  editContent = editContent.trim();
  document.getElementById('artContent').value = editContent;
  document.getElementById('artImage').value = a.image || '';
  document.getElementById('artVideo').value = a.videoUrl || '';
  document.getElementById('artTags').value = (a.tags || []).join(', ');
  document.getElementById('artViews').value = a.views || 0;
  document.getElementById('artFeatured').checked = a.featured;
  document.getElementById('artBreaking').checked = a.breaking;
  document.getElementById('artDate').value = a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
  document.getElementById('editorTitle').textContent = 'Edit Article';
  document.getElementById('viewTitle').textContent = 'Edit Article';
}

function saveArticleForm() {
  const title = document.getElementById('artTitle').value.trim();
  const category = document.getElementById('artCategory').value;
  const author = document.getElementById('artAuthor').value.trim();
  const excerpt = document.getElementById('artExcerpt').value.trim();
  const content = document.getElementById('artContent').value.trim();

  if (!title || !excerpt || !content) {
    showToast('Please fill in title, excerpt, and content.');
    return;
  }

  const editId = document.getElementById('editId').value;
  const existing = editId ? getArticleById(editId) : null;

  // Auto-convert plain text to HTML
  let htmlContent = content;
  if (!content.startsWith('<')) {
    const paras = content.split(/\n\s*\n/).filter(p => p.trim());
    htmlContent = paras.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('\n');
  }

  const videoUrl = document.getElementById('artVideo').value.trim();
  const imgUrl = document.getElementById('artImage').value.trim();

  // Auto-build video player + image into content
  let fullContent = '';
  if (videoUrl && !htmlContent.includes('<video') && !htmlContent.includes('<iframe')) {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      fullContent += `<div style="position:relative;width:100%;max-width:900px;margin:0 auto 28px;border-radius:10px;overflow:hidden;background:#000;box-shadow:0 4px 24px rgba(0,0,0,0.25);aspect-ratio:16/9;"><iframe src="${videoUrl}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`;
    } else {
      fullContent += `<div class="video-player-wrap" style="position:relative;width:100%;max-width:900px;margin:0 auto 28px;border-radius:10px;overflow:hidden;background:#000;box-shadow:0 4px 24px rgba(0,0,0,0.25);"><video controls playsinline preload="metadata" style="width:100%;display:block;border-radius:10px;"><source src="${videoUrl}" type="video/mp4">Your browser does not support video.</video><div class="video-watermark">IBC NEWS</div></div>`;
    }
    fullContent += `<div style="text-align:center;padding:10px 0 18px;"><span style="color:#fff;font-size:13px;font-weight:600;text-decoration:underline;text-underline-offset:3px;letter-spacing:0.3px;">This content is published by ${author || 'IBC News Desk'}</span></div>`;
  }
  if (imgUrl && !htmlContent.includes('<img')) {
    fullContent += `<div style="margin:0 0 24px;text-align:center;"><img src="${imgUrl}" alt="${title}" style="width:100%;max-width:900px;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.15);"></div>`;
  }
  fullContent += htmlContent;

  const article = {
    id: editId || generateId(),
    title,
    category,
    author: author || 'IBC News Desk',
    excerpt,
    content: fullContent,
    image: imgUrl,
    videoUrl: videoUrl,
    tags: document.getElementById('artTags').value.split(',').map(t => t.trim()).filter(Boolean),
    featured: document.getElementById('artFeatured').checked,
    breaking: document.getElementById('artBreaking').checked,
    publishedAt: document.getElementById('artDate').value ? new Date(document.getElementById('artDate').value).toISOString() : (existing ? existing.publishedAt : new Date().toISOString()),
    views: parseInt(document.getElementById('artViews').value) || (existing ? existing.views : 0)
  };

  saveArticle(article);
  showToast(editId ? 'Article updated!' : 'Article published!');
  showView('articles', null);
  renderAllArticles();
}

function boostViewsQuick(amount) {
  const el = document.getElementById('artViews');
  el.value = (parseInt(el.value) || 0) + (amount || 1000);
}

function boostArticleViews(id, amount) {
  const a = getArticleById(id);
  if (!a) return;
  a.views = (a.views || 0) + (amount || 1000);
  saveArticle(a);
  renderAllArticles();
  showToast('+' + (amount || 1000) + ' views added!');
}

function confirmDelete(id) {
  const a = getArticleById(id);
  if (!a) return;
  if (confirm(`Delete "${a.title}"? This cannot be undone.`)) {
    deleteArticle(id);
    showToast('Article deleted.');
    renderDashboard();
    renderAllArticles();
  }
}

// --- AI Content Generation (Gemini) ---
function getGeminiKey() {
  return localStorage.getItem('ibc_gemini_key') || '';
}

function setGeminiKey(key) {
  localStorage.setItem('ibc_gemini_key', key);
}

async function aiGenerateContent() {
  const title = document.getElementById('artTitle').value.trim();
  const summary = document.getElementById('artExcerpt').value.trim();
  if (!title) { showToast('Title likho pehle, AI usse article generate karega.'); return; }

  let apiKey = getGeminiKey();
  if (!apiKey) {
    apiKey = prompt('Gemini API Key enter karo (ek baar dena hoga, save ho jaayegi):');
    if (!apiKey) return;
    setGeminiKey(apiKey);
  }

  const btn = document.getElementById('aiGenBtn');
  const status = document.getElementById('aiStatus');
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';
  status.textContent = 'Gemini se content generate ho raha hai...';

  const promptText = 'You are a professional news journalist writing for IBC News Online. Write a detailed news article based on this:\n\nTitle: ' + title + (summary ? '\nSummary: ' + summary : '') + '\n\nWrite 4-6 paragraphs of professional news content in plain text. Each paragraph separated by a blank line. Do NOT use any HTML tags. Do NOT use markdown. Just plain text paragraphs. Write in a professional, objective news reporting style. Include relevant details, quotes where appropriate, and context.';

  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 60000);
    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ac.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });

    if (!resp.ok) {
      if (resp.status === 400 || resp.status === 403 || resp.status === 404) {
        localStorage.removeItem('ibc_gemini_key');
        throw new Error('Invalid API key — dobara enter karo next time');
      }
      throw new Error('API error: ' + resp.status);
    }

    const data = await resp.json();
    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text || '';
    if (!text) throw new Error('Empty response');

    document.getElementById('artContent').value = text.trim();
    if (!summary) {
      document.getElementById('artExcerpt').value = text.split('\n')[0].slice(0, 200);
    }
    status.textContent = 'Content generated!';
    showToast('AI content generated!');
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
    showToast('AI generation failed.');
  }

  btn.disabled = false;
  btn.textContent = '✨ AI Generate from Title';
}

// --- Video File Upload ---
function handleVideoFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('videoPreview');
  const wrap = document.getElementById('videoPreviewWrap');
  const url = URL.createObjectURL(file);
  preview.src = url;
  wrap.style.display = 'block';
  document.getElementById('artVideo').value = 'videos/' + file.name;
}

function clearVideoFile() {
  const input = document.getElementById('artVideoFile');
  input.value = '';
  document.getElementById('videoPreview').src = '';
  document.getElementById('videoPreviewWrap').style.display = 'none';
}

// --- Breaking News ---
function renderBreakingView() {
  const bn = getBreakingNews();
  document.getElementById('breakingEnabled').checked = bn.enabled;
  document.getElementById('breakingText').value = bn.text || '';

  const breaking = getBreakingArticles();
  document.getElementById('breakingTableBody').innerHTML = breaking.length === 0
    ? '<tr><td colspan="3" style="text-align:center;color:#888;padding:20px;">No articles marked as breaking</td></tr>'
    : breaking.map(a => `<tr>
        <td class="title-cell">${a.title}</td>
        <td>${formatDate(a.publishedAt)}</td>
        <td class="action-btns">
          <button class="action-btn" onclick="editArticle('${a.id}')">Edit</button>
          <button class="action-btn" onclick="removeBreaking('${a.id}')">Remove Breaking</button>
        </td>
      </tr>`).join('');
}

function saveBreaking() {
  const bn = {
    enabled: document.getElementById('breakingEnabled').checked,
    text: document.getElementById('breakingText').value.trim()
  };
  localStorage.setItem(BREAKING_KEY, JSON.stringify(bn));
  showToast('Breaking news updated!');
}

function removeBreaking(id) {
  const a = getArticleById(id);
  if (a) {
    a.breaking = false;
    saveArticle(a);
    renderBreakingView();
    showToast('Removed from breaking news.');
  }
}

// --- Categories ---
function renderCategoriesView() {
  const cats = getCategories();
  const articles = getAllArticles();
  document.getElementById('catTableBody').innerHTML = cats.map(c => {
    const count = articles.filter(a => a.category === c.id).length;
    return `<tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.slug}</td>
      <td>${count}</td>
      <td class="action-btns">
        <button class="action-btn delete" onclick="deleteCategory('${c.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function addCategory() {
  const name = document.getElementById('newCatName').value.trim();
  if (!name) return;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cats = getCategories();
  if (cats.find(c => c.slug === slug)) {
    showToast('Category already exists.');
    return;
  }
  cats.push({ id: slug, name, slug });
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  document.getElementById('newCatName').value = '';
  renderCategoriesView();
  renderCategorySelect();
  showToast('Category added!');
}

function deleteCategory(id) {
  if (!confirm('Delete this category? Articles in it will remain.')) return;
  const cats = getCategories().filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  renderCategoriesView();
  renderCategorySelect();
  showToast('Category deleted.');
}

// --- Settings ---
function renderSettingsView() {
  const s = getSettings();
  document.getElementById('setSiteName').value = s.siteName || 'IBC News Online';
  document.getElementById('setTagline').value = s.tagline || '';
  document.getElementById('setPassword').value = s.adminPassword || 'admin123';
  document.getElementById('setGeminiKey').value = s.geminiKey || '';
}

function saveSettings() {
  const s = {
    ...getSettings(),
    siteName: document.getElementById('setSiteName').value.trim(),
    tagline: document.getElementById('setTagline').value.trim(),
    adminPassword: document.getElementById('setPassword').value.trim() || 'admin123',
    geminiKey: document.getElementById('setGeminiKey').value.trim()
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  showToast('Settings saved!');
}

// --- Data Management ---
function exportData() {
  const data = {
    articles: getAllArticles(),
    categories: getCategories(),
    settings: getSettings(),
    breaking: getBreakingNews(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ibc-news-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.articles) saveArticles(data.articles);
      if (data.categories) localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data.categories));
      if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      if (data.breaking) localStorage.setItem(BREAKING_KEY, JSON.stringify(data.breaking));
      showToast('Data imported successfully!');
      renderDashboard();
    } catch {
      showToast('Invalid file format.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetData() {
  if (!confirm('Reset all data to defaults? This will delete all your articles and settings.')) return;
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(BREAKING_KEY);
  initData();
  renderDashboard();
  renderCategorySelect();
  showToast('Data reset to defaults!');
}

// --- Helpers ---
function formatViewsAdmin(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function initThemeAdmin() {
  try {
    const saved = localStorage.getItem('ibc_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.innerHTML = saved === 'dark' ? '&#9728;' : '&#9790;';
    }
  } catch {}
}

function toggleThemeAdmin() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('ibc_theme', next); } catch {}
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = next === 'dark' ? '&#9728;' : '&#9790;';
}

function inlineLogin() {
  const pw = document.getElementById('inlineAdminPw').value;
  const settings = getSettings();
  if (pw === (settings.adminPassword || 'admin123')) {
    sessionStorage.setItem('ibc_admin', 'true');
    window.location.reload();
  } else {
    document.getElementById('inlineLoginError').style.display = 'block';
  }
}

// --- Aggregator UI ---
function renderAggregatorView() {
  const config = getAggConfig();
  document.getElementById('aggAutoFetch').checked = config.autoFetch;
  document.getElementById('aggInterval').value = config.intervalMinutes || 60;
  document.getElementById('aggMaxPerFeed').value = config.maxPerFeed || 5;

  // Feed category select
  const sel = document.getElementById('newFeedCat');
  if (sel) sel.innerHTML = getCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  renderFeedTable();
  renderAggLog();

  if (config.lastFetch) {
    const st = document.getElementById('aggStatus');
    st.style.display = 'block';
    st.innerHTML = `Last fetch: <strong>${new Date(config.lastFetch).toLocaleString()}</strong>`;
  }
}

function renderFeedTable() {
  const config = getAggConfig();
  document.getElementById('feedTableBody').innerHTML = config.feeds.map(f => `<tr>
    <td><strong>${f.name}</strong><br><span style="font-size:11px;color:#888;word-break:break-all;">${f.url}</span></td>
    <td>${f.category}</td>
    <td><span class="status-badge ${f.enabled ? 'published' : ''}" style="${f.enabled ? '' : 'background:#888;'}">${f.enabled ? 'Active' : 'Disabled'}</span></td>
    <td class="action-btns">
      <button class="action-btn" onclick="toggleFeed('${f.id}');renderFeedTable();">${f.enabled ? 'Disable' : 'Enable'}</button>
      <button class="action-btn delete" onclick="removeFeed('${f.id}');renderFeedTable();showToast('Feed removed.');">Remove</button>
    </td>
  </tr>`).join('');
}

function renderAggLog() {
  const log = getAggLog();
  const el = document.getElementById('aggLogList');
  if (!log.length) {
    el.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No fetch history yet. Click "Fetch News Now" to start.</p>';
    return;
  }
  el.innerHTML = log.map(l => {
    const time = new Date(l.time).toLocaleString();
    if (l.status === 'ok') return `<div style="padding:6px 0;border-bottom:1px solid var(--border);"><span style="color:green;">&#10003;</span> <strong>${l.feed}</strong> — ${l.added} new of ${l.total} items <span style="float:right;color:#888;font-size:11px;">${time}</span></div>`;
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border);"><span style="color:var(--primary);">&#10007;</span> <strong>${l.feed}</strong> — ${l.error} <span style="float:right;color:#888;font-size:11px;">${time}</span></div>`;
  }).join('');
}

async function runAggNow() {
  const st = document.getElementById('aggStatus');
  st.style.display = 'block';
  st.innerHTML = '&#9889; Fetching news from RSS feeds... Please wait.';

  try {
    const r = await runAggregator();
    st.innerHTML = `&#10003; Done! <strong>${r.totalNew}</strong> new articles imported from <strong>${r.feedsChecked}</strong> feeds. ${r.totalErrors > 0 ? `<span style="color:var(--primary);">${r.totalErrors} feed(s) had errors.</span>` : ''}`;
    renderAggLog();
    renderDashboard();
    showToast(`${r.totalNew} new articles fetched!`);
  } catch (err) {
    st.innerHTML = `<span style="color:var(--primary);">Error: ${err.message}</span>`;
  }
}

function saveAggSettings() {
  const config = getAggConfig();
  config.autoFetch = document.getElementById('aggAutoFetch').checked;
  config.intervalMinutes = parseInt(document.getElementById('aggInterval').value) || 60;
  config.maxPerFeed = parseInt(document.getElementById('aggMaxPerFeed').value) || 5;
  saveAggConfig(config);
  if (config.autoFetch) startAutoAggregator(); else stopAutoAggregator();
  showToast('Aggregator settings saved!');
}

function addNewFeed() {
  const name = document.getElementById('newFeedName').value.trim();
  const url = document.getElementById('newFeedUrl').value.trim();
  const cat = document.getElementById('newFeedCat').value;
  if (!name || !url) { showToast('Enter feed name and URL.'); return; }
  if (addFeed(name, url, cat)) {
    document.getElementById('newFeedName').value = '';
    document.getElementById('newFeedUrl').value = '';
    renderFeedTable();
    showToast('Feed added!');
  } else {
    showToast('Feed already exists.');
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
