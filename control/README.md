# IWMS Test Control (Flask)

A Linux-friendly Flask control plane for IWMS automated testing.

## Goals
- Deploy on IWMS Linux application server
- Use npm/npx to run Playwright tests directly
- Fine-grained test management (single case, parameterized flow, full suite)
- API + Web UI
- Git-friendly structure for CI/CD deployment

## Key Features
- Environment profiles (UAT/INT/custom)
- Case catalog (RF smoke, SO flow, PO, WO, custom)
- Parameterized execution (`SO_NO`, `WO_NO`, `DELIVERY_ID`, etc.)
- Connectivity preflight before run (8010/8012/DB fail-fast)
- Run queue with status tracking
- Live log tail
- Stop/kill running jobs
- Playwright JSON summary parser (total/failed/duration + failed list)
- SQLite persistence

## Project Structure

```text
app/
  __init__.py
  config.py
  db.py
  models.py
  services/
    runner.py
    case_registry.py
  routes/
    health.py
    envs.py
    cases.py
    runs.py
  templates/
    index.html
  static/
    app.js
    app.css
run.py
requirements.txt
```

## Quick Start (Linux)

```bash
# 1) clone
cd /opt
git clone <YOUR_GITHUB_REPO_URL> iwms-test-control
cd iwms-test-control

# 2) venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3) env
cp .env.example .env

# 4) run
python run.py
# open http://<server>:5077
```

## npm/Playwright dependency strategy
- Flask app orchestrates commands
- Actual test execution runs through npm/npx in your IWMS test project path (`IWMSTEST_PROJECT_ROOT`)
- Keep Playwright project separate and reusable

## Deployment Note
Use systemd service for production (sample in docs/systemd.service).
