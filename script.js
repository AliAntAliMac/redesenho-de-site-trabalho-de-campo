 
    /* =====================
       Dados e persistência
       ===================== */
    const STORAGE_KEY = 'cartaredesign_v1';
    const sampleData = [
      {
        id: cryptoRandomId(),
        title: 'Cine Teatro África — uma catedral a cair aos pedaços',
        category: 'Cultura',
        date: '2019-01-18',
        excerpt: 'O Cine Teatro África é um espaço cultural com forte memória histórica, mas enfrenta problemas de degradação e falta de manutenção. Este artigo analisa o contexto e os intervenientes ligados ao seu estado atual.',
        img: 'https://cartamz.com/wp-content/uploads/2019/01/cine_teatro_africa.jpg',
        content: '<p><strong>Resumo:</strong> O Cine Teatro África, localizado em Maputo, foi um centro importante para a vida cultural. O texto original relata a decadência do edifício e problemáticas institucionais. Este redesenho utiliza esse artigo como ficheiro de exemplo.</p>'
      },
      {
        id: cryptoRandomId(),
        title: 'Restauro e memórias locais',
        category: 'Cultura',
        date: '2020-06-10',
        excerpt: 'Casos de restauro em espaços similares e iniciativas comunitárias.',
        img: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=6a6b1b3b9d0a',
        content: '<p>Exemplo de conteúdo adicional para demonstrar múltiplos registos no feed.</p>'
      }
    ];

    function cryptoRandomId() { return 'id-' + Math.random().toString(36).slice(2, 9); }

    function loadItems() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : structuredClone(sampleData);
      } catch (e) {
        console.error('Erro a ler storage', e); return structuredClone(sampleData);
      }
    }
    function saveItems(items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    /* ===========
       UI helpers
       =========== */
    const feed = document.getElementById('feed');
    const tpl = document.getElementById('cardTpl');
    const qInput = document.getElementById('q');
    const sortSelect = document.getElementById('sort');
    const catFilter = document.getElementById('catFilter');
    const countEl = document.getElementById('count');
    const jsonBlob = document.getElementById('jsonBlob');

    // Modal elements
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');

    // Buttons
    const btnAdd = document.getElementById('btnAdd');
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');

    function buildCategoryOptions(items) {
      const cats = [...new Set(items.map(i => i.category).filter(Boolean))].sort();
      catFilter.innerHTML = '<option value="">Todas</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    function escapeHtml(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }

    function render(items) {
      feed.innerHTML = '';
      if (!items.length) { feed.innerHTML = '<div class="empty">Nenhum artigo encontrado.</div>'; return; }
      items.forEach(it => {
        const clone = tpl.content.cloneNode(true);
        const img = clone.querySelector('.card-img');
        img.src = it.img || '';
        img.alt = it.title || 'imagem do artigo';
        clone.querySelector('.card-title').textContent = it.title;
        clone.querySelector('.card-excerpt').textContent = it.excerpt;
        clone.querySelector('.card-date').textContent = formatDate(it.date);
        clone.querySelector('.card-cat').textContent = it.category || '';

        const btnView = clone.querySelector('.btnView');
        const btnEdit = clone.querySelector('.btnEdit');
        const btnDelete = clone.querySelector('.btnDelete');

        btnView.addEventListener('click', () => openView(it.id));
        btnEdit.addEventListener('click', () => openEditor(it.id));
        btnDelete.addEventListener('click', () => removeItem(it.id));

        feed.appendChild(clone);
      });
    }

    function formatDate(d) {
      try { return new Date(d).toLocaleDateString(); } catch (e) { return d }
    }

    /* =============
       Search & Sort
       ============= */
    function searchItems(items, q) {
      if (!q) return items;
      q = q.trim().toLowerCase();
      return items.filter(it => (it.title + ' ' + (it.excerpt || '') + ' ' + (it.category || '')).toLowerCase().includes(q));
    }
    function sortItems(items, mode) {
      const arr = [...items];
      if (mode === 'date-desc') return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (mode === 'date-asc') return arr.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (mode === 'title-asc') return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      return arr;
    }

    function applyFiltersAndRender() {
      let items = loadItems();
      const q = qInput.value || '';
      items = searchItems(items, q);
      if (catFilter.value) items = items.filter(i => i.category === catFilter.value);
      items = sortItems(items, sortSelect.value);
      render(items);
      countEl.textContent = items.length + (items.length === 1 ? ' artigo' : ' artigos');
    }

    /* ============
       CRUD actions
       ============ */
    function openView(id) {
      const items = loadItems();
      const it = items.find(x => x.id === id);
      if (!it) return alert('Artigo não encontrado');
      modalTitle.textContent = it.title;
      modalBody.innerHTML = `
        <img src="${escapeHtml(it.img || '')}" alt="${escapeHtml(it.title)}" style="max-width:100%;height:auto;display:block;margin-bottom:.6rem">
        <p><strong>Categoria:</strong> ${escapeHtml(it.category || '')}</p>
        <p><strong>Data:</strong> ${escapeHtml(it.date || '')}</p>
        <div>${it.content || '<p>(Sem conteúdo detalhado)</p>'}</div>
      `;
      openModal();
    }

    function openEditor(id) {
      const items = loadItems();
      const it = items.find(x => x.id === id) || { id: cryptoRandomId(), title: '', category: '', date: '', excerpt: '', img: '', content: '' };
      modalTitle.textContent = id ? 'Editar artigo' : 'Adicionar artigo';
      modalBody.innerHTML = `
        <form id="frmEdit">
          <div class="form-row"><label>Título</label><input name="title" value="${escapeHtml(it.title || '')}" required></div>
          <div class="form-row"><label>Categoria</label><input name="category" value="${escapeHtml(it.category || '')}"></div>
          <div class="form-row"><label>Data (YYYY-MM-DD)</label><input name="date" value="${escapeHtml(it.date || '')}"></div>
          <div class="form-row"><label>Imagem (URL)</label><input name="img" value="${escapeHtml(it.img || '')}"></div>
          <div class="form-row"><label>Resumo / excerto</label><textarea name="excerpt">${escapeHtml(it.excerpt || '')}</textarea></div>
          <div class="form-row"><label>Conteúdo HTML</label><textarea name="content">${escapeHtml(it.content || '')}</textarea></div>
          <div class="actions"><button class="btn" type="submit">Guardar</button><button class="btn secondary" id="cancelEdit" type="button">Cancelar</button></div>
        </form>
      `;

      const frm = modalBody.querySelector('#frmEdit');
      const cancelEdit = modalBody.querySelector('#cancelEdit');
      cancelEdit.addEventListener('click', closeModal);
      frm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const formData = new FormData(frm);
        const obj = { id: it.id || cryptoRandomId(), title: formData.get('title'), category: formData.get('category'), date: formData.get('date') || new Date().toISOString().slice(0, 10), img: formData.get('img'), excerpt: formData.get('excerpt'), content: formData.get('content') };
        const items = loadItems();
        const idx = items.findIndex(x => x.id === obj.id);
        if (idx >= 0) { items[idx] = obj; } else { items.push(obj); }
        saveItems(items);
        buildCategoryOptions(items);
        applyFiltersAndRender();
        closeModal();
      });

      openModal();
    }

    function removeItem(id) {
      if (!confirm('Remover este artigo?')) return;
      let items = loadItems();
      items = items.filter(x => x.id !== id);
      saveItems(items);
      buildCategoryOptions(items);
      applyFiltersAndRender();
    }

    /* ============
       Modal helpers
       ============ */
    function openModal() { modal.classList.add('active'); modal.setAttribute('aria-hidden', 'false'); modalClose.focus(); }
    function closeModal() { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    /* ============
       Export / Import
       ============ */
    btnExport.addEventListener('click', () => {
      const items = loadItems();
      jsonBlob.value = JSON.stringify(items, null, 2);
      alert('JSON gerado no campo abaixo — podes copiar para backup.');
    });
    btnImport.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(jsonBlob.value);
        if (!Array.isArray(parsed)) throw new Error('Formato inválido');
        saveItems(parsed);
        buildCategoryOptions(parsed);
        applyFiltersAndRender();
        alert('Importação realizada com sucesso.');
      } catch (e) { alert('Erro ao importar JSON: ' + e.message); }
    });

    /* ==========
       Inicialização
       ========== */
    function init() {
      // cria dados iniciais se não existir
      if (!localStorage.getItem(STORAGE_KEY)) saveItems(sampleData);
      const items = loadItems();
      buildCategoryOptions(items);
      applyFiltersAndRender();

      // eventos
      qInput.addEventListener('input', () => applyFiltersAndRender());
      sortSelect.addEventListener('change', () => applyFiltersAndRender());
      catFilter.addEventListener('change', () => applyFiltersAndRender());
      document.getElementById('btnAdd').addEventListener('click', () => openEditor(null));

      // home link: scroll to top
      document.getElementById('homeLink').addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

      // keyboard: ESC fecha modal
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeModal(); });
    }

    init();
  