async function j(url, opt={}) {
  const r = await fetch(url, { headers:{'Content-Type':'application/json'}, ...opt });
  return r.json();
}

let cases = [];
let selectedRun = null;

async function loadMeta() {
  const envs = await j('/api/envs/');
  const envSel = document.getElementById('env');
  envSel.innerHTML = '';
  (envs.envs || ['uat','int']).forEach(e => {
    const o = document.createElement('option');
    o.value = e; o.textContent = e;
    if (e === envs.default) o.selected = true;
    envSel.appendChild(o);
  });

  const c = await j('/api/cases/');
  cases = c.cases || [];
  const caseSel = document.getElementById('case');
  caseSel.innerHTML = '';
  cases.forEach(x => {
    const o = document.createElement('option');
    o.value = x.id; o.textContent = `${x.name} (${x.id})`;
    caseSel.appendChild(o);
  });
  renderParams();
}

function renderParams() {
  const caseId = document.getElementById('case').value;
  const c = cases.find(x => x.id === caseId);
  const wrap = document.getElementById('params');
  wrap.innerHTML = '';
  (c?.params || []).forEach(p => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<label>${p}</label><input data-param="${p}" placeholder="${p}" />`;
    wrap.appendChild(row);
  });
}

async function runCase() {
  const env = document.getElementById('env').value;
  const caseId = document.getElementById('case').value;
  const params = {};
  document.querySelectorAll('#params input').forEach(i => params[i.dataset.param] = i.value);
  await j('/api/runs/', {
    method:'POST',
    body: JSON.stringify({ env, case_id: caseId, params })
  });
  await refreshRuns();
}

async function refreshRuns() {
  const data = await j('/api/runs/');
  const tb = document.querySelector('#runsTable tbody');
  tb.innerHTML = '';
  (data.runs || []).forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.started_at || ''}</td>
      <td>${r.case_id}</td>
      <td>${r.env_name}</td>
      <td>${r.status}</td>
      <td>
        <button data-log="${r.id}">log</button>
        ${r.status === 'running' ? `<button data-stop="${r.id}">stop</button>` : ''}
      </td>
    `;
    tb.appendChild(tr);
  });

  document.querySelectorAll('button[data-log]').forEach(b => {
    b.onclick = async () => {
      selectedRun = b.dataset.log;
      const lg = await j(`/api/runs/${selectedRun}/log`);
      const sm = await j(`/api/runs/${selectedRun}/summary`);
      document.getElementById('log').textContent = lg.log || '';
      document.getElementById('summary').textContent = sm.summary ? JSON.stringify(sm.summary, null, 2) : 'No summary yet';
    };
  });
  document.querySelectorAll('button[data-stop]').forEach(b => {
    b.onclick = async () => {
      await j(`/api/runs/${b.dataset.stop}/stop`, { method:'POST' });
      await refreshRuns();
    };
  });

  if (selectedRun) {
    const lg = await j(`/api/runs/${selectedRun}/log`);
    const sm = await j(`/api/runs/${selectedRun}/summary`);
    document.getElementById('log').textContent = lg.log || '';
    document.getElementById('summary').textContent = sm.summary ? JSON.stringify(sm.summary, null, 2) : 'No summary yet';
  }
}

document.getElementById('case').addEventListener('change', renderParams);
document.getElementById('runBtn').addEventListener('click', runCase);

loadMeta();
refreshRuns();
setInterval(refreshRuns, 3000);
