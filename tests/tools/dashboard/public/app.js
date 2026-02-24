async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || 'API error');
  return data;
}

let currentStatus = null;
let selectedRunId = null;

const fmt = iso => iso ? new Date(iso).toLocaleString() : '-';
const cls = s => `status-${s || 'unknown'}`;

function latestPlaywrightRun(history) {
  return history.find(h => h.summary && (h.summary.total !== null || (h.summary.failedTests || []).length >= 0));
}

function renderSummary() {
  const box = document.getElementById('summaryBox');
  const run = latestPlaywrightRun(currentStatus.history || []);
  if (!run || !run.summary) return box.textContent = '暂无Playwright摘要';
  const s = run.summary;
  box.innerHTML = `
    <div><b>${run.label}</b> (${run.env})</div>
    <div>总计: ${s.total ?? '-'} | 通过: ${s.passed ?? '-'} | 失败: ${s.failed ?? '-'} | 跳过: ${s.skipped ?? '-'}</div>
    <div>耗时: ${s.durationMs ? Math.round(s.durationMs/1000)+'s' : '-'}</div>
  `;
}

function renderFailedList(run) {
  const el = document.getElementById('failedList');
  if (!run?.summary?.failedTests?.length) {
    el.innerHTML = '<span class="hint">该记录没有失败用例</span>';
    return;
  }
  const rows = run.summary.failedTests.map(t => `<li><code>${t.file}</code> — ${t.title} <span class="hint">[${t.project}]</span></li>`).join('');
  el.innerHTML = `<ul>${rows}</ul>`;
}

async function loadLog(id) {
  const r = await api(`/api/log?id=${encodeURIComponent(id)}`);
  selectedRunId = id;
  document.getElementById('logMeta').textContent = r.path || '';
  document.getElementById('logBox').textContent = r.content || '';
  renderFailedList(r.run);
}

async function refreshStatus() {
  currentStatus = await api('/api/status');
  document.getElementById('rootPath').textContent = `项目目录: ${currentStatus.root}`;

  const envSelect = document.getElementById('envSelect');
  envSelect.innerHTML = '';
  currentStatus.envFiles.forEach(f => {
    const e = f.replace('.env.', '');
    const opt = document.createElement('option');
    opt.value = e; opt.textContent = e; if (e === currentStatus.selectedEnv) opt.selected = true;
    envSelect.appendChild(opt);
  });

  const presets = document.getElementById('presetButtons');
  presets.innerHTML = '';
  currentStatus.presets.forEach(p => {
    const b = document.createElement('button');
    b.textContent = p.label;
    b.onclick = async () => { await api('/api/run', { method: 'POST', body: JSON.stringify({ presetId: p.id }) }); await refreshStatus(); };
    presets.appendChild(b);
  });

  const running = currentStatus.running;
  document.getElementById('runningState').innerHTML = running
    ? `<div><b>${running.label}</b> (${running.env})</div><div class="hint">${running.cmd}</div><div class="hint">${fmt(running.startedAt)}</div>`
    : '当前无任务运行';

  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';
  currentStatus.history.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmt(h.startedAt)}</td>
      <td>${h.env}</td>
      <td>${h.label}</td>
      <td class="${cls(h.status)}">${h.status}</td>
      <td>${(h.failureTags||[]).join(', ') || '-'}</td>
      <td><button data-id="${h.id}">日志</button></td>
    `;
    tr.querySelector('button').onclick = () => loadLog(h.id);
    tbody.appendChild(tr);
  });

  renderSummary();
}

async function wire() {
  document.getElementById('saveEnvBtn').onclick = async () => {
    await api('/api/env', { method: 'POST', body: JSON.stringify({ env: document.getElementById('envSelect').value }) });
    await refreshStatus();
  };

  document.getElementById('runCustomBtn').onclick = async () => {
    const cmd = document.getElementById('customCmd').value.trim();
    if (!cmd) return alert('请输入命令');
    await api('/api/run', { method: 'POST', body: JSON.stringify({ cmd, label: 'custom' }) });
    document.getElementById('customCmd').value = '';
    await refreshStatus();
  };

  document.getElementById('stopBtn').onclick = async () => {
    await api('/api/stop', { method: 'POST' });
    setTimeout(refreshStatus, 800);
  };

  document.getElementById('rerunFailedBtn').onclick = async () => {
    const run = latestPlaywrightRun(currentStatus.history || []);
    if (!run) return alert('没有可重跑记录');
    await api('/api/rerun-failed', { method: 'POST', body: JSON.stringify({ id: run.id }) });
    await refreshStatus();
  };

  document.getElementById('jenkinsTriggerBtn').onclick = async () => {
    const baseUrl = document.getElementById('jenkinsUrl').value.trim();
    const user = document.getElementById('jenkinsUser').value.trim();
    const token = document.getElementById('jenkinsToken').value.trim();
    const job = document.getElementById('jenkinsJob').value.trim();
    const paramsRaw = document.getElementById('jenkinsParams').value.trim();
    let params = {};
    if (paramsRaw) {
      try { params = JSON.parse(paramsRaw); } catch { return alert('参数JSON格式错误'); }
    }
    await api('/api/jenkins/trigger', { method: 'POST', body: JSON.stringify({ baseUrl, user, token, job, params }) });
    alert('Jenkins触发成功');
  };

  await refreshStatus();
  setInterval(async () => {
    try {
      await refreshStatus();
      if (selectedRunId) await loadLog(selectedRunId);
    } catch {}
  }, 2500);
}

wire();
