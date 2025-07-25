// renderer.js
window.addEventListener('DOMContentLoaded', async () => {
  // Title-bar & options
  const minimizeBtn     = document.getElementById('minimize-btn');
  const closeBtn        = document.getElementById('close-btn');
  const optionsBtn      = document.getElementById('options-btn');
  const refreshBtn      = document.getElementById('refresh-btn');
  const optionsMenu     = document.getElementById('options-menu');
  const driveStatusEl   = document.getElementById('drive-status');
  const previewCheckbox = document.getElementById('preview-checkbox');
  const updateCredsBtn  = document.getElementById('update-creds');

  // Main UI
  const searchInput     = document.getElementById('search-input');
  const searchClearBtn  = document.getElementById('search-clear');
  const fileListEl      = document.getElementById('file-list');
  const deleteAllBtn    = document.getElementById('delete-all');
  const printAllBtn     = document.getElementById('print-all');
  const printSelBtn     = document.getElementById('print-selected');
  const totalFilesEl    = document.getElementById('total-files');

  // Progress overlay
  const progressOverlay = document.getElementById('progress-overlay');
  const progressText    = document.getElementById('progress-text');
  const cancelProgress  = document.getElementById('cancel-progress');

  // State
  let allFiles = [];
  const selectedIds = new Set();

  // Window controls
  minimizeBtn.onclick = () => window.api.minimize();
  closeBtn.onclick    = () => window.api.close();

  // Options menu toggle
  optionsBtn.onclick  = () => optionsMenu.classList.toggle('visible');

  // Manual refresh
  refreshBtn.onclick  = async () => {
    const files = await window.api.refreshFiles();
    renderFileList(files);
  };

  // Update Credentials
  updateCredsBtn.onclick = async () => {
    await window.api.updateCredentials();
    await testConnection();
  };

  // Preview toggle persists
  previewCheckbox.onchange = async () => {
    await window.api.savePrintSettings({ preview: previewCheckbox.checked });
  };

  // Cancel printing
  cancelProgress.onclick = () => {
    window.api.cancelPrint();
    progressOverlay.classList.add('hidden');
  };

  // Test drive connection status
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

  // Render file list into the UI
  function renderFileList(files) {
    fileListEl.innerHTML = '';
    allFiles = files;
    totalFilesEl.textContent = files.length;

    if (!files.length) {
      fileListEl.textContent = 'No files found.';
      return;
    }

    files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.dataset.id = file.id;

      // Checkbox
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'select-checkbox';
      chk.checked = selectedIds.has(file.id);
      chk.onchange = () => {
        if (chk.checked) selectedIds.add(file.id);
        else selectedIds.delete(file.id);
        printSelBtn.disabled = selectedIds.size === 0;
      };

      // Name & date
      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = file.name;

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

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-delete';
      deleteBtn.textContent = '🗑️';
      deleteBtn.onclick = () => {
        row.remove();
        window.api.deleteFile(file);
      };

      actions.append(printBtn, deleteBtn);
      row.append(chk, nameSpan, dateSpan, actions);
      fileListEl.append(row);
    });

    printSelBtn.disabled = selectedIds.size === 0;
  }

  // Helper to filter by search term
  function getFiltered(term) {
    if (!term) return allFiles;
    term = term.toLowerCase();
    return allFiles.filter(f => f.name.toLowerCase().includes(term));
  }

  // Search input
  searchInput.addEventListener('input', e => {
    renderFileList(getFiltered(e.target.value));
    searchClearBtn.classList.toggle('visible', !!e.target.value);
  });
  searchClearBtn.onclick = () => {
    searchInput.value = '';
    searchClearBtn.classList.remove('visible');
    renderFileList(allFiles);
  };

  // Delete all in view
  deleteAllBtn.onclick = async () => {
    const subset = getFiltered(searchInput.value);
    subset.forEach(f => {
      const row = fileListEl.querySelector(`.file-row[data-id="${f.id}"]`);
      if (row) row.remove();
    });
    await window.api.deleteAll(subset);
  };

  // Print all
  printAllBtn.onclick = () => {
    const subset = getFiltered(searchInput.value);
    progressOverlay.classList.remove('hidden');
    progressText.textContent = `Printing 0 of ${subset.length}…`;
    window.api.printAll(subset);
  };

  // Print selected
  printSelBtn.onclick = () => {
    const subset = allFiles.filter(f => selectedIds.has(f.id));
    progressOverlay.classList.remove('hidden');
    progressText.textContent = `Printing 0 of ${subset.length}…`;
    window.api.printSelected(subset);
  };

  // Initial load & subscriptions
  await testConnection();

  // Load preview checkbox state
  const s = await window.api.getPrintSettings();
  previewCheckbox.checked = s.preview;

  // Populate list
  window.api.getFileList().then(renderFileList);
  window.api.onFileList(renderFileList);

  // Progress updates
  window.api.onPrintProgress(({ completed, total }) => {
    progressText.textContent = `Printing ${completed} of ${total}…`;
    if (completed === total) {
      setTimeout(() => progressOverlay.classList.add('hidden'), 500);
    }
  });

  // After cancellation or completion
  window.api.onPrintCancelled(() => {
    progressOverlay.classList.add('hidden');
  });

  // When a file is deleted
  window.api.onFileDeleted(id => {
    const row = fileListEl.querySelector(`.file-row[data-id="${id}"]`);
    if (row) row.remove();
    totalFilesEl.textContent = fileListEl.querySelectorAll('.file-row').length;
  });
});
