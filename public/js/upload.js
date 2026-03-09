/* ═══════════════════════════════════════════════════
   UPLOAD.JS  —  PIN-gated upload; photos merge
   seamlessly into the existing season grid
═══════════════════════════════════════════════════ */
window.UploadManager = (function () {

  let verifiedPin  = null;
  let activeSeason = null;
  let pendingFiles = [];

  const SEASON_META = {
    spring:  { label:'Spring Whispers',  emoji:'🌸', badge:'rgba(255,198,221,.45)' },
    summer:  { label:'Summer Radiance',  emoji:'☀️', badge:'rgba(255,230,102,.45)' },
    monsoon: { label:'Monsoon Romance',  emoji:'🌧️', badge:'rgba(189,224,254,.55)' },
    autumn:  { label:'Autumn Grace',     emoji:'🍂', badge:'rgba(255,179,71,.40)' },
    winter:  { label:'Winter Glow',      emoji:'❄️', badge:'rgba(162,210,255,.45)' },
    golden:  { label:'Golden Hour',      emoji:'✨', badge:'rgba(205,186,219,.45)' },
  };

  let pinModal, pinInput, pinError, pinSubmit, pinBadge;
  let uploadModal, dropZone, fileInput, previewQueue, uploadGoBtn;
  let toast, toastTimer;

  /* ── Init ── */
  function init() {
    injectHTML();
    pinModal    = document.getElementById('pinModal');
    pinInput    = document.getElementById('pinInput');
    pinError    = document.getElementById('pinError');
    pinSubmit   = document.getElementById('pinSubmit');
    pinBadge    = document.getElementById('pinBadge');
    uploadModal = document.getElementById('uploadModal');
    dropZone    = document.getElementById('dropZone');
    fileInput   = document.getElementById('fileInput');
    previewQueue= document.getElementById('previewQueue');
    uploadGoBtn = document.getElementById('uploadGo');
    toast       = document.getElementById('toast');
    bindEvents();
  }

  function injectHTML() {
    var div = document.createElement('div');
    div.innerHTML =
      '<div id="pinModal">' +
        '<div class="pin-box">' +
          '<button class="pin-close" id="pinCloseBtn">&#x2715;</button>' +
          '<span class="pin-icon">&#x1F510;</span>' +
          '<h3 class="pin-title">Enter Upload PIN</h3>' +
          '<p class="pin-sub">Only authorised users can add photos to her universe.</p>' +
          '<div id="pinBadge" class="pin-season-badge">Season</div>' +
          '<input id="pinInput" class="pin-input" type="password" maxlength="30" placeholder="&#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022;" autocomplete="off">' +
          '<p id="pinError" class="pin-error"></p>' +
          '<button id="pinSubmit" class="pin-submit ripR">Verify PIN &#x2192;</button>' +
        '</div>' +
      '</div>' +
      '<div id="uploadModal">' +
        '<div class="upload-box">' +
          '<div class="upload-box-hdr">' +
            '<div class="upload-box-title"><span id="uSeasonLabel">Season</span>Add Photos</div>' +
            '<button class="uclose" id="uploadCloseBtn">&#x2715;</button>' +
          '</div>' +
          '<div id="dropZone" class="drop-zone">' +
            '<input id="fileInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" multiple>' +
            '<span class="drop-icon">&#x1F4F7;</span>' +
            '<p class="drop-label">Drop photos here</p>' +
            '<p class="drop-sub">JPEG · PNG · WEBP · GIF · max 15MB each</p>' +
            '<div class="drop-or">or</div>' +
            '<button class="browse-btn ripR" id="browseBtn">Browse Files</button>' +
          '</div>' +
          '<div id="previewQueue" class="preview-queue"></div>' +
          '<div class="upload-actions" id="uploadActions" style="display:none">' +
            '<button class="upload-clear ripR" id="clearBtn">Clear</button>' +
            '<button id="uploadGo" class="upload-go ripR">Upload Photos &#x2728;</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="toast"></div>';
    document.body.appendChild(div);
  }

  function bindEvents() {
    document.getElementById('pinCloseBtn').addEventListener('click', closePinModal);
    document.getElementById('uploadCloseBtn').addEventListener('click', closeUploadModal);
    document.getElementById('browseBtn').addEventListener('click', function() { fileInput.click(); });
    document.getElementById('clearBtn').addEventListener('click', clearQueue);

    pinSubmit.addEventListener('click', submitPin);
    pinInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitPin(); });

    uploadGoBtn.addEventListener('click', doUpload);

    fileInput.addEventListener('change', function() { addFiles(Array.from(fileInput.files)); });

    dropZone.addEventListener('dragover',  function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function()  { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop',      function(e) {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      addFiles(Array.from(e.dataTransfer.files));
    });

    pinModal.addEventListener('click',    function(e) { if (e.target === pinModal)    closePinModal(); });
    uploadModal.addEventListener('click', function(e) { if (e.target === uploadModal) closeUploadModal(); });
  }

  /* ── Open flow ── */
  function openForSeason(season) {
    activeSeason = season;
    var meta = SEASON_META[season] || {};
    if (verifiedPin) {
      openUploadModal();
    } else {
      pinBadge.textContent = (meta.emoji || '') + '  ' + (meta.label || season);
      pinBadge.style.background = meta.badge || 'rgba(205,186,219,.4)';
      pinError.textContent = '';
      pinInput.value = '';
      pinInput.classList.remove('error');
      pinModal.classList.add('open');
      setTimeout(function() { pinInput.focus(); }, 200);
    }
  }

  /* ── PIN ── */
  async function submitPin() {
    var pin = pinInput.value.trim();
    if (!pin) { shakeInput(); return; }
    pinSubmit.disabled = true;
    pinSubmit.textContent = 'Checking\u2026';
    pinError.textContent  = '';
    try {
      var res  = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
      });
      var data = await res.json();
      if (data.valid) {
        verifiedPin = pin;
        closePinModal();
        openUploadModal();
      } else {
        pinError.textContent = 'Wrong PIN. Try again.';
        shakeInput();
      }
    } catch(e) {
      pinError.textContent = 'Network error. Try again.';
    }
    pinSubmit.disabled = false;
    pinSubmit.textContent = 'Verify PIN \u2192';
  }

  function shakeInput() {
    pinInput.classList.remove('error');
    void pinInput.offsetWidth;
    pinInput.classList.add('error');
    setTimeout(function() { pinInput.classList.remove('error'); }, 600);
  }

  function closePinModal()    { pinModal.classList.remove('open'); }

  function openUploadModal() {
    var meta = SEASON_META[activeSeason] || {};
    document.getElementById('uSeasonLabel').textContent = (meta.emoji || '') + ' ' + (meta.label || activeSeason) + ' \u2014 ';
    pendingFiles = [];
    previewQueue.innerHTML = '';
    document.getElementById('uploadActions').style.display = 'none';
    fileInput.value = '';
    uploadModal.classList.add('open');
  }

  function closeUploadModal() {
    uploadModal.classList.remove('open');
    pendingFiles = [];
    previewQueue.innerHTML = '';
    document.getElementById('uploadActions').style.display = 'none';
  }

  /* ── File queue ── */
  function addFiles(files) {
    var images = files.filter(function(f) { return /^image\/(jpeg|jpg|png|webp|gif)$/i.test(f.type); });
    if (images.length < files.length) showToast('Only image files accepted', 'info');
    images.forEach(function(file) {
      if (pendingFiles.find(function(f) { return f.name===file.name && f.size===file.size; })) return;
      pendingFiles.push(file);
      renderPreviewItem(file);
    });
    document.getElementById('uploadActions').style.display = pendingFiles.length ? 'flex' : 'none';
  }

  function renderPreviewItem(file) {
    var item = document.createElement('div');
    item.className = 'preview-item';
    item.id = 'prev-' + safeId(file);
    item.innerHTML =
      '<img class="preview-thumb" src="" alt="">' +
      '<div class="preview-info">' +
        '<div class="preview-name">' + esc(file.name) + '</div>' +
        '<div class="preview-size">' + fmtSize(file.size) + '</div>' +
        '<div class="preview-bar-wrap"><div class="preview-bar"></div></div>' +
      '</div>' +
      '<span class="preview-status">\u23F3</span>';
    var reader = new FileReader();
    reader.onload = function(e) { item.querySelector('.preview-thumb').src = e.target.result; };
    reader.readAsDataURL(file);
    previewQueue.appendChild(item);
  }

  /* ── Upload ── */
  async function doUpload() {
    if (!pendingFiles.length) return;
    uploadGoBtn.disabled = true;
    uploadGoBtn.textContent = 'Uploading\u2026';

    var success = 0, failed = 0;
    var uploadedPhotos = [];

    for (var i = 0; i < pendingFiles.length; i += 5) {
      var batch = pendingFiles.slice(i, i + 5);
      var fd = new FormData();
      batch.forEach(function(f) { fd.append('photos', f); });
      batch.forEach(function(f) { setStatus(f, 'uploading', null); });

      try {
        var res = await xhrUpload('/api/upload/' + activeSeason, fd, batch,
          function(pct) { batch.forEach(function(f) { setProgress(f, pct); }); }
        );
        if (res.success) {
          success += res.uploaded.length;
          batch.forEach(function(f) { setStatus(f, 'done', '\u2705'); });
          uploadedPhotos = uploadedPhotos.concat(res.uploaded);
        } else {
          failed += batch.length;
          batch.forEach(function(f) { setStatus(f, 'fail', '\u274C'); });
          if (res.error) showToast(res.error, 'error');
        }
      } catch(e) {
        failed += batch.length;
        batch.forEach(function(f) { setStatus(f, 'fail', '\u274C'); });
      }
    }

    if (success > 0) {
      showToast(success + ' photo' + (success > 1 ? 's' : '') + ' added! \uD83C\uDF89', 'success');
      /* Seamlessly merge new photos into the open season grid */
      if (window._refreshSeasonGrid) {
        window._refreshSeasonGrid();
      }
      /* Update the dynamic photo count everywhere on the page */
      if (window.HU && window.HU.refreshPhotoCount) {
        window.HU.refreshPhotoCount();
      }
    }
    if (failed > 0) showToast(failed + ' file' + (failed > 1 ? 's' : '') + ' failed', 'error');

    uploadGoBtn.disabled = false;
    uploadGoBtn.textContent = 'Upload Photos \u2728';
    pendingFiles = [];
    document.getElementById('uploadActions').style.display = 'none';
  }

  function xhrUpload(url, fd, files, onProgress) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('x-upload-pin', verifiedPin);
      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      });
      xhr.addEventListener('load', function() {
        try { resolve(JSON.parse(xhr.responseText)); } catch(e) { reject(e); }
      });
      xhr.addEventListener('error', function() { reject(new Error('Network error')); });
      xhr.send(fd);
    });
  }

  function setProgress(file, pct) {
    var item = document.getElementById('prev-' + safeId(file));
    if (item) item.querySelector('.preview-bar').style.width = pct + '%';
  }
  function setStatus(file, state, icon) {
    var item = document.getElementById('prev-' + safeId(file));
    if (!item) return;
    item.classList.toggle('done', state === 'done');
    item.classList.toggle('fail', state === 'fail');
    if (icon) item.querySelector('.preview-status').textContent = icon;
    if (state === 'done') item.querySelector('.preview-bar').style.width = '100%';
  }
  function clearQueue() {
    pendingFiles = [];
    previewQueue.innerHTML = '';
    fileInput.value = '';
    document.getElementById('uploadActions').style.display = 'none';
  }

  /* loadUserPhotos is kept as a no-op so gallery.js calling it doesn't break */
  function loadUserPhotos() {}

  /* ── Toast ── */
  function showToast(msg, type) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className   = '';
    void toast.offsetWidth;
    toast.classList.add('show', type || 'info');
    toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3200);
  }

  /* ── Helpers ── */
  function safeId(f) { return (f.name + f.size).replace(/[^a-zA-Z0-9]/g,'_'); }
  function esc(s)    { return String(s).replace(/[&<>"']/g, function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);}); }
  function fmtSize(b){ return b < 1048576 ? Math.round(b/1024)+'KB' : (b/1048576).toFixed(1)+'MB'; }

  return { init, openForSeason, closePinModal, closeUploadModal, clearQueue, loadUserPhotos, showToast, getPin: function() { return verifiedPin; } };
})();

document.addEventListener('DOMContentLoaded', function() { UploadManager.init(); });
