document.addEventListener('DOMContentLoaded', async () => {
    // Inject Admin Bar HTML
    const adminBarHTML = `
        <div id="saveStatus" style="font-size:16px; color:#fff; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:bold; background:rgba(0,180,80,0.9); padding:15px 25px; border-radius:12px; box-shadow:0 6px 15px rgba(0,0,0,0.3); z-index:999999; display:none; text-align:center;"></div>
        <div class="admin-bar" id="adminBar">
            <span>🛠️ <b>Super Studio Mode</b></span>
            <button id="addBoxBtn">➕ Tambah Menu</button>
            <button id="addTextBtn" style="background: #2196F3;">📝 Tambah Teks</button>
            <button id="addLinkBtn" style="background: #00bcd4;">🔗 Tambah Link</button>
            <button id="addPopupBtn" style="background: #9c27b0;">🎇 Tambah Popup</button>
            <button id="uploadImgBtn">🖼️ Gambar</button> 
            <button id="duplicateBtn">👥 Duplikat (<span id="selectCount">0</span>)</button>
            <button id="undoBtn" disabled>↩️ Undo</button>
            <button id="deleteBtn">🗑️ Hapus</button>
            <button id="removeImgBtn" style="background: #ff9800;">❌ Hapus Gambar</button>
            <button id="lockBtn" style="background: #4caf50;">🔒 Kunci/Buka</button>
            <button id="manualSaveBtn" style="background: #e91e63;">💾 Simpan</button>
            <button id="exitAdminBtn">Selesai</button>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', adminBarHTML);

    const fixedContainerHTML = `<div class="fixed-container" id="fixedContainer"></div>`;
    document.body.insertAdjacentHTML('beforeend', fixedContainerHTML);

    // Dynamic Storage Key
    const pathParts = window.location.pathname.split('/');
    let pageName = pathParts.pop();
    if (!pageName || pageName === '') {
        pageName = 'index.html';
    }
    const STORAGE_KEY = (pageName === 'index.html') ? 'gopay_layout_v3' : 'gopay_layout_' + pageName.replace('.html', '');

    // Core Elements
    const appContainer = document.getElementById('appContainer');
    const fixedContainer = document.getElementById('fixedContainer');
    const exitAdminBtn = document.getElementById('exitAdminBtn');
    const addBoxBtn = document.getElementById('addBoxBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const addPopupBtn = document.getElementById('addPopupBtn');
    const duplicateBtn = document.getElementById('duplicateBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const uploadImgBtn = document.getElementById('uploadImgBtn');
    const removeImgBtn = document.getElementById('removeImgBtn');
    const lockBtn = document.getElementById('lockBtn');
    const manualSaveBtn = document.getElementById('manualSaveBtn');
    const undoBtn = document.getElementById('undoBtn');
    const selectCountLabel = document.getElementById('selectCount');

    let isEditing = false;
    let selectedBoxIds = [];
    let undoHistory = [];

    // --- PENGATURAN SUPABASE ---
    const SUPABASE_URL = "https://orqtqcoavcnkqyetuyqz.supabase.co";
    const SUPABASE_KEY = "sb_publishable_fy73ucTrSnz9uZKsBrLJcA_Nt2XRo6g";
    const USE_SUPABASE = SUPABASE_URL.startsWith("http");

    let layoutData = [];

    async function loadLayoutData() {
        if (USE_SUPABASE) {
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/mockup_layouts?page_name=eq.${STORAGE_KEY}`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                const data = await res.json();
                if (data && data.length > 0 && data[0].layout_data) {
                    layoutData = typeof data[0].layout_data === 'string' ? JSON.parse(data[0].layout_data) : data[0].layout_data;
                    return;
                }
            } catch (e) {
                console.error("Gagal load dari Supabase", e);
            }
        }
        // Fallback ke localStorage
        let saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            layoutData = JSON.parse(saved);
        } else {
            // Default awal jika kosong
            layoutData = [
                { id: 'box-1', top: 10.9, left: 4.8, width: 20.5, height: 4.2, image: '' },
                { id: 'box-2', top: 10.9, left: 28.5, width: 20.5, height: 4.2, image: '' },
                { id: 'box-3', top: 10.9, left: 52.2, width: 20.5, height: 4.2, image: '' },
                { id: 'box-4', top: 10.9, left: 75.8, width: 20.5, height: 4.2, image: '' }
            ];
        }
    }

    async function saveLayoutData(showNotif = true) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutData));
        const statusEl = document.getElementById('saveStatus');
        
        if (USE_SUPABASE) {
            if (statusEl && showNotif) {
                statusEl.innerText = "Menyimpan online... ⏳";
                statusEl.style.display = 'block';
            }
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/mockup_layouts`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({ page_name: STORAGE_KEY, layout_data: layoutData })
                });
                if (!res.ok) {
                    const errText = await res.text();
                    console.error("Supabase Error:", errText);
                    throw new Error("Server menolak: " + res.status);
                }
                if (statusEl && showNotif) {
                    statusEl.innerText = "Tersimpan ✔️";
                    setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 2000);
                }
            } catch (e) {
                console.error("Gagal save ke Supabase", e);
                if (statusEl && showNotif) {
                    statusEl.innerText = "Gagal simpan ❌";
                    setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 3000);
                }
            }
        } else {
            if (statusEl && showNotif) {
                statusEl.innerText = "Tersimpan ✔️";
                statusEl.style.display = 'block';
                setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 2000);
            }
        }
    }

    let saveTimeout;
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveLayoutData(false), 1000);
    }

    await loadLayoutData();

    layoutData.forEach(item => {
        if (item.text === undefined) item.text = "Menu";
        if (item.font === undefined) item.font = "sans-serif";
        if (item.bold === undefined) item.bold = false;
        if (item.italic === undefined) item.italic = false;
        if (item.size === undefined) item.size = 11;
        if (item.isFixed === undefined) item.isFixed = false;
    });

    function saveToHistory() {
        if (undoHistory.length >= 20) undoHistory.shift();
        undoHistory.push(JSON.stringify(layoutData));
        if (undoHistory.length > 20) undoHistory.shift();
        undoBtn.disabled = false;
    }

    function saveAndRender() {
        saveLayoutData(false);
        renderLayout();
    }

    function triggerUndo() {
        if (undoHistory.length > 0) {
            let previousState = undoHistory.pop();
            layoutData = JSON.parse(previousState);
            saveLayoutData(false);
            renderLayout();
        }
        if (undoHistory.length === 0) undoBtn.disabled = true;
    }

    appContainer.addEventListener('mousedown', (e) => {
        if (e.target === appContainer || e.target.classList.contains('main-bg')) {
            selectedBoxIds = [];
            renderLayout();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.settings-popup') && !e.target.closest('.settings-trigger')) {
            document.querySelectorAll('.settings-popup.show').forEach(p => p.classList.remove('show'));
        }
    });

    window.addEventListener('keydown', (e) => {
        if (isEditing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            triggerUndo();
        }
    });

    undoBtn.addEventListener('click', triggerUndo);

    if (manualSaveBtn) {
        manualSaveBtn.addEventListener('click', () => {
            saveLayoutData(true);
        });
    }

    function toggleAdminMode() {
        isEditing = !isEditing;
        if (isEditing) {
            document.body.classList.add('admin-mode');
        } else {
            document.body.classList.remove('admin-mode');
            selectedBoxIds = [];
        }
        renderLayout();
    }

    window.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key.toLowerCase() === 'a') {
            toggleAdminMode();
        }
    });

    // Fitur Rahasia Mobile: Tap 4x dengan cepat di mana saja untuk masuk/keluar mode studio
    let tapCount = 0;
    let lastTapTime = 0;
    document.addEventListener('touchstart', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 400 && tapLength > 0) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        if (tapCount === 4) {
            toggleAdminMode();
            tapCount = 0;
        }
        lastTapTime = currentTime;
    });

    exitAdminBtn.addEventListener('click', () => {
        document.body.classList.remove('admin-mode');
        isEditing = false;
        selectedBoxIds = [];
        undoHistory = [];
        undoBtn.disabled = true;
        renderLayout();
    });

    addBoxBtn.addEventListener('click', () => {
        saveToHistory();
        const newId = 'box-' + Date.now();
        layoutData.push({ id: newId, top: 15, left: 15, width: 20, height: 4, image: '', text: 'Menu Baru', font: 'sans-serif', bold: false, italic: false, size: 11, isFixed: false, linkUrl: '', targetPage: '' });
        saveAndRender();
    });

    addTextBtn.addEventListener('click', () => {
        saveToHistory();
        const newId = 'text-' + Date.now();
        layoutData.push({ type: 'text', id: newId, top: 20, left: 20, width: 30, text: 'Teks Baru', font: 'sans-serif', bold: false, italic: false, size: 14, color: '#000000', align: 'left', isFixed: false });
        saveAndRender();
    });

    addLinkBtn.addEventListener('click', () => {
        saveToHistory();
        const newId = 'link-' + Date.now();
        layoutData.push({ type: 'link', id: newId, top: 30, left: 30, width: 25, height: 8, isFixed: false, linkUrl: '' });
        saveAndRender();
    });

    addPopupBtn.addEventListener('click', () => {
        saveToHistory();
        const newId = 'popup-' + Date.now();
        layoutData.push({ type: 'popup', id: newId, top: 15, left: 15, width: 40, height: 30, image: '', isFixed: false });
        saveAndRender();
    });

    duplicateBtn.addEventListener('click', () => {
        if (selectedBoxIds.length === 0) return;
        saveToHistory();
        selectedBoxIds.forEach(id => {
            const src = layoutData.find(b => b.id === id);
            if (src) {
                const newId = 'box-' + Date.now() + Math.floor(Math.random() * 100);
                layoutData.push({
                    ...src,
                    id: newId,
                    top: Math.min(src.top + 7, 90)
                });
            }
        });
        selectedBoxIds = [];
        saveAndRender();
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedBoxIds.length === 0) return;
        if (confirm(`Hapus ${selectedBoxIds.length} item terpilih?`)) {
            saveToHistory();
            layoutData = layoutData.filter(box => !selectedBoxIds.includes(box.id));
            selectedBoxIds = [];
            saveAndRender();
        }
    });

    function updateSelectCount() {
        selectCountLabel.innerText = selectedBoxIds.length;
    }

    function renderLayout() {
        appContainer.querySelectorAll('.menu-item-wrapper').forEach(w => w.remove());
        fixedContainer.querySelectorAll('.menu-item-wrapper').forEach(w => w.remove());

        const containerWidth = appContainer.clientWidth;
        const estimatedContainerHeight = containerWidth / 0.35;
        const scaleFactor = containerWidth / 400;

        const popupItems = layoutData.filter(b => b.type === 'popup');

        layoutData.forEach((item) => {
            const parentContainer = item.isFixed ? fixedContainer : appContainer;

            if (item.type === 'text') {
                const wrapper = document.createElement('div');
                wrapper.className = 'menu-item-wrapper';
                wrapper.id = 'wrap-' + item.id;
                wrapper.style.top = item.top + '%';
                wrapper.style.left = item.left + '%';
                wrapper.style.width = item.width + '%';
                if (selectedBoxIds.includes(item.id)) wrapper.classList.add('selected');

                const textDiv = document.createElement('div');
                textDiv.className = 'placeholder-zone';
                textDiv.setAttribute('data-locked', item.locked || false);
                textDiv.style.background = "transparent";
                textDiv.style.border = isEditing ? "1px dashed #555" : "none";
                textDiv.style.padding = isEditing ? "10px" : "0px";
                textDiv.style.height = "auto";

                const content = document.createElement('div');
                content.innerText = item.text || "Klik untuk edit...";
                content.contentEditable = isEditing ? "true" : "false";
                content.style.width = "100%";
                content.style.fontFamily = item.font;
                content.style.fontSize = (item.size * scaleFactor) + 'px';
                content.style.fontWeight = item.bold ? 'bold' : 'normal';
                content.style.fontStyle = item.italic ? 'italic' : 'normal';
                content.style.color = item.color || "#000000";
                content.style.textAlign = item.align || "left";
                content.style.outline = "none";

                content.addEventListener('input', () => {
                    item.text = content.innerText;
                    debouncedSave();
                });

                content.addEventListener('focus', () => {
                    if (!selectedBoxIds.includes(item.id)) {
                        selectedBoxIds = [item.id];
                        renderLayout();
                    }
                });

                const handle = document.createElement('div');
                handle.className = 'resize-handle';

                const dragHandleTop = document.createElement('div');
                dragHandleTop.innerHTML = '✥ Geser';
                dragHandleTop.style.position = 'absolute';
                dragHandleTop.style.top = '-20px';
                dragHandleTop.style.left = '50%';
                dragHandleTop.style.transform = 'translateX(-50%)';
                dragHandleTop.style.background = '#2196F3';
                dragHandleTop.style.color = '#fff';
                dragHandleTop.style.padding = '2px 8px';
                dragHandleTop.style.fontSize = '10px';
                dragHandleTop.style.borderRadius = '4px 4px 0 0';
                dragHandleTop.style.cursor = 'move';
                dragHandleTop.style.userSelect = 'none';
                dragHandleTop.style.whiteSpace = 'nowrap';
                dragHandleTop.style.display = (isEditing && selectedBoxIds.includes(item.id)) ? 'block' : 'none';
                dragHandleTop.contentEditable = "false";

                textDiv.appendChild(dragHandleTop);
                textDiv.appendChild(content);
                textDiv.appendChild(handle);
                wrapper.appendChild(textDiv);

                const toolbar = document.createElement('div');
                toolbar.innerHTML = `
                    <div class="settings-trigger">⚙️</div>
                    <div class="settings-popup">
                        <div class="settings-row">
                            <label>Font:</label>
                            <select class="font-fam">
                                <option value="sans-serif" ${item.font === 'sans-serif' ? 'selected' : ''}>Sans</option>
                                <option value="serif" ${item.font === 'serif' ? 'selected' : ''}>Serif</option>
                                <option value="monospace" ${item.font === 'monospace' ? 'selected' : ''}>Mono</option>
                                <option value="'Courier New'" ${item.font === "'Courier New'" ? 'selected' : ''}>Courier</option>
                            </select>
                        </div>
                        <div class="settings-row">
                            <label>Ukuran:</label>
                            <input type="number" class="font-sz" value="${item.size}" style="width:50px;">
                        </div>
                        <div class="settings-row" style="justify-content: flex-start;">
                            <button class="btn-b ${item.bold ? 'active' : ''}"><b>B</b></button>
                            <button class="btn-i ${item.italic ? 'active' : ''}"><i>I</i></button>
                            <input type="color" class="font-col" value="${item.color || '#000000'}">
                            <select class="txt-align">
                                <option value="left" ${item.align === 'left' ? 'selected' : ''}>Kiri</option>
                                <option value="center" ${item.align === 'center' ? 'selected' : ''}>Tengah</option>
                                <option value="right" ${item.align === 'right' ? 'selected' : ''}>Kanan</option>
                            </select>
                        </div>
                        <div class="settings-row">
                            <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
                                <input type="checkbox" class="lock-scroll-cb" ${item.isFixed ? 'checked' : ''}> 📌 Lock Scroll
                            </label>
                        </div>
                    </div>
                `;
                const trigger = toolbar.querySelector('.settings-trigger');
                const popup = toolbar.querySelector('.settings-popup');
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.settings-popup.show').forEach(p => { if (p !== popup) p.classList.remove('show'); });
                    popup.classList.toggle('show');
                });
                popup.addEventListener('mousedown', e => e.stopPropagation());
                trigger.addEventListener('mousedown', e => e.stopPropagation());

                toolbar.querySelector('.font-fam').addEventListener('change', (e) => { saveToHistory(); item.font = e.target.value; saveAndRender(); });
                toolbar.querySelector('.font-sz').addEventListener('change', (e) => { saveToHistory(); item.size = parseInt(e.target.value) || 14; saveAndRender(); });
                toolbar.querySelector('.font-col').addEventListener('input', (e) => {
                    item.color = e.target.value;
                    content.style.color = item.color;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutData));
                });
                toolbar.querySelector('.font-col').addEventListener('change', () => { saveToHistory(); });
                toolbar.querySelector('.btn-b').addEventListener('click', () => { saveToHistory(); item.bold = !item.bold; saveAndRender(); });
                toolbar.querySelector('.btn-i').addEventListener('click', () => { saveToHistory(); item.italic = !item.italic; saveAndRender(); });
                toolbar.querySelector('.txt-align').addEventListener('change', (e) => { saveToHistory(); item.align = e.target.value; saveAndRender(); });
                toolbar.querySelector('.lock-scroll-cb').addEventListener('change', (e) => { saveToHistory(); item.isFixed = e.target.checked; saveAndRender(); });

                wrapper.appendChild(toolbar);
                parentContainer.appendChild(wrapper);
                makeInteractive(wrapper, textDiv, item);
                return;
            } else if (item.type === 'link') {
                const wrapper = document.createElement('div');
                wrapper.className = 'menu-item-wrapper';
                wrapper.id = 'wrap-' + item.id;
                wrapper.style.top = item.top + '%';
                wrapper.style.left = item.left + '%';
                wrapper.style.width = item.width + '%';
                if (selectedBoxIds.includes(item.id)) wrapper.classList.add('selected');

                const zone = document.createElement('div');
                zone.className = 'placeholder-zone';
                zone.setAttribute('data-type', 'link');
                zone.setAttribute('data-locked', item.locked || false);

                const actualHeightPx = (item.height / 100) * (parentContainer.offsetHeight || estimatedContainerHeight);
                zone.style.height = actualHeightPx + 'px';

                zone.addEventListener('click', () => {
                    if (!isEditing && item.linkUrl) {
                        window.location.href = item.linkUrl;
                    }
                });

                const handle = document.createElement('div');
                handle.className = 'resize-handle';
                zone.appendChild(handle);

                const toolbar = document.createElement('div');
                toolbar.innerHTML = `
                    <div class="settings-trigger">⚙️</div>
                    <div class="settings-popup">
                        <div class="settings-row" style="flex-direction:column; align-items:flex-start;">
                            <label>URL Tujuan:</label>
                            <input type="text" class="link-input" placeholder="misal: promo.html" value="${item.linkUrl || ''}" style="width:100%; box-sizing:border-box;">
                        </div>
                        <div class="settings-row">
                            <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
                                <input type="checkbox" class="lock-scroll-cb" ${item.isFixed ? 'checked' : ''}> 📌 Lock Scroll
                            </label>
                        </div>
                    </div>
                `;
                const trigger = toolbar.querySelector('.settings-trigger');
                const popup = toolbar.querySelector('.settings-popup');
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.settings-popup.show').forEach(p => { if (p !== popup) p.classList.remove('show'); });
                    popup.classList.toggle('show');
                });
                popup.addEventListener('mousedown', e => e.stopPropagation());
                trigger.addEventListener('mousedown', e => e.stopPropagation());
                toolbar.querySelector('.link-input').addEventListener('input', (e) => {
                    item.linkUrl = e.target.value;
                    debouncedSave();
                });
                toolbar.querySelector('.link-input').addEventListener('change', () => saveToHistory());
                toolbar.querySelector('.lock-scroll-cb').addEventListener('change', (e) => {
                    saveToHistory();
                    item.isFixed = e.target.checked;
                    saveAndRender();
                });

                wrapper.appendChild(toolbar);
                wrapper.appendChild(zone);
                parentContainer.appendChild(wrapper);
                makeInteractive(wrapper, zone, item);
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'menu-item-wrapper';
            wrapper.id = 'wrap-' + item.id;
            wrapper.style.top = item.top + '%';
            wrapper.style.left = item.left + '%';
            wrapper.style.width = item.width + '%';

            if (selectedBoxIds.includes(item.id)) {
                wrapper.classList.add('selected');
            }

            if (item.type === 'popup') {
                const zone = document.createElement('div');
                zone.className = 'placeholder-zone';
                zone.setAttribute('data-locked', item.locked || false);
                const actualHeightPx = (item.height / 100) * (parentContainer.offsetHeight || estimatedContainerHeight);
                zone.style.height = actualHeightPx + 'px';

                if (item.image) {
                    zone.innerHTML = `<img src="${item.image}" style="width:100%; height:100%; object-fit:contain; pointer-events:none;">`;
                } else {
                    zone.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#999; font-size:10px;">[Popup: ${item.id}]</div>`;
                }

                const label = document.createElement('div');
                label.className = 'box-label';
                label.innerText = 'Popup: ' + item.id.slice(-4);
                
                const handle = document.createElement('div');
                handle.className = 'resize-handle';
                zone.appendChild(label);
                zone.appendChild(handle);

                const toolbar = document.createElement('div');
                toolbar.innerHTML = `
                    <div class="settings-trigger">⚙️</div>
                    <div class="settings-popup">
                        <div class="settings-row">
                            <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
                                <input type="checkbox" class="lock-scroll-cb" ${item.isFixed ? 'checked' : ''}> 📌 Lock Scroll
                            </label>
                        </div>
                    </div>
                `;
                const trigger = toolbar.querySelector('.settings-trigger');
                const popup = toolbar.querySelector('.settings-popup');
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.settings-popup.show').forEach(p => { if (p !== popup) p.classList.remove('show'); });
                    popup.classList.toggle('show');
                });
                popup.addEventListener('mousedown', e => e.stopPropagation());
                trigger.addEventListener('mousedown', e => e.stopPropagation());

                toolbar.querySelector('.lock-scroll-cb').addEventListener('change', (e) => {
                    saveToHistory(); item.isFixed = e.target.checked; saveAndRender();
                });

                wrapper.appendChild(toolbar);
                wrapper.appendChild(zone);
                parentContainer.appendChild(wrapper);

                if (!isEditing) {
                    wrapper.style.display = 'none';
                    wrapper.style.zIndex = '99999';
                    wrapper.addEventListener('click', () => {
                        wrapper.style.display = 'none';
                    });
                }
                
                makeInteractive(wrapper, zone, item);
                return;
            }

            const zone = document.createElement('div');
            zone.className = 'placeholder-zone';
            zone.setAttribute('data-locked', item.locked || false);

            const actualHeightPx = (item.height / 100) * (parentContainer.offsetHeight || estimatedContainerHeight);
            zone.style.height = actualHeightPx + 'px';

            if (item.image) {
                zone.innerHTML = `<img src="${item.image}">`;
            }

            const label = document.createElement('div');
            label.className = 'box-label';
            label.innerText = item.id.split('-')[0] + '-' + item.id.slice(-3);

            const handle = document.createElement('div');
            handle.className = 'resize-handle';

            zone.appendChild(label);
            zone.appendChild(handle);

            const textLabel = document.createElement('div');
            textLabel.className = 'editable-text-label';
            textLabel.innerText = item.text;
            textLabel.contentEditable = isEditing ? "true" : "false";

            textLabel.style.fontFamily = item.font;
            textLabel.style.fontWeight = item.bold ? 'bold' : 'normal';
            textLabel.style.fontStyle = item.italic ? 'italic' : 'normal';
            textLabel.style.fontSize = (item.size * scaleFactor) + 'px';

            textLabel.addEventListener('input', () => {
                item.text = textLabel.innerText;
                debouncedSave();
            });

            textLabel.addEventListener('focus', () => {
                if (!selectedBoxIds.includes(item.id)) {
                    selectedBoxIds = [item.id];
                    renderLayout();
                }
            });

            let popupOptions = '<option value="">-- Tidak Ada --</option>';
            popupItems.forEach(p => {
                popupOptions += `<option value="${p.id}" ${item.targetPopup === p.id ? 'selected' : ''}>${p.id.slice(-4)}</option>`;
            });

            const toolbar = document.createElement('div');
            toolbar.innerHTML = `
                <div class="settings-trigger">⚙️</div>
                <div class="settings-popup">
                    <div class="settings-row" style="flex-direction:column; align-items:flex-start;">
                        <label>URL Tujuan:</label>
                        <input type="text" class="link-input" placeholder="misal: promo.html" value="${item.linkUrl || ''}" style="width:100%; box-sizing:border-box;">
                    </div>
                    <div class="settings-row" style="flex-direction:column; align-items:flex-start; margin-top:5px;">
                        <label>PNG Tujuan (Popup):</label>
                        <select class="popup-target-select" style="width:100%; box-sizing:border-box;">
                            ${popupOptions}
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>Font:</label>
                        <select class="font-fam">
                            <option value="sans-serif" ${item.font === 'sans-serif' ? 'selected' : ''}>Sans</option>
                            <option value="serif" ${item.font === 'serif' ? 'selected' : ''}>Serif</option>
                            <option value="monospace" ${item.font === 'monospace' ? 'selected' : ''}>Mono</option>
                            <option value="'Courier New'" ${item.font === "'Courier New'" ? 'selected' : ''}>Courier</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>Ukuran:</label>
                        <input type="number" class="font-sz" value="${item.size}" style="width:50px;">
                    </div>
                    <div class="settings-row" style="justify-content: flex-start;">
                        <button class="btn-b ${item.bold ? 'active' : ''}"><b>B</b></button>
                        <button class="btn-i ${item.italic ? 'active' : ''}"><i>I</i></button>
                    </div>
                    <div class="settings-row">
                        <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
                            <input type="checkbox" class="lock-scroll-cb" ${item.isFixed ? 'checked' : ''}> 📌 Lock Scroll
                        </label>
                    </div>
                </div>
            `;
            const trigger = toolbar.querySelector('.settings-trigger');
            const popup = toolbar.querySelector('.settings-popup');
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.settings-popup.show').forEach(p => { if (p !== popup) p.classList.remove('show'); });
                popup.classList.toggle('show');
            });
            popup.addEventListener('mousedown', e => e.stopPropagation());
            trigger.addEventListener('mousedown', e => e.stopPropagation());

            toolbar.querySelector('.font-fam').addEventListener('change', (e) => {
                saveToHistory(); item.font = e.target.value; saveAndRender();
            });
            toolbar.querySelector('.font-sz').addEventListener('change', (e) => {
                saveToHistory(); item.size = parseInt(e.target.value) || 11; saveAndRender();
            });
            toolbar.querySelector('.btn-b').addEventListener('click', () => {
                saveToHistory(); item.bold = !item.bold; saveAndRender();
            });
            toolbar.querySelector('.btn-i').addEventListener('click', () => {
                saveToHistory(); item.italic = !item.italic; saveAndRender();
            });
            toolbar.querySelector('.lock-scroll-cb').addEventListener('change', (e) => {
                saveToHistory(); item.isFixed = e.target.checked; saveAndRender();
            });
            toolbar.querySelector('.link-input').addEventListener('input', (e) => {
                item.linkUrl = e.target.value;
                debouncedSave();
            });
            toolbar.querySelector('.link-input').addEventListener('change', () => saveToHistory());
            toolbar.querySelector('.popup-target-select').addEventListener('change', (e) => {
                item.targetPopup = e.target.value;
                saveToHistory();
                saveAndRender();
            });

            wrapper.addEventListener('click', () => {
                if (!isEditing) {
                    if (item.targetPopup) {
                        const targetEl = document.getElementById('wrap-' + item.targetPopup);
                        if (targetEl) {
                            targetEl.style.display = targetEl.style.display === 'none' ? 'block' : 'none';
                        }
                    } else if (item.linkUrl) {
                        window.location.href = item.linkUrl;
                    }
                }
            });

            wrapper.appendChild(toolbar);
            wrapper.appendChild(zone);
            wrapper.appendChild(textLabel);
            parentContainer.appendChild(wrapper);

            makeInteractive(wrapper, zone, item);
        });
        updateSelectCount();
    }

    function makeInteractive(wrapper, zone, boxConfig) {
        zone.addEventListener('mousedown', (e) => {
            if (!isEditing) return;

            if (e.target.isContentEditable) {
                e.stopPropagation();
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const isResize = e.target.classList.contains('resize-handle');
            if (boxConfig.locked && isResize) return;

            let isToggleClick = false;

            if (!isResize) {
                if (!selectedBoxIds.includes(boxConfig.id)) {
                    selectedBoxIds.push(boxConfig.id);
                    wrapper.classList.add('selected');
                    updateSelectCount();
                    renderLayout();
                } else {
                    isToggleClick = true;
                }
            }

            if (!selectedBoxIds.includes(boxConfig.id)) return;

            if (boxConfig.locked) {
                function onMouseUpLocked() {
                    window.removeEventListener('mouseup', onMouseUpLocked);
                    if (isToggleClick) {
                        selectedBoxIds = selectedBoxIds.filter(id => id !== boxConfig.id);
                        updateSelectCount();
                        renderLayout();
                    }
                }
                window.addEventListener('mouseup', onMouseUpLocked);
                return;
            }

            const activeContainer = boxConfig.isFixed ? fixedContainer : appContainer;
            const containerRect = activeContainer.getBoundingClientRect();

            const startX = e.clientX;
            const startY = e.clientY;

            const dragGroupSnapshots = [];
            selectedBoxIds.forEach(id => {
                const wrapEl = document.getElementById('wrap-' + id);
                if (wrapEl) {
                    const zoneEl = wrapEl.querySelector('.placeholder-zone');
                    const config = layoutData.find(b => b.id === id);
                    if (config) {
                        dragGroupSnapshots.push({
                            wrapper: wrapEl,
                            zone: zoneEl,
                            config: config,
                            startLeftPx: wrapEl.offsetLeft,
                            startTopPx: wrapEl.offsetTop,
                            startWidthPx: wrapEl.offsetWidth,
                            startHeightPx: zoneEl.offsetHeight
                        });
                    }
                }
            });

            let hasMoved = false;

            function onMouseMove(moveEvent) {
                if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) {
                    if (!hasMoved) {
                        saveToHistory();
                        hasMoved = true;
                    }
                }

                if (!hasMoved) return;

                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                if (isResize) {
                    const current = dragGroupSnapshots.find(s => s.config.id === boxConfig.id);
                    if (current) {
                        const newW = current.startWidthPx + deltaX;
                        const newH = current.startHeightPx + deltaY;

                        if (current.config.type === 'text') {
                            const finalW = Math.max(newW, 20);
                            current.config.width = (finalW / containerRect.width) * 100;
                            current.wrapper.style.width = current.config.width + '%';
                        } else if (current.config.type === 'link') {
                            const finalW = Math.max(newW, 20);
                            const finalH = Math.max(newH, 20);
                            current.config.width = (finalW / containerRect.width) * 100;
                            current.config.height = (finalH / containerRect.height) * 100;
                            current.wrapper.style.width = current.config.width + '%';
                            current.zone.style.height = finalH + 'px';
                        } else {
                            const side = Math.max(newW, newH);
                            const finalSide = Math.max(side, 15);
                            current.config.width = (finalSide / containerRect.width) * 100;
                            current.config.height = (finalSide / containerRect.height) * 100;
                            current.wrapper.style.width = current.config.width + '%';
                            current.zone.style.height = finalSide + 'px';
                        }
                    }
                } else {
                    dragGroupSnapshots.forEach(snap => {
                        const snapContainer = snap.config.isFixed ? fixedContainer : appContainer;
                        const snapRect = snapContainer.getBoundingClientRect();

                        const newLeftPx = snap.startLeftPx + deltaX;
                        const newTopPx = snap.startTopPx + deltaY;

                        snap.config.left = (newLeftPx / snapRect.width) * 100;
                        snap.config.top = (newTopPx / snapRect.height) * 100;

                        snap.wrapper.style.left = snap.config.left + '%';
                        snap.wrapper.style.top = snap.config.top + '%';
                    });
                }
            }

            function onMouseUp() {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                if (!hasMoved && !isResize && isToggleClick) {
                    selectedBoxIds = selectedBoxIds.filter(id => id !== boxConfig.id);
                    updateSelectCount();
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutData));
                renderLayout();
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    function updateResponsiveStyles() {
        const containerWidth = appContainer.clientWidth;
        const estimatedContainerHeight = containerWidth / 0.35;
        const scaleFactor = containerWidth / 400;

        layoutData.forEach(item => {
            const wrapper = document.getElementById('wrap-' + item.id);
            if (!wrapper) return;

            const parentContainer = item.isFixed ? fixedContainer : appContainer;
            const parentHeight = parentContainer.offsetHeight || estimatedContainerHeight;

            if (item.type === 'text') {
                const content = wrapper.querySelector('div[contenteditable]');
                if (content) content.style.fontSize = (item.size * scaleFactor) + 'px';
            } else {
                const zone = wrapper.querySelector('.placeholder-zone');
                if (zone) {
                    const actualHeightPx = (item.height / 100) * parentHeight;
                    zone.style.height = actualHeightPx + 'px';
                }
                const textLabel = wrapper.querySelector('.editable-text-label');
                if (textLabel) {
                    textLabel.style.fontSize = (item.size * scaleFactor) + 'px';
                }
            }
        });
    }

    window.addEventListener('resize', updateResponsiveStyles);
    setTimeout(renderLayout, 100);

    uploadImgBtn.addEventListener('click', () => {
        if (selectedBoxIds.length === 0) {
            alert("Pilih satu kotak menu terlebih dahulu!");
            return;
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    saveToHistory();
                    selectedBoxIds.forEach(id => {
                        const item = layoutData.find(b => b.id === id);
                        if (item) item.image = event.target.result;
                    });
                    saveAndRender();
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    });

    removeImgBtn.addEventListener('click', () => {
        if (selectedBoxIds.length === 0) return alert("Pilih kotak dulu!");
        saveToHistory();
        selectedBoxIds.forEach(id => {
            const item = layoutData.find(b => b.id === id);
            if (item) item.image = '';
        });
        saveAndRender();
    });

    lockBtn.addEventListener('click', () => {
        if (selectedBoxIds.length === 0) return alert("Pilih kotak dulu!");
        saveToHistory();
        selectedBoxIds.forEach(id => {
            const item = layoutData.find(b => b.id === id);
            if (item) item.locked = !item.locked;
        });
        saveAndRender();
    });
});
