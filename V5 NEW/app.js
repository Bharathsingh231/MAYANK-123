'use strict';
(() => {
  const data = window.PORTFOLIO_DATA || { projects: [], featured: [], career: [] };
  const projects = data.projects || [];
  const byId = Object.fromEntries(projects.map(p => [p.id, p]));
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const humanNum = n => String(n).padStart(2, '0');

  const fixPath = (path) => {
    if (!path) return path;
    if (path.startsWith('http') || path.startsWith('//')) return path;
    return path.replace(/^\.\.\//, '');
  };

  const preview = (p, cls = '') => p.poster
    ? `<img loading="lazy" class="${cls} ${p.id === 'possiblix' ? 'logo-preview' : ''}" src="${e(fixPath(p.poster))}" alt="${e(p.name)} campaign preview" />`
    : `<div class="visual-placeholder ${p.id === 'habit' ? 'visual-habit' : ''}"><span class="placeholder-mark">${p.id === 'habit' ? '2–4 KM' : p.id === 'weddings' ? 'SELECTED\nFILMS' : e(p.name)}</span><span class="placeholder-sub">${p.id === 'habit' ? 'HYPERLOCAL ACTIVATION' : p.id === 'weddings' ? 'SELECTION PENDING' : 'CREATIVE STRATEGY'}</span></div>`;

  const projectStatus = p => p.relationship || 'Selected brand strategy work';
  const projectNo = p => humanNum(projects.findIndex(x => x.id === p.id) + 1);
  const videoLabel = (v, i) => v.name === 'Featured video' ? 'Featured film' : `Selected reel ${humanNum(i + 1)}`;
  const screenshotMore = p => Math.max(0, (p.screenshots || []).length - 1);

  /* ── Featured Grid ─────────────────────────────────── */
  function featuredCard(id, index) {
    const p = byId[id];
    if (!p) return '';
    return `<button class="featured-card featured-${index + 1}" type="button" data-project="${e(p.id)}" aria-label="Read the strategy for ${e(p.name)}">
      <div class="featured-visual">${preview(p)}<span class="visual-index">${humanNum(index + 1)} / FEATURED STRATEGY</span><span class="visual-action">↗</span></div>
      <div class="featured-copy">
        <div class="card-overline"><span>${e(p.name)}</span><span>${e(p.category)}</span></div>
        <h3>${e(p.title)}</h3>
        <p>${e(p.strap)}</p>
        <div class="feature-footer"><span>${e((p.formats && p.formats[0]) || p.group)}</span><span>READ CASE STUDY ↗</span></div>
      </div>
    </button>`;
  }
  $('#featured-grid').innerHTML = (data.featured || []).map(featuredCard).join('');

  /* ── Archive Grid & Filter ─────────────────────────── */
  let filter = 'all';
  let archiveExpanded = false;
  const mobileMq = window.matchMedia('(max-width: 600px)');
  const MOBILE_ARCHIVE_LIMIT = 5;

  function renderArchive() {
    const query = ($('#brand-search').value || '').trim().toLowerCase();
    const result = projects.filter(p =>
      (filter === 'all' || p.group === filter) &&
      [p.name, p.category, p.sector, p.title, p.strap, p.move, ...(p.formats || [])].join(' ').toLowerCase().includes(query)
    );
    const isMobile = mobileMq.matches;
    const isTruncated = isMobile && !archiveExpanded && result.length > MOBILE_ARCHIVE_LIMIT;
    const visibleList = isTruncated ? result.slice(0, MOBILE_ARCHIVE_LIMIT) : result;

    $('#result-count').textContent = isTruncated
      ? `SHOWING ${visibleList.length} OF ${result.length} PROJECTS / ${projects.length} IN THE COLLECTION`
      : `${result.length} PROJECT${result.length === 1 ? '' : 'S'} / ${projects.length} IN THE COLLECTION`;

    $('#archive-grid').innerHTML = visibleList.length
      ? visibleList.map(p => `<button class="archive-card" type="button" data-project="${e(p.id)}" aria-label="Read ${e(p.name)} case study">
          <div class="archive-image">${preview(p)}<span class="archive-corner">↗</span></div>
          <div class="archive-content">
            <span class="archive-category">${e(p.category)}</span>
            <h3>${e(p.name)}</h3>
            <p>${e(p.title)}</p>
            <span class="archive-context">${e(
              p.group === 'growth' ? 'FIELD MARKETING'
              : p.group === 'digital' ? 'DIGITAL PRODUCT'
              : p.group === 'industry' ? 'B2B / INDUSTRIAL'
              : p.group === 'creative' ? 'CREATIVE FILM'
              : p.group === 'trade' ? 'TRADE COMMUNICATION'
              : 'BRAND CONTENT'
            )}</span>
          </div>
        </button>`).join('')
      : '<p class="no-results">No projects match this selection. Try another filter.</p>';

    const expandWrap = $('#archive-expand-wrap');
    const expandBtn = $('#archive-expand-btn');
    if (expandWrap && expandBtn) {
      if (isMobile && result.length > MOBILE_ARCHIVE_LIMIT) {
        expandWrap.hidden = false;
        expandBtn.innerHTML = archiveExpanded
          ? `Show fewer <span aria-hidden="true">↑</span>`
          : `Show all (${result.length}) <span aria-hidden="true">↓</span>`;
      } else {
        expandWrap.hidden = true;
      }
    }
  }

  if ($('#archive-expand-btn')) {
    $('#archive-expand-btn').addEventListener('click', () => {
      archiveExpanded = !archiveExpanded;
      renderArchive();
    });
  }
  mobileMq.addEventListener('change', renderArchive);

  /* ── Career List (only render dynamically if empty) ── */
  const careerListEl = $('#career-list');
  if (careerListEl && !careerListEl.children.length) {
    careerListEl.innerHTML = (data.career || []).map((role, index) => `
      <article class="career-item">
        <div class="career-count">${humanNum(index + 1)}</div>
        <div class="career-title"><h3>${e(role.company)}</h3><p>${e(role.role)}</p></div>
        <span class="career-type">${e(role.type)}</span>
        <div class="career-summary">
          <p>${e(role.summary)}</p>
          <div class="career-tags">${(role.tags || []).map(tag => `<span>${e(tag)}</span>`).join('')}</div>
          ${role.project ? `<button type="button" class="text-button" data-project="${e(role.project)}">Explore related project ↗</button>` : ''}
        </div>
      </article>`).join('');
  }

  /* ── Modals Setup ──────────────────────────────────── */
  const modal = $('#project-dialog');
  const modalShell = $('.project-shell', modal);
  const playerModal = $('#player-dialog');
  const playerShell = $('.player-shell', playerModal);
  const imageModal = $('#image-dialog');
  const imageShell = $('.image-shell', imageModal);

  const isModalOpen = el => el && !el.hasAttribute('hidden');

  function syncBodyLock() {
    const anyOpen = isModalOpen(modal) || isModalOpen(playerModal) || isModalOpen(imageModal);
    document.body.classList.toggle('is-modal', anyOpen);
  }

  /* ── Case Study Rendering (Redesigned Bento Editorial UI) ── */
  function videoCard(p, v, i, isFeaturedFilm = false) {
    const isLocal = v.mode === 'local';
    return `<button type="button" class="cs-video-card ${isFeaturedFilm ? 'is-featured-film' : ''}" data-video="${e(v.id)}" data-brand="${e(p.id)}" aria-label="Play ${e(p.name)} ${e(videoLabel(v, i))}">
      <div class="cs-video-thumb">
        ${preview(p)}
        <div class="cs-video-overlay">
          <span class="cs-video-badge is-local">${isLocal ? '● DIRECT FILM' : '● STREAM FILM'}</span>
          <span class="cs-video-play" aria-hidden="true">▶</span>
        </div>
      </div>
      <div class="cs-video-meta">
        <div>
          <span class="cs-video-idx">${humanNum(i + 1)}</span>
          <strong>${e(videoLabel(v, i))}</strong>
        </div>
        <span class="cs-video-cta">Watch ▶</span>
      </div>
    </button>`;
  }

  function renderProject(p) {
    const currentIndex = projects.findIndex(x => x.id === p.id);
    const prev = projects[(currentIndex - 1 + projects.length) % projects.length];
    const next = projects[(currentIndex + 1) % projects.length];
    const films = p.videos || [];
    const featuredVideo = films.find(v => v.mode === 'local') || films[0] || null;
    const primary = films.slice(0, 4);
    const additional = films.slice(4);
    const hasInsights = Boolean(p.croppedInsight && p.screenshots && p.screenshots.length);
    const sourceNote = p.dateRange
      ? `Screenshot period: ${p.dateRange}. The source did not show the year.`
      : 'Source material and reporting context vary by project.';

    const heroVisual = p.poster
      ? `<div class="cs-hero-media">
          ${preview(p)}
          <div class="cs-hero-media-bar">
            <span class="cs-media-chip">${e(p.name.toUpperCase())} / CREATIVE</span>
            ${featuredVideo ? `<button type="button" class="cs-quick-play" data-video="${e(featuredVideo.id)}" data-brand="${e(p.id)}"><span>▶</span> Play featured film</button>` : ''}
          </div>
        </div>`
      : (p.id === 'possiblix'
        ? `<div class="cs-hero-possiblix">
            <img src="${fixPath('assets/possiblix-logo.png')}" alt="Possiblix wordmark" />
            <span>PRE-LAUNCH UX / APPROVED WORDMARK ONLY</span>
          </div>`
        : `<div class="cs-hero-alt">
            <div class="cs-hero-alt-grid" aria-hidden="true"></div>
            <span class="cs-media-chip">${e(p.id === 'habit' ? 'HYPERLOCAL / 2–4 KM CATCHMENT' : p.name.toUpperCase())}</span>
            <strong>${e(p.title)}</strong>
            <span class="cs-alt-sub">${e(p.sector)}</span>
          </div>`);

    const metricsStrip = (p.metrics && p.metrics.length)
      ? `<div class="cs-metrics-grid">
          ${p.metrics.map(m => `
            <div class="cs-metric-card">
              <span class="cs-metric-kicker">ACCOUNT SNAPSHOT</span>
              <strong class="cs-metric-num">${e(m.number)}</strong>
              <span class="cs-metric-label">${e(m.label)}</span>
              ${m.qualifier ? `<span class="cs-metric-qual">${e(m.qualifier)}</span>` : ''}
            </div>
          `).join('')}
        </div>`
      : '';

    const sectionJumpLinks = [
      { id: 'cs-opportunity', label: '01 Opportunity' },
      { id: 'cs-strategy', label: '02 Strategy' },
      ...(films.length || p.id === 'habit' || p.id === 'possiblix' ? [{ id: 'cs-motion', label: films.length ? `03 Films (${films.length})` : p.id === 'habit' ? '03 Playbook' : '03 Note' }] : []),
      ...(hasInsights ? [{ id: 'cs-insights', label: `${films.length ? '04' : '03'} Insights` }] : []),
      { id: 'cs-takeaway', label: `${hasInsights ? (films.length ? '05' : '04') : (films.length || p.id === 'habit' || p.id === 'possiblix' ? '04' : '03')} Takeaway` }
    ];

    const mediaSection = films.length
      ? `<section class="cs-section" id="cs-motion">
          <div class="cs-section-head">
            <div>
              <p class="index-label">03 / WORK IN MOTION</p>
              <h3>The format in action.</h3>
            </div>
            <p>Original creative grouped with the brand. Each film opens directly in the player or its supplied Drive preview.</p>
          </div>
          <div class="cs-reel-grid">${primary.map((v, i) => videoCard(p, v, i, v.mode === 'local')).join('')}</div>
          ${additional.length ? `
            <div class="cs-more-wrap">
              <button type="button" class="cs-expand-btn" data-toggle-more aria-expanded="false">
                <span>Show ${additional.length} more film${additional.length !== 1 ? 's' : ''}</span>
                <span class="cs-expand-icon">+</span>
              </button>
              <div class="cs-reel-grid cs-more-reels" hidden>${additional.map((v, i) => videoCard(p, v, i + 4, false)).join('')}</div>
            </div>` : ''}
        </section>`
      : p.id === 'habit'
        ? `<section class="cs-section" id="cs-motion">
            <div class="cs-section-head">
              <div>
                <p class="index-label">03 / ACTIVATION PLAYBOOK</p>
                <h3>What field marketing looked like.</h3>
              </div>
              <p>No campaign photography was supplied in the archive, so this section documents the actual hyperlocal outreach activities.</p>
            </div>
            <div class="cs-activation-grid">
              ${(p.formats || []).map((f, i) => `
                <article class="cs-activation-card">
                  <span class="cs-act-num">${humanNum(i + 1)}</span>
                  <div>
                    <h4>${e(f)}</h4>
                    <p>Hyperlocal execution across residential societies, workplaces & delivery touchpoints.</p>
                  </div>
                </article>`).join('')}
            </div>
          </section>`
        : p.id === 'possiblix'
          ? `<section class="cs-section" id="cs-motion">
              <div class="cs-nda-card">
                <p class="index-label">03 / CONFIDENTIAL PRODUCT WORK</p>
                <h3>Design clarity without exposing pre-launch IP.</h3>
                <p>This is a pre-launch SaaS engagement. Only the approved wordmark and high-level strategic context are shown; prototype screens and simulated figures are intentionally excluded.</p>
              </div>
            </section>`
          : '';

    const insightsSection = hasInsights
      ? `<section class="cs-section" id="cs-insights">
          <div class="cs-section-head">
            <div>
              <p class="index-label">${films.length ? '04' : '03'} / ACCOUNT CONTEXT</p>
              <h3>A note from the channel.</h3>
            </div>
            <p>An excerpt from the account's own Instagram Insights for context—not presented as single-handed causal proof.</p>
          </div>
          <div class="cs-insights-layout">
            <div class="cs-insights-data">
              ${metricsStrip}
              <div class="cs-disclaimer-box">
                <strong>Context & Attribution Note</strong>
                <p>${e(sourceNote)} Paid-media proportions are retained wherever reported. Instagram-reported account snapshots cannot be independently attributed to an individual or a single content format.</p>
              </div>
            </div>
            <div class="cs-insights-proof">
              <button class="cs-screenshot-card" type="button" data-image="${e(fixPath(p.screenshots[0]))}" data-image-label="${e(p.name)} — original Instagram screenshot">
                <div class="cs-screenshot-frame">
                  <img src="${e(fixPath(p.croppedInsight))}" loading="lazy" alt="Cropped Instagram account screenshot for ${e(p.name)}" />
                </div>
                <div class="cs-screenshot-foot">
                  <span>ORIGINAL CAPTURE</span>
                  <span>Inspect full source ↗</span>
                </div>
              </button>
              ${screenshotMore(p) > 0 ? `
                <div class="cs-screens-strip-wrap">
                  <span class="cs-strip-label">Additional captures (${screenshotMore(p)})</span>
                  <div class="cs-screens-strip">
                    ${p.screenshots.slice(1).map((path, i) => `
                      <button type="button" data-image="${e(fixPath(path))}" data-image-label="${e(p.name)} account capture ${i + 2}" aria-label="View capture ${i + 2}">
                        <img src="${e(fixPath(path))}" loading="lazy" alt="Instagram screenshot ${i + 2} for ${e(p.name)}" />
                      </button>
                    `).join('')}
                  </div>
                </div>` : ''}
            </div>
          </div>
        </section>`
      : '';

    const takeawayIndex = hasInsights
      ? (films.length ? '05' : '04')
      : (films.length || p.id === 'habit' || p.id === 'possiblix' ? '04' : '03');

    return `<div class="cs-wrap">
      <!-- Jump Navigation -->
      <nav class="cs-jump-nav" aria-label="Case study sections">
        ${sectionJumpLinks.map(link => `<button type="button" class="cs-jump-pill" data-jump="${link.id}">${e(link.label)}</button>`).join('')}
      </nav>

      <!-- Hero Bento -->
      <header class="cs-hero">
        <div class="cs-hero-copy">
          <div class="cs-badges">
            <span class="cs-case-num">CASE ${e(projectNo(p))}</span>
            <span class="cs-pill">${e(p.category)}</span>
            <span class="cs-pill cs-pill-muted">${e(p.sector)}</span>
          </div>
          <h2>${e(p.title)}</h2>
          <p class="cs-strap">${e(p.strap)}</p>
          <div class="cs-stat-bar">
            <div class="cs-stat-item">
              <span>STATUS</span>
              <strong>${e(projectStatus(p))}</strong>
            </div>
            <div class="cs-stat-item">
              <span>FORMATS</span>
              <strong>${(p.formats || []).length} Creative Angles</strong>
            </div>
            <div class="cs-stat-item">
              <span>MEDIA</span>
              <strong>${films.length ? `${films.length} Film${films.length > 1 ? 's' : ''}` : hasInsights ? `${p.screenshots.length} Captures` : 'Strategy Brief'}</strong>
            </div>
          </div>
        </div>
        <div class="cs-hero-visual">${heroVisual}</div>
      </header>

      <!-- 01 Opportunity -->
      <section class="cs-section" id="cs-opportunity">
        <div class="cs-section-head">
          <div>
            <p class="index-label">01 / THE OPPORTUNITY</p>
            <h3>Diagnosing the gap.</h3>
          </div>
        </div>
        <div class="cs-opportunity-grid">
          <article class="cs-bento-card">
            <span class="cs-card-tag">CHALLENGE</span>
            <h4>What the brand needed.</h4>
            <p>${e(p.challenge)}</p>
          </article>
          <article class="cs-bento-card cs-bento-accent">
            <span class="cs-card-tag">INSIGHT</span>
            <h4>What I noticed.</h4>
            <p>${e(p.insight)}</p>
          </article>
        </div>
      </section>

      <!-- 02 Strategic Move -->
      <section class="cs-section" id="cs-strategy">
        <div class="cs-strategy-banner">
          <p class="index-label">02 / THE STRATEGIC MOVE</p>
          <h3>Not more posts.<br><em>A better reason to watch.</em></h3>
          <p>${e(p.move)}</p>
        </div>
        <div class="cs-pillar-grid">
          ${(p.pillars || []).map((pillar, i) => `
            <article class="cs-pillar-card">
              <div class="cs-pillar-top">
                <span class="cs-pillar-num">${humanNum(i + 1)}</span>
                <span class="cs-pillar-dot" aria-hidden="true"></span>
              </div>
              <h4>${e(pillar.head)}</h4>
              <p>${e(pillar.body)}</p>
            </article>
          `).join('')}
        </div>
        <div class="cs-formats-bar">
          <span class="cs-formats-label">EXECUTION FORMATS</span>
          <div class="cs-formats-list">
            ${(p.formats || []).map(x => `<span class="cs-format-chip">${e(x)}</span>`).join('')}
          </div>
        </div>
      </section>

      ${mediaSection}
      ${insightsSection}

      <!-- Takeaway -->
      <section class="cs-section" id="cs-takeaway">
        <div class="cs-takeaway-card">
          <p class="index-label">${takeawayIndex} / THE TAKEAWAY</p>
          <blockquote><span class="cs-quote-mark" aria-hidden="true">“</span>${e(p.thought)}<span class="cs-quote-mark" aria-hidden="true">”</span></blockquote>
          <div class="cs-contribution">
            <span>MY CONTRIBUTION</span>
            <p>${e(p.role)}</p>
          </div>
        </div>
      </section>

      <!-- Prev / Next Case Switcher -->
      <nav class="cs-pager" aria-label="Case study navigation">
        <button type="button" class="cs-pager-card" data-project="${e(prev.id)}">
          <span class="cs-pager-dir">← PREVIOUS CASE</span>
          <strong>${e(prev.name)}</strong>
          <span class="cs-pager-cat">${e(prev.category)}</span>
        </button>
        <button type="button" class="cs-pager-card cs-pager-next" data-project="${e(next.id)}">
          <span class="cs-pager-dir">NEXT CASE →</span>
          <strong>${e(next.name)}</strong>
          <span class="cs-pager-cat">${e(next.category)}</span>
        </button>
      </nav>
    </div>`;
  }

  /* ── Open / Close Controllers with Reliable History & Back/Close ── */
  const pageTitle = document.title;
  let pushedCaseState = false;

  function openProject(id, pushHistory = true) {
    const p = byId[id];
    if (!p) return;
    const wasAlreadyOpen = isModalOpen(modal);
    $('#project-detail').innerHTML = renderProject(p);
    $('#modal-breadcrumb').textContent = `${projectNo(p)} / ${p.name.toUpperCase()} — CASE STUDY`;
    modal.dataset.project = id;
    modal.removeAttribute('hidden');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    if (modalShell) modalShell.scrollTop = 0;
    $('#modal-progress-bar').style.transform = 'scaleX(0)';
    syncBodyLock();
    document.title = `${p.name} — Strategy Case Study | Mayank Raj`;

    if (modalShell) modalShell.focus({ preventScroll: true });

    if (pushHistory) {
      const targetHash = `#case/${encodeURIComponent(id)}`;
      if (location.hash !== targetHash) {
        try {
          if (wasAlreadyOpen) {
            history.replaceState({ caseId: id }, '', targetHash);
          } else {
            history.pushState({ caseId: id }, '', targetHash);
            pushedCaseState = true;
          }
        } catch (_) {
          location.hash = targetHash;
        }
      }
    }
  }

  function closeProject(syncHistory = true) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
    const detailEl = $('#project-detail');
    if (detailEl) detailEl.innerHTML = '';
    document.title = pageTitle;
    pushedCaseState = false;
    syncBodyLock();

    if (syncHistory && location.hash.startsWith('#case/')) {
      try {
        history.replaceState({}, '', '#projects');
      } catch (_) {
        location.hash = '#projects';
      }
    }
  }

  function getDriveEmbedUrl(v) {
    if (v.embed) return v.embed;
    if (v.id) return `https://drive.google.com/file/d/${encodeURIComponent(v.id)}/preview`;
    if (v.url) return v.url.replace(/\/view(\?.*)?$/, '/preview');
    return '';
  }

  function renderDriveStage(stageEl, p, v) {
    const embedUrl = getDriveEmbedUrl(v);
    stageEl.innerHTML = `<div class="player-loader" aria-live="polite">Loading video stream…</div>
      <iframe src="${e(embedUrl)}" title="${e(p.name)} video player" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    const frame = stageEl.querySelector('iframe');
    const loader = stageEl.querySelector('.player-loader');
    if (frame && loader) {
      frame.addEventListener('load', () => { loader.style.display = 'none'; });
    }
  }

  function openFilm(brandId, videoId) {
    const p = byId[brandId];
    const v = p?.videos?.find(x => x.id === videoId);
    if (!v) return;
    $('#player-heading').textContent = `${p.name.toUpperCase()} / ${v.name ? v.name.toUpperCase() : 'SELECTED FILM'}`;
    const videoSrc = v.mode === 'local' && v.src ? fixPath(v.src) : '';
    const embedUrl = getDriveEmbedUrl(v);
    const driveLink = v.url ? `<a class="player-ext-link" href="${e(v.url)}" target="_blank" rel="noopener noreferrer">Open original in Google Drive ↗</a>` : '';
    const playerContainer = $('#video-player');

    if (videoSrc) {
      playerContainer.innerHTML = `<div class="player-stage"><video controls autoplay playsinline preload="auto" poster="${e(fixPath(p.poster || ''))}" src="${e(videoSrc)}">Your browser cannot play this video.</video></div>${driveLink}`;
      const vid = playerContainer.querySelector('video');
      const stage = playerContainer.querySelector('.player-stage');
      if (vid) {
        vid.play().catch(() => {
          vid.muted = true;
          vid.play().catch(() => {});
        });
        vid.addEventListener('error', () => {
          if (embedUrl && stage) {
            renderDriveStage(stage, p, v);
          } else if (stage) {
            stage.innerHTML = `<div class="player-error"><p>Video could not load in the native player.</p>${driveLink}</div>`;
          }
        });
      }
    } else if (embedUrl) {
      playerContainer.innerHTML = `<div class="player-stage"></div>${driveLink}`;
      renderDriveStage(playerContainer.querySelector('.player-stage'), p, v);
    } else {
      playerContainer.innerHTML = `<div class="player-stage"><div class="player-error"><p>No video source available.</p></div></div>`;
    }

    playerModal.removeAttribute('hidden');
    requestAnimationFrame(() => playerModal.classList.add('is-open'));
    syncBodyLock();
    if (playerShell) playerShell.focus({ preventScroll: true });
  }

  function closeFilm() {
    if (!playerModal) return;
    playerModal.classList.remove('is-open');
    playerModal.setAttribute('hidden', '');
    const vp = $('#video-player');
    if (vp) vp.innerHTML = '';
    syncBodyLock();
  }

  function openImage(path, label) {
    $('#image-heading').textContent = label || 'Original source screenshot';
    $('#image-viewer').innerHTML = `<img alt="${e(label || 'Screenshot')}" src="${e(path)}"/>`;
    imageModal.removeAttribute('hidden');
    requestAnimationFrame(() => imageModal.classList.add('is-open'));
    syncBodyLock();
    if (imageShell) imageShell.focus({ preventScroll: true });
  }

  function closeImage() {
    if (!imageModal) return;
    imageModal.classList.remove('is-open');
    imageModal.setAttribute('hidden', '');
    const iv = $('#image-viewer');
    if (iv) iv.innerHTML = '';
    syncBodyLock();
  }

  /* ── Delegated Clicks inside Page & Case Study Modal ── */
  document.addEventListener('click', event => {
    const toggleMore = event.target.closest('[data-toggle-more]');
    if (toggleMore) {
      const wrap = toggleMore.closest('.cs-more-wrap');
      const extraGrid = wrap?.querySelector('.cs-more-reels');
      if (extraGrid) {
        const expanded = toggleMore.getAttribute('aria-expanded') === 'true';
        toggleMore.setAttribute('aria-expanded', String(!expanded));
        extraGrid.hidden = expanded;
        const count = extraGrid.children.length;
        toggleMore.querySelector('span:first-child').textContent = expanded
          ? `Show ${count} more film${count !== 1 ? 's' : ''}`
          : 'Hide additional films';
        toggleMore.querySelector('.cs-expand-icon').textContent = expanded ? '+' : '−';
      }
      return;
    }

    const jumpBtn = event.target.closest('[data-jump]');
    if (jumpBtn) {
      const target = document.getElementById(jumpBtn.dataset.jump);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const element = event.target.closest('[data-project],[data-video],[data-image]');
    if (!element) return;
    if (element.dataset.project) {
      event.preventDefault();
      openProject(element.dataset.project, true);
    } else if (element.dataset.video) {
      event.preventDefault();
      openFilm(element.dataset.brand, element.dataset.video);
    } else if (element.dataset.image) {
      event.preventDefault();
      openImage(element.dataset.image, element.dataset.imageLabel || 'Original account screenshot');
    }
  });

  /* ── Modal Back & Close Buttons (Direct + Delegated Capture for 100% Reliability) ── */
  const onBackOrClose = (e) => {
    if (e.target.closest('#close-project, #back-project')) {
      e.preventDefault();
      e.stopPropagation();
      closeProject(true);
    } else if (e.target.closest('#close-player, #back-player')) {
      e.preventDefault();
      e.stopPropagation();
      closeFilm();
    } else if (e.target.closest('#close-image, #back-image')) {
      e.preventDefault();
      e.stopPropagation();
      closeImage();
    }
  };
  document.addEventListener('click', onBackOrClose, true);
  if ($('#close-project')) $('#close-project').addEventListener('click', (e) => { e.preventDefault(); closeProject(true); });
  if ($('#back-project')) $('#back-project').addEventListener('click', (e) => { e.preventDefault(); closeProject(true); });
  if ($('#close-player')) $('#close-player').addEventListener('click', (e) => { e.preventDefault(); closeFilm(); });
  if ($('#back-player')) $('#back-player').addEventListener('click', (e) => { e.preventDefault(); closeFilm(); });
  if ($('#close-image')) $('#close-image').addEventListener('click', (e) => { e.preventDefault(); closeImage(); });
  if ($('#back-image')) $('#back-image').addEventListener('click', (e) => { e.preventDefault(); closeImage(); });

  /* ── Backdrop Clicks ───────────────────────────────── */
  modal.addEventListener('click', e => { if (e.target === modal) closeProject(true); });
  playerModal.addEventListener('click', e => { if (e.target === playerModal) closeFilm(); });
  imageModal.addEventListener('click', e => { if (e.target === imageModal) closeImage(); });

  /* ── Modal Scroll Reading Progress ─────────────────── */
  if (modalShell) {
    modalShell.addEventListener('scroll', () => {
      const max = modalShell.scrollHeight - modalShell.clientHeight;
      const progress = max > 0 ? Math.min(1, modalShell.scrollTop / max) : 0;
      $('#modal-progress-bar').style.transform = `scaleX(${progress})`;
    });
  }

  /* ── Escape Key Closes Top-most Open Modal ─────────── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (isModalOpen(imageModal)) { closeImage(); return; }
    if (isModalOpen(playerModal)) { closeFilm(); return; }
    if (isModalOpen(modal)) { closeProject(true); }
  });

  /* ── Filters & Search & Mobile Menu ────────────────── */
  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    $$('.filter-button').forEach(x => {
      x.classList.toggle('active', x === button);
      x.setAttribute('aria-pressed', String(x === button));
    });
    renderArchive();
  }));
  $('#brand-search').addEventListener('input', renderArchive);

  const menu = $('#menu-toggle');
  menu.addEventListener('click', () => {
    const open = $('#primary-nav').classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  $$('#primary-nav a').forEach(link => link.addEventListener('click', () => {
    $('#primary-nav').classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
  }));

  /* ── Browser Back / Forward Routing ────────────────── */
  const route = () => {
    const match = decodeURIComponent(location.hash || '').match(/^#case\/([a-z0-9-]+)$/);
    if (match) {
      openProject(match[1], false);
    } else {
      if (isModalOpen(imageModal)) closeImage();
      if (isModalOpen(playerModal)) closeFilm();
      if (isModalOpen(modal)) {
        pushedCaseState = false;
        closeProject(false);
      }
    }
  };
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);

  renderArchive();
  route();
})();
