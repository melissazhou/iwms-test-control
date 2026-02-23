# Architecture Plan (IWMS Linux Deployment)

## 1. Separation of Concerns

### Control Plane (this Flask app)
- Case catalog and parameter schema
- Run orchestration
- Environment selection
- Job status/log APIs
- UI for operators

### Execution Plane (existing IWMSTEST project)
- Playwright tests
- npm scripts
- page objects / test data

### Data Plane
- SQLite metadata (`runs`)
- File logs (`tools/dashboard/logs` equivalent for this app: `data/logs`)

## 2. Deployment Topology
- Linux IWMS app server hosts both repos:
  - `/opt/IWMSTEST` (existing tests)
  - `/opt/iwms-test-control` (new Flask control)
- Flask app runs as systemd service on port 5077
- Browser automation runs headless from same Linux host

## 3. Fine-grained Test Management

### Case granularity
- RF Smoke / Web Smoke / API Smoke
- SO flow by SO number
- WO flow by WO number
- Additional future cases:
  - SO release only
  - RF SO pick only
  - RF sorter only
  - RF load only
  - Ship confirm only

### Parameterized run pattern
- UI captures parameters by case schema
- Command template injects values, e.g. `{SO_NO}`
- Stores parameter JSON for audit/replay

## 4. Operational Hardening (next step)
- Queue mode + worker pool (1-2 workers)
- Max runtime per case type
- Retry policy by failure class
- Connectivity pre-check (8010/8012/1521)
- Better result parser (Playwright JSON)
- RBAC/auth for UI

## 5. GitOps Model
- Main branch deploy via webhook or pull script
- systemd restart post-deploy
- NPM install in IWMSTEST handled by deployment script
