// printSettings.js
window.addEventListener('DOMContentLoaded', async () => {
  const fitSel     = document.getElementById('fit-select');
  const orientSel  = document.getElementById('orientation-select');
  const paperSel   = document.getElementById('paper-size-select');
  const copiesIn   = document.getElementById('copies-input');
  const duplexSel  = document.getElementById('duplex-select');
  const printerSel = document.getElementById('printer-select');
  const previewCb  = document.getElementById('preview-checkbox-ps');
  const saveBtn    = document.getElementById('save-btn');
  const cancelBtn  = document.getElementById('cancel-btn');

  // 1) Populate printer list
  const printers = await window.api.getPrinters();
  printerSel.innerHTML = '<option value="auto">Auto</option>';
  printers.forEach(p => {
    const o = document.createElement('option');
    o.value = p.name; o.textContent = p.name;
    printerSel.appendChild(o);
  });

  // 2) Load & reflect current settings
  const s = await window.api.getPrintSettings();
  fitSel.value       = s.fit        || 'auto';
  orientSel.value    = s.orientation|| 'auto';
  paperSel.value     = s.paperSize  || 'auto';
  copiesIn.value     = s.copies !== 'auto' ? s.copies : '';
  duplexSel.value    = s.duplex     || 'auto';
  previewCb.checked  = s.preview;
  if (s.printer) printerSel.value = s.printer;

  // 3) Save & close
  saveBtn.onclick = async () => {
    const newSettings = {
      fit:         fitSel.value,
      orientation: orientSel.value,
      paperSize:   paperSel.value,
      copies:      copiesIn.value ? Number(copiesIn.value) : 'auto',
      duplex:      duplexSel.value,
      printer:     printerSel.value !== 'auto' ? printerSel.value : null,
      preview:     previewCb.checked
    };
    await window.api.savePrintSettings(newSettings);
    window.close();
  };

  // 4) Cancel
  cancelBtn.onclick = () => window.close();
});
