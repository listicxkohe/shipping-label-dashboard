// renderer.js
window.addEventListener('DOMContentLoaded', async () => {
  // Element refs
  const minimizeBtn      = document.getElementById('minimize-btn');
  const closeBtn         = document.getElementById('close-btn');
  const optionsBtn       = document.getElementById('options-btn');
  const optionsMenu      = document.getElementById('options-menu');
  const driveStatusEl    = document.getElementById('drive-status');
  const printSettingsBtn = document.getElementById('print-settings-btn');
  const updateCredsBtn   = document.getElementById('update-creds');

  const searchInput      = document.getElementById('search-input');
  const searchClearBtn   = document.getElementById('search-clear');
  const fileListEl       = document.getElementById('file-list');

  const deleteAllBtn     = document.getElementById('delete-all');
  const printAllBtn      = document.getElementById('print-all');
  const printSelBtn      = document.getElementById('print-selected');
  const totalFilesEl     = document.getElementById('total-files');

  const progressOverlay  = document.getElementById('progress-overlay');
  const progressText     = document.getElementById('progress-text');

  // State
  let allFiles = [];
  const selectedIds = new Set();

  // Window controls
  minimizeBtn.onclick = () => window.api.minimize();
  closeBtn.onclick    = () => window.api.close();

  // Options menu toggle
  optionsBtn.onclick  = () => optionsMenu.classList.toggle('visible');
  updateCredsBtn.onclick = async () => {
    await window.api.updateCredentials();
    await testConnection();
  };
  printSettingsBtn.onclick = () => window.api.openPrintSettings();

  // Test drive connection
  async function testConnection() {
    driveStatusEl.textContent = 'Checking…';
    try {
      const { connected } = await window.api.testDriveConnection();
      driveStatusEl.textContent = connected ? 'Connected' : 'Disconnected';
      driveStatusEl.style.color = connected ? 'green' : 'red';
    } catch {
      driveStatusEl.textContent = 'Error';
      driveStatusEl.style.color = 'red';
    }
  }

  // Render file list
  function renderFileList(files) {
    fileListEl.innerHTML = '';
    allFiles = files;
    totalFilesEl.textContent = files.length;

    if (files.length === 0) {
      fileListEl.textContent = 'No files found.';
      return;
    }

    files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.dataset.id = file.id;

      // Selection checkbox
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'select-checkbox';
      chk.checked = selectedIds.has(file.id);
      chk.onchange = () => {
        if (chk.checked) selectedIds.add(file.id);
        else selectedIds.delete(file.id);
        printSelBtn.disabled = selectedIds.size === 0;
      };

      // Name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = file.name;

      // Date
      const dateSpan = document.createElement('span');
      dateSpan.className = 'file-date';
      dateSpan.textContent = new Date(file.modifiedTime).toLocaleString();

      // Actions
      const actions = document.createElement('div');
      actions.className = 'row-actions';

      const printBtn = document.createElement('button');
      printBtn.className = 'btn btn-print';
      printBtn.textContent = 'PRINT';
      printBtn.onclick = () => window.api.printFile(file);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-delete';
      delBtn.textContent = '🗑️';
      delBtn.onclick = () => {
        row.remove();
        window.api.deleteFile(file);
      };

      actions.append(printBtn, delBtn);

      // Assemble
      row.append(chk, nameSpan, dateSpan, actions);
      fileListEl.append(row);
    });

    // Enable/disable print-selected
    printSelBtn.disabled = selectedIds.size === 0;
  }

  // Filter helper
  function getFiltered(term) {
    if (!term) return allFiles;
    term = term.toLowerCase();
    return allFiles.filter(f => f.name.toLowerCase().includes(term));
  }

  // Search logic
  searchInput.addEventListener('input', e => {
    const filtered = getFiltered(e.target.value);
    renderFileList(filtered);
    searchClearBtn.classList.toggle('visible', !!e.target.value);
  });
  searchClearBtn.onclick = () => {
    searchInput.value = '';
    searchClearBtn.classList.remove('visible');
    renderFileList(allFiles);
  };

  // Delete all
  deleteAllBtn.onclick = async () => {
    const subset = getFiltered(searchInput.value);
    subset.forEach(f => {
      const r = fileListEl.querySelector(`.file-row[data-id="${f.id}"]`);
      if (r) r.remove();
    });
    await window.api.deleteAll(subset);
  };

  // Print all w/ progress
  printAllBtn.onclick = () => {
    const subset = getFiltered(searchInput.value);
    progressOverlay.classList.remove('hidden');
    progressText.textContent = `Printing 0 of ${subset.length}…`;
    window.api.printAll(subset);
  };

  // Print selected w/ progress
  printSelBtn.onclick = () => {
    const subset = allFiles.filter(f => selectedIds.has(f.id));
    progressOverlay.classList.remove('hidden');
    progressText.textContent = `Printing 0 of ${subset.length}…`;
    window.api.printSelected(subset);
  };

  // Initial load & subscriptions
  await testConnection();
  window.api.getFileList().then(renderFileList);
  window.api.onFileList(renderFileList);

  window.api.onPrintProgress(({ completed, total }) => {
    progressText.textContent = `Printing ${completed} of ${total}…`;
    if (completed === total) {
      setTimeout(() => progressOverlay.classList.add('hidden'), 500);
    }
  });

  window.api.onFileDeleted(id => {
    const r = fileListEl.querySelector(`.file-row[data-id="${id}"]`);
    if (r) r.remove();
    totalFilesEl.textContent = fileListEl.querySelectorAll('.file-row').length;
  });
});
