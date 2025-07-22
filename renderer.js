// renderer.js

window.addEventListener('DOMContentLoaded', () => {
  // Element references
  const fileListEl      = document.getElementById('file-list');
  const printAllBtn     = document.getElementById('print-all');
  const deleteAllBtn    = document.getElementById('delete-all');
  const totalFilesEl    = document.getElementById('total-files');
  const optionsBtn      = document.getElementById('options-btn');
  const optionsMenu     = document.getElementById('options-menu');
  const previewCheckbox = document.getElementById('preview-checkbox');
  const updateCredsBtn  = document.getElementById('update-creds');
  const minimizeBtn     = document.getElementById('minimize-btn');
  const closeBtn        = document.getElementById('close-btn');
  const searchInput     = document.getElementById('search-input');
  const searchClearBtn  = document.getElementById('search-clear');
  const driveStatusEl   = document.getElementById('drive-status');

  let previewEnabled = false;
  let allFiles = [];

  // Window controls
  minimizeBtn.onclick = () => window.api.minimize();
  closeBtn.onclick    = () => window.api.close();

  // Options menu toggle
  optionsBtn.onclick = () => optionsMenu.classList.toggle('visible');

  // Preview toggle
  previewCheckbox.onchange = () => {
    previewEnabled = previewCheckbox.checked;
  };

  // Re-test Drive connection
  updateCredsBtn.onclick = async () => {
    await window.api.updateCredentials();
    testConnection();
  };

  // Test & display Drive connection status
  async function testConnection() {
    driveStatusEl.textContent = 'Checking…';
    driveStatusEl.style.color = '';
    const { connected } = await window.api.testDriveConnection();
    if (connected) {
      driveStatusEl.textContent = 'Connected';
      driveStatusEl.style.color = 'green';
    } else {
      driveStatusEl.textContent = 'Disconnected';
      driveStatusEl.style.color = 'red';
    }
  }

  // Render files into the list
  function renderFileList(files) {
    fileListEl.innerHTML = '';
    const count = Array.isArray(files) ? files.length : 0;
    totalFilesEl.textContent = count;

    if (!count) {
      fileListEl.textContent = 'No files found.';
      return;
    }

    files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.dataset.id = file.id;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = file.name;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'file-date';
      dateSpan.textContent = new Date(file.modifiedTime).toLocaleString();

      const actions = document.createElement('div');
      actions.className = 'row-actions';

      // PRINT
      const pBtn = document.createElement('button');
      pBtn.className = 'btn btn-print';
      pBtn.textContent = 'PRINT';
      pBtn.onclick = () => {
        window.api.printFile(file, previewEnabled);
      };

      // DELETE
      const dBtn = document.createElement('button');
      dBtn.className = 'btn btn-delete';
      dBtn.textContent = '🗑️';
      dBtn.onclick = () => {
        row.remove();
        window.api.deleteFile(file);
      };

      actions.append(pBtn, dBtn);
      row.append(nameSpan, dateSpan, actions);
      fileListEl.append(row);
    });
  }

  // Remove a row when notified
  function removeRowById(id) {
    const row = fileListEl.querySelector(`.file-row[data-id="${id}"]`);
    if (row) row.remove();
    totalFilesEl.textContent = fileListEl.querySelectorAll('.file-row').length;
  }

  // Substring filter helper
  function getFiltered(term) {
    if (!term) return allFiles;
    const lower = term.toLowerCase();
    return allFiles.filter(f => f.name.toLowerCase().includes(lower));
  }

  // Live search
  searchInput.addEventListener('input', e => {
    const term = e.target.value;
    renderFileList(getFiltered(term));
    searchClearBtn.classList.toggle('visible', term.length > 0);
  });
  searchClearBtn.onclick = () => {
    searchInput.value = '';
    searchClearBtn.classList.remove('visible');
    renderFileList(allFiles);
  };

  // Bulk Print
  printAllBtn.onclick = async () => {
    const subset = getFiltered(searchInput.value);
    if (subset.length) {
      await window.api.printAll(subset, previewEnabled);
    }
  };

  // Bulk Delete
  deleteAllBtn.onclick = async () => {
    const subset = getFiltered(searchInput.value);
    subset.forEach(f => removeRowById(f.id));
    if (subset.length) {
      await window.api.deleteAll(subset);
    }
  };

  // Initial load & polling
  testConnection();
  window.api.getFileList().then(files => {
    allFiles = files;
    renderFileList(files);
  });
  window.api.onFileList(files => {
    allFiles = files;
    renderFileList(getFiltered(searchInput.value));
  });
  window.api.onFileDeleted(removeRowById);
});
