const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DASHBOARD_DIR = __dirname;
const PUBLIC_DIR = path.join(DASHBOARD_DIR, 'public');
// Keep dashboard logs OUTSIDE playwright test-results (playwright may wipe test-results on run)
const LOG_DIR = path.join(ROOT, 'tools', 'dashboard', 'logs');
const PORT = process.env.DASHBOARD_PORT ? Number(process.env.DASHBOARD_PORT) : 5077;
const STATE_FILE = path.join(DASHBOARD_DIR, 'state.json');
const PLAYWRIGHT_JSON = path.join(ROOT, 'test-results', 'results.json');
const BOOT_MARKER = new Date().toISOString();

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const presets = [
  { id: 'env-check', label: '环境检查', cmd: 'npm run env:check' },
  { id: 'db-check', label: 'DB检查', cmd: 'npm run db:check' },
  { id: 'smoke', label: 'Smoke测试', cmd: 'npm run test:smoke' },
  { id: 'rf-smoke', label: 'RF Smoke', cmd: 'npx playwright test tests/smoke/rf-login.spec.ts --project=smoke' },
  { id: 'web-smoke', label: 'Web Smoke', cmd: 'npx playwright test tests/smoke/web-login.spec.ts --project=smoke' },
  { id: 'api-smoke', label: 'API Smoke', cmd: 'npx playwright test tests/smoke/api-login.spec.ts --project=smoke' },
  { id: 'so', label: 'SO流程', cmd: 'npm run test:so' },
  { id: 'po', label: 'PO流程', cmd: 'npm run test:po' },
  { id: 'wo', label: 'WO流程', cmd: 'npm run test:wo' },
  { id: 'inv', label: '库存流程', cmd: 'npm run test:inv' },
  { id: 'report', label: '打开报告', cmd: 'npm run report' },
  { id: 'data-seed', label: '生成测试数据', cmd: 'npm run data:seed' },
  { id: 'data-clean', label: '清理测试数据', cmd: 'npm run data:cleanup' },
];

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    const init = { selectedEnv: 'uat', running: null, history: [], maxHistory: 80 };
    fs.writeFileSync(STATE_FILE, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), 'utf-8'); }
function nowId() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function getEnvFiles() { return fs.readdirSync(ROOT).filter(f => f.startsWith('.env.')); }
function ensureHistoryLimit(state) { while (state.history.length > (state.maxHistory || 80)) state.history.pop(); }

function reconcileStaleRunning(state) {
  if (!state.running) return false;
  const started = Date.parse(state.running.startedAt || '');
  const ageMs = Number.isFinite(started) ? (Date.now() - started) : Number.MAX_SAFE_INTEGER;
  const staleByAge = ageMs > (24 * 60 * 60 * 1000); // >24h definitely stale

  // After process restart, in-memory currentProcess is empty; if state says running, mark as interrupted.
  state.running.status = 'failed';
  state.running.endedAt = new Date().toISOString();
  state.running.exitCode = -999;
  state.running.failureTags = Array.from(new Set([...(state.running.failureTags || []), 'interrupted', staleByAge ? 'stale' : 'restarted']));

  const idx = state.history.findIndex(h => h.id === state.running.id);
  if (idx >= 0) state.history[idx] = state.running;
  state.running = null;
  return true;
}

function classifyFailure(logText) {
  if (!logText) return [];
  const rules = [
    { tag: 'selector', re: /(Timeout.*locator|waiting for selector|strict mode violation|toBeVisible.*timed out)/i },
    { tag: 'auth', re: /(401|403|unauthorized|login failed|radius|User_Not_Belong)/i },
    { tag: 'api', re: /(5\d\d|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|certificate)/i },
    { tag: 'db', re: /(ORA-\d+|database|connection.*oracle|listener|tns)/i },
    { tag: 'env', re: /(TEST_ENV|\.env\.|missing env|undefined)/i },
  ];
  return rules.filter(r => r.re.test(logText)).map(r => r.tag);
}

function extractFailedFromPlaywrightJson(filePath) {
  if (!fs.existsSync(filePath)) return { total: null, passed: null, failed: null, skipped: null, durationMs: null, failedTests: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const failedTests = [];

    function walkSuite(suite) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          const tests = spec.tests || [];
          for (const t of tests) {
            const results = t.results || [];
            const bad = results.find(r => ['failed', 'timedOut', 'interrupted'].includes(r.status));
            if (bad) {
              failedTests.push({
                file: spec.file || '',
                title: spec.title || '',
                fullTitle: Array.isArray(spec.titlePath) ? spec.titlePath.join(' › ') : (spec.title || ''),
                project: t.projectName || '',
                status: bad.status,
                retry: bad.retry || 0,
              });
            }
          }
        }
      }
      for (const child of suite.suites || []) walkSuite(child);
    }

    for (const s of raw.suites || []) walkSuite(s);
    const stats = raw.stats || {};
    return {
      total: stats.expected ?? null,
      passed: stats.expected ? stats.expected - (stats.unexpected || 0) : null,
      failed: stats.unexpected ?? failedTests.length,
      skipped: stats.skipped ?? null,
      durationMs: stats.duration ?? null,
      failedTests,
    };
  } catch {
    return { total: null, passed: null, failed: null, skipped: null, durationMs: null, failedTests: [] };
  }
}

let state = readState();
let currentProcess = null;
let currentRunTimer = null;
let currentLogTicker = null;

// Startup reconciliation: clear stale "running" state left from previous process/crash/reboot
if (reconcileStaleRunning(state)) {
  state.meta = { ...(state.meta || {}), lastReconciledAt: BOOT_MARKER };
  saveState(state);
}

function finalizeRun(runId, code) {
  const idx = state.history.findIndex(h => h.id === runId);
  if (idx < 0) return;

  const h = state.history[idx];
  h.endedAt = new Date().toISOString();
  h.exitCode = code;
  h.status = code === 0 ? 'passed' : 'failed';

  if (h.cmd.includes('playwright')) {
    h.summary = extractFailedFromPlaywrightJson(PLAYWRIGHT_JSON);
  }

  const logText = fs.existsSync(h.logFile) ? fs.readFileSync(h.logFile, 'utf-8') : '';
  h.failureTags = code === 0 ? [] : classifyFailure(logText);

  state.running = null;
  saveState(state);
}

function runCommand({ cmd, label, envName }) {
  if (currentProcess) throw new Error('已有任务在运行，请先停止或等待完成');
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

  const safeLabel = String(label || 'task')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'task';

  const runId = nowId();
  const logFile = path.join(LOG_DIR, `${runId}-${safeLabel}.log`);

  const entry = {
    id: runId,
    label,
    cmd,
    env: envName,
    startedAt: new Date().toISOString(),
    endedAt: null,
    exitCode: null,
    status: 'running',
    failureTags: [],
    summary: null,
    logFile,
  };

  state.running = entry;
  state.history.unshift(entry);
  ensureHistoryLimit(state);
  saveState(state);

  // Pre-create log synchronously to guarantee readable content immediately
  fs.writeFileSync(logFile, `=== ${label} ===\nStarted: ${entry.startedAt}\nEnv: ${envName}\nCmd: ${cmd}\n\n`, { encoding: 'utf-8' });
  const out = fs.createWriteStream(logFile, { flags: 'a' });
  out.on('error', (err) => {
    console.error('[dashboard-log-write-error]', err.message);
  });

  const child = spawn('cmd.exe', ['/c', cmd], {
    cwd: ROOT,
    env: { ...process.env, TEST_ENV: envName, FORCE_COLOR: '0' },
    windowsHide: true,
  });
  currentProcess = child;

  // Safety timeout: default 20 min, smoke 12 min, dashboard start 2 min
  let timeoutMs = 20 * 60 * 1000;
  if (/test:smoke/i.test(cmd)) timeoutMs = 12 * 60 * 1000;
  if (/dashboard:daemon:start/i.test(cmd)) timeoutMs = 2 * 60 * 1000;

  currentRunTimer = setTimeout(() => {
    out.write(`\n[TIMEOUT] Killing process after ${Math.round(timeoutMs / 60000)} minutes\n`);
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      } else {
        child.kill('SIGKILL');
      }
    } catch {}
  }, timeoutMs);

  // Periodic heartbeat line so UI always shows progress even when command is quiet
  currentLogTicker = setInterval(() => {
    out.write(`[RUNNING] ${new Date().toISOString()} pid=${child.pid}\n`);
  }, 10000);

  child.stdout.on('data', b => out.write(b.toString()));
  child.stderr.on('data', b => out.write(b.toString()));

  child.on('close', (code) => {
    if (currentRunTimer) {
      clearTimeout(currentRunTimer);
      currentRunTimer = null;
    }
    if (currentLogTicker) {
      clearInterval(currentLogTicker);
      currentLogTicker = null;
    }
    out.write(`\nEnded: ${new Date().toISOString()}\nExitCode: ${code}\n`);
    out.end();
    finalizeRun(runId, code);
    currentProcess = null;
  });

  child.on('error', (err) => out.write(`\nProcess error: ${err.message}\n`));
  return entry;
}

function stopCurrentRun() {
  if (!currentProcess) return false;
  try {
    if (currentRunTimer) {
      clearTimeout(currentRunTimer);
      currentRunTimer = null;
    }
    if (currentLogTicker) {
      clearInterval(currentLogTicker);
      currentLogTicker = null;
    }
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(currentProcess.pid), '/T', '/F'], { windowsHide: true });
    } else {
      currentProcess.kill('SIGKILL');
    }
    return true;
  } catch {
    return false;
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function sendJson(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  const ext = path.extname(filePath).toLowerCase();
  const map = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function buildRerunCommand(run, selectedOnly = []) {
  if (!run?.summary?.failedTests?.length) throw new Error('该任务没有失败用例可重跑');
  const list = (selectedOnly.length ? selectedOnly : run.summary.failedTests).map(t => t.file).filter(Boolean);
  const files = [...new Set(list)];
  if (!files.length) throw new Error('未找到失败用例文件');

  const quoted = files.map(f => `"${f}"`).join(' ');
  if (run.cmd.includes('--project=smoke')) return `npx playwright test ${quoted} --project=smoke`;
  return `npx playwright test ${quoted}`;
}

function triggerJenkins({ baseUrl, user, token, job, params }) {
  return new Promise((resolve, reject) => {
    if (!baseUrl || !job) return reject(new Error('jenkins参数不完整'));
    const hasParams = params && Object.keys(params).length > 0;
    const endpoint = hasParams ? `/job/${encodeURIComponent(job)}/buildWithParameters` : `/job/${encodeURIComponent(job)}/build`;
    const query = hasParams ? `?${new URLSearchParams(params).toString()}` : '';
    const url = new URL(baseUrl + endpoint + query);

    const lib = url.protocol === 'https:' ? https : http;
    const headers = {};
    if (user && token) headers['Authorization'] = 'Basic ' + Buffer.from(`${user}:${token}`).toString('base64');

    const req = lib.request({ method: 'POST', hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers }, (resp) => {
      if (resp.statusCode >= 200 && resp.statusCode < 400) return resolve({ status: resp.statusCode });
      reject(new Error(`Jenkins触发失败: ${resp.statusCode}`));
    });
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      if (req.method === 'GET' && req.url === '/api/status') {
        return sendJson(res, 200, {
          root: ROOT,
          selectedEnv: state.selectedEnv,
          envFiles: getEnvFiles(),
          running: state.running,
          history: state.history,
          presets,
        });
      }

      if (req.method === 'POST' && req.url === '/api/env') {
        const body = await parseJsonBody(req);
        const env = body.env;
        if (!env || !getEnvFiles().includes(`.env.${env}`)) return sendJson(res, 400, { ok: false, error: `环境不存在: .env.${env}` });
        state.selectedEnv = env;
        saveState(state);
        return sendJson(res, 200, { ok: true, selectedEnv: env });
      }

      if (req.method === 'POST' && req.url === '/api/run') {
        const body = await parseJsonBody(req);
        const p = body.presetId ? presets.find(x => x.id === body.presetId) : null;
        const cmd = p ? p.cmd : body.cmd;
        const label = p ? p.label : (body.label || 'custom');
        if (!cmd) return sendJson(res, 400, { ok: false, error: 'cmd为空' });
        const entry = runCommand({ cmd, label, envName: state.selectedEnv });
        return sendJson(res, 200, { ok: true, entry });
      }

      if (req.method === 'POST' && req.url === '/api/rerun-failed') {
        const body = await parseJsonBody(req);
        const run = state.history.find(h => h.id === body.id);
        if (!run) return sendJson(res, 404, { ok: false, error: 'run不存在' });
        const cmd = buildRerunCommand(run, body.selected || []);
        const entry = runCommand({ cmd, label: `重跑失败-${run.label}`, envName: state.selectedEnv });
        return sendJson(res, 200, { ok: true, entry, cmd });
      }

      if (req.method === 'POST' && req.url === '/api/jenkins/trigger') {
        const body = await parseJsonBody(req);
        await triggerJenkins(body);
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === 'POST' && req.url === '/api/stop') return sendJson(res, 200, { ok: stopCurrentRun() });

      if (req.method === 'GET' && req.url.startsWith('/api/log')) {
        const u = new URL(req.url, `http://localhost:${PORT}`);
        const id = u.searchParams.get('id');
        const run = state.history.find(h => h.id === id);
        if (!run) return sendJson(res, 404, { ok: false, error: 'run不存在' });
        const content = fs.existsSync(run.logFile) ? fs.readFileSync(run.logFile, 'utf-8') : '';
        return sendJson(res, 200, { ok: true, content, path: run.logFile, run });
      }

      return sendJson(res, 404, { ok: false, error: 'api不存在' });
    }

    serveStatic(req, res);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message || String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`IWMS Test Control Center running at http://localhost:${PORT}`);
  console.log(`Project root: ${ROOT}`);
});
