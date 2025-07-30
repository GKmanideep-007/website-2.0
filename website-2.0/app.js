/* ========= deep URLibrary Logic ========= */
(() => {
  /* ---------- Helpers ---------- */
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const sanitizeTags = str =>
    str.split(',').map(t => t.trim()).filter(Boolean);
  const genId = () => Date.now().toString(36);
  const fmtDate = iso =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  /* ---------- State ---------- */
  const LS_KEY = 'deepURLibrary';
  const load = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  const save = data => localStorage.setItem(LS_KEY, JSON.stringify(data));

  let bookmarks = load();
  let editingId = null;

  /* ---------- Elements ---------- */
  const listEl = $('#bookmarkList');
  const form = $('#bookmarkForm');
  const urlInput = $('#urlInput');
  const titleInput = $('#titleInput');
  const tagsInput = $('#tagsInput');
  const searchInput = $('#searchInput');
  const emptyState = $('#emptyState');

  /* ---------- Logo Modal Elements ---------- */
  const logoImage = $('#logoImage');
  const logoModal = $('#logoModal');
  const closeModal = $('#closeModal');

  /* ---------- Logo Modal Functionality ---------- */
  const showLogoModal = () => {
    logoModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const hideLogoModal = () => {
    logoModal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  // Logo click event
  logoImage.addEventListener('click', showLogoModal);

  // Close modal events
  closeModal.addEventListener('click', hideLogoModal);
  logoModal.addEventListener('click', (e) => {
    if (e.target === logoModal) {  // Only close if clicking the backdrop
      hideLogoModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoModal.classList.contains('show')) {
      hideLogoModal();
    }
  });

  /* ---------- Render ---------- */
  const render = () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = bookmarks.filter(bm => {
      const hay = [
        bm.url,
        bm.title || '',
        ...bm.tags
      ].join(' ').toLowerCase();
      return hay.includes(term);
    });

    listEl.innerHTML = '';
    if (!filtered.length) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filtered.forEach(bm => {
      const li = document.createElement('li');
      li.className = 'bookmark-card';
      li.innerHTML = `
        <a href="${bm.url}" class="bookmark-url" target="_blank" rel="noopener">
          ${bm.url}
        </a>
        ${bm.title ? `<div class="bookmark-title">${bm.title}</div>` : ''}
        <div class="tag-list">
          ${bm.tags.map(tag => `<button class="tag" data-tag="${tag}">${tag}</button>`).join('')}
        </div>
        <div class="meta">
          <span>Added on ${fmtDate(bm.date)}</span>
          <div class="actions">
            <button class="btn btn-ghost btn-edit" data-id="${bm.id}">✏ Edit</button>
            <button class="btn btn-ghost btn-delete" data-id="${bm.id}">🗑 Delete</button>
          </div>
        </div>`;
      listEl.appendChild(li);
    });
  };

  /* ---------- Handlers ---------- */
  const resetForm = () => {
    form.reset();
    editingId = null;
    $('.btn-primary', form).innerHTML = '<span class="icon">＋</span> Add Bookmark';
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!/^https?:\/\//i.test(url)) {
      alert('URL must start with http:// or https://');
      return;
    }
    const title = titleInput.value.trim();
    const tags = sanitizeTags(tagsInput.value);

    if (tags.length === 0) {
      alert('Please add at least one tag');
      return;
    }

    if (editingId) {
      const idx = bookmarks.findIndex(b => b.id === editingId);
      if (idx !== -1) {
        bookmarks[idx] = { ...bookmarks[idx], url, title, tags };
      }
    } else {
      bookmarks.unshift({
        id: genId(),
        url,
        title,
        tags,
        date: new Date().toISOString()
      });
    }
    save(bookmarks);
    resetForm();
    render();
  });

  listEl.addEventListener('click', e => {
    const tagBtn = e.target.closest('.tag');
    if (tagBtn) {
      searchInput.value = tagBtn.dataset.tag;
      searchInput.focus();
      render();
      return;
    }

    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const bm = bookmarks.find(b => b.id === editBtn.dataset.id);
      if (bm) {
        urlInput.value = bm.url;
        titleInput.value = bm.title || '';
        tagsInput.value = bm.tags.join(', ');
        editingId = bm.id;
        $('.btn-primary', form).textContent = 'Save Changes';
        urlInput.focus();
      }
      return;
    }

    const delBtn = e.target.closest('.btn-delete');
    if (delBtn) {
      if (confirm('Delete this bookmark?')) {
        bookmarks = bookmarks.filter(b => b.id !== delBtn.dataset.id);
        save(bookmarks);
        render();
      }
    }
  });

  searchInput.addEventListener('input', render);

  /* ---------- Init ---------- */
  if (!bookmarks.length) {
    // populate demo data once
    bookmarks = [
      {
        id: genId(),
        url: 'https://youtube.com/watch?v=headvideoeditingtutorial',
        title: 'Head Video Editing Tutorial',
        tags: ['video', 'editing', 'tutorial', 'head'],
        date: '2025-07-28T12:00:00Z'
      },
      {
        id: genId(),
        url: 'https://adobe.com/products/creative-suite',
        title: 'Adobe Creative Suite',
        tags: ['software', 'design', 'editing', 'adobe'],
        date: '2025-07-27T12:00:00Z'
      }
    ];
    save(bookmarks);
  }
  render();
})();