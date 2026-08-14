const sample = `Weekly launch review. Alex said the landing page copy is approved and the team will keep the current pricing. Maya will finish the checkout QA by Friday. Jordan needs to send the final product screenshots before Thursday. We agreed to launch next Tuesday if checkout QA passes. Risk: the payment provider sandbox is still returning intermittent errors. Maya said she will open a support ticket today. Alex wants the client update sent after QA is complete.`;

const els = {
  title: document.getElementById('meetingTitle'),
  source: document.getElementById('sourceText'),
  sampleBtn: document.getElementById('sampleBtn'),
  processBtn: document.getElementById('processBtn'),
  resetBtn: document.getElementById('resetBtn'),
  notice: document.getElementById('notice'),
  empty: document.getElementById('emptyState'),
  results: document.getElementById('results'),
  summary: document.getElementById('summary'),
  decisions: document.getElementById('decisions'),
  risks: document.getElementById('risks'),
  actionRows: document.getElementById('actionRows'),
  followUp: document.getElementById('followUp'),
  reviewBadge: document.getElementById('reviewBadge'),
  approvalState: document.getElementById('approvalState'),
  approveBtn: document.getElementById('approveBtn'),
  exportBtn: document.getElementById('exportBtn'),
  auditLog: document.getElementById('auditLog'),
};

let packageState = null;

function sentences(text) {
  return text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
}

function extractOwner(sentence) {
  const explicit = sentence.match(/^([A-Z][a-z]+)\s+(?:will|needs to|said (?:he|she|they) will|wants to|is going to)\s+/);
  if (explicit) return { value: explicit[1], confidence: 'explicit' };
  const name = sentence.match(/\b([A-Z][a-z]+)\b/);
  return name ? { value: name[1], confidence: 'inferred' } : { value: 'Unassigned', confidence: 'inferred' };
}

function extractDue(sentence) {
  const patterns = [
    /\b(today|tomorrow|tonight)\b/i,
    /\b(?:by|before|on)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
    /\bnext\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
    /\b(?:by|before|on)\s+([A-Z][a-z]+\s+\d{1,2})\b/,
  ];
  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) return { value: match[0].replace(/^(by|before|on)\s+/i, ''), confidence: 'explicit' };
  }
  return { value: 'Not stated', confidence: 'inferred' };
}

function cleanTask(sentence) {
  return sentence
    .replace(/^([A-Z][a-z]+)\s+(will|needs to|said (?:he|she|they) will|wants to|is going to)\s+/i, '')
    .replace(/\b(today|tomorrow|tonight|by|before|on|next)\b.*$/i, '')
    .replace(/[.]+$/, '')
    .trim();
}

function buildPackage(text, title) {
  const lines = sentences(text);
  const decisionTerms = /\b(agreed|approved|decided|will keep|go with|selected|launch|proceed|confirmed)\b/i;
  const riskTerms = /\b(risk|blocker|blocked|issue|error|delay|problem|concern|intermittent|waiting on)\b/i;
  const actionTerms = /\b(will|needs to|must|should|follow up|send|finish|complete|open|prepare|review|deliver|update)\b/i;

  const decisions = lines.filter((line) => decisionTerms.test(line)).slice(0, 5);
  const risks = lines.filter((line) => riskTerms.test(line)).slice(0, 5);
  const actions = lines.filter((line) => actionTerms.test(line) && !/^we agreed/i.test(line)).slice(0, 8).map((line, index) => {
    const owner = extractOwner(line);
    const due = extractDue(line);
    return {
      id: `ACT-${String(index + 1).padStart(2, '0')}`,
      task: cleanTask(line) || line,
      owner,
      due,
      source: line,
    };
  });

  const key = lines.slice(0, 3).join(' ');
  const summary = key.length > 360 ? `${key.slice(0, 357)}...` : key;
  const titleText = title || 'Meeting';
  const followUp = `${titleText} follow-up: ${decisions.length ? `Key decisions: ${decisions.map(d => d.replace(/[.]+$/, '')).join('; ')}. ` : ''}${actions.length ? `Next actions are assigned across ${new Set(actions.map(a => a.owner.value)).size} owner(s). ` : ''}${risks.length ? `Open risk to watch: ${risks[0].replace(/[.]+$/, '')}.` : 'No explicit blockers were detected.'}`;

  return {
    id: `PKG-${Date.now().toString(36).toUpperCase()}`,
    title: titleText,
    createdAt: new Date().toISOString(),
    summary: summary || 'No summary available.',
    decisions,
    risks,
    actions,
    followUp,
    approved: false,
    audit: [
      'Source captured without modifying the original text.',
      `Extracted ${decisions.length} decision signal(s), ${actions.length} action item(s), and ${risks.length} risk signal(s).`,
      'Explicit and inferred assignment fields labeled separately.',
      'Package held behind human approval gate before export.',
    ],
  };
}

function renderList(el, items, emptyMessage) {
  el.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = emptyMessage;
    el.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
}

function renderPackage(pkg) {
  els.empty.hidden = true;
  els.results.hidden = false;
  els.summary.textContent = pkg.summary;
  renderList(els.decisions, pkg.decisions, 'No explicit decision language detected.');
  renderList(els.risks, pkg.risks, 'No explicit risk or blocker language detected.');
  els.actionRows.innerHTML = pkg.actions.length ? pkg.actions.map((action) => `
    <tr>
      <td><strong>${escapeHtml(action.task)}</strong><br><small>${action.id}</small></td>
      <td>${escapeHtml(action.owner.value)} <span class="confidence ${action.owner.confidence}">${action.owner.confidence}</span></td>
      <td>${escapeHtml(action.due.value)} <span class="confidence ${action.due.confidence}">${action.due.confidence}</span></td>
      <td>${action.owner.confidence === 'explicit' && action.due.confidence === 'explicit' ? 'High' : 'Review'}</td>
    </tr>
  `).join('') : '<tr><td colspan="4">No action language detected.</td></tr>';
  els.followUp.textContent = pkg.followUp;
  els.auditLog.innerHTML = pkg.audit.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  updateApproval(pkg);
}

function updateApproval(pkg) {
  els.reviewBadge.textContent = pkg.approved ? 'Approved' : 'Review required';
  els.reviewBadge.className = `badge ${pkg.approved ? 'success' : 'warning'}`;
  els.approvalState.textContent = pkg.approved ? 'Approved for export' : 'Needs approval';
  els.approveBtn.disabled = pkg.approved;
  els.approveBtn.textContent = pkg.approved ? 'Package approved' : 'Approve package';
  els.exportBtn.disabled = !pkg.approved;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

els.sampleBtn.addEventListener('click', () => {
  els.title.value = 'Weekly launch review';
  els.source.value = sample;
  els.notice.textContent = 'Sample loaded. Process it or edit the notes first.';
});

els.processBtn.addEventListener('click', () => {
  const text = els.source.value.trim();
  if (text.length < 30) {
    els.notice.textContent = 'Add a little more meeting detail before processing.';
    return;
  }
  packageState = buildPackage(text, els.title.value.trim());
  renderPackage(packageState);
  els.notice.textContent = `Decision package ${packageState.id} created and held for review.`;
});

els.approveBtn.addEventListener('click', () => {
  if (!packageState || packageState.approved) return;
  packageState.approved = true;
  packageState.approvedAt = new Date().toISOString();
  packageState.audit.push('Human approval recorded. Structured export unlocked.');
  renderPackage(packageState);
  els.notice.textContent = 'Package approved. JSON export is now available.';
});

els.exportBtn.addEventListener('click', () => {
  if (!packageState?.approved) return;
  const blob = new Blob([JSON.stringify(packageState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${packageState.id.toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  packageState.audit.push('Approved structured package exported as JSON.');
  renderPackage(packageState);
});

els.resetBtn.addEventListener('click', () => {
  packageState = null;
  els.title.value = '';
  els.source.value = '';
  els.notice.textContent = 'Demo reset.';
  els.results.hidden = true;
  els.empty.hidden = false;
  els.reviewBadge.textContent = 'Waiting';
  els.reviewBadge.className = 'badge muted';
});
