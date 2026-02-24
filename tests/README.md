# IWMSTEST — IWMS WMS Automated E2E Testing Suite

## Overview

Playwright + TypeScript automated testing for IWMS Warehouse Management System.  
Covers both **Web端 (EasyUI)** and **RF MobileApp (Ionic/AngularJS)** interfaces.

## Architecture

```
IWMSTEST/
├── playwright.config.ts          # Multi-project config (web/rf/api/e2e)
├── .env.int / .env.uat           # Environment configurations
├── src/
│   ├── auth/                     # Auth setup (session persistence)
│   ├── config/
│   │   ├── env.ts                # Environment variables
│   │   └── menus.ts              # RF menu definitions (127 menus)
│   ├── data/
│   │   ├── test-data-factory.ts  # Test data creation & queries
│   │   ├── seed-test-data.ts     # Data seed script
│   │   └── cleanup-test-data.ts  # Data cleanup script
│   ├── fixtures/
│   │   └── base.ts               # Custom Playwright fixtures
│   ├── pages/
│   │   ├── web/                  # Web Page Objects (EasyUI)
│   │   │   ├── WebLoginPage.ts
│   │   │   ├── WebMainPage.ts
│   │   │   ├── SOReleasePage.ts
│   │   │   └── ShipConfirmPage.ts
│   │   └── rf/                   # RF Page Objects (Ionic)
│   │       ├── RFLoginPage.ts
│   │       ├── RFMainPage.ts
│   │       ├── SOPickPage.ts
│   │       ├── WavePickPage.ts
│   │       ├── SorterPickPage.ts
│   │       ├── SOLoadPage.ts
│   │       ├── POReceivePage.ts
│   │       ├── PutawayPage.ts
│   │       ├── BinMovePage.ts
│   │       ├── InvAdjustPage.ts
│   │       ├── CycleCountPage.ts
│   │       └── MOIssuePage.ts
│   └── utils/
│       ├── api-client.ts         # Direct API calls
│       ├── db.ts                 # Oracle DB utility
│       ├── helpers.ts            # Common test helpers
│       ├── db-health-check.ts    # DB connectivity check
│       └── env-health-check.ts   # Web endpoint check
├── tests/
│   ├── e2e/                      # Full end-to-end flows
│   │   ├── so-full-flow.spec.ts  # SO: Release → Pick → Load → Ship
│   │   ├── po-receive-flow.spec.ts # PO: Receive → Putaway → Verify
│   │   └── wo-flow.spec.ts       # WO: Pick → Issue → Complete
│   ├── rf/                       # RF module tests
│   │   ├── so-pick.spec.ts
│   │   ├── so-load.spec.ts
│   │   ├── po-receive.spec.ts
│   │   ├── inventory.spec.ts
│   │   └── wo-operations.spec.ts
│   ├── web/                      # Web module tests
│   │   ├── login.spec.ts
│   │   ├── so-release.spec.ts
│   │   └── ship-confirm.spec.ts
│   └── api/                      # API-level tests
│       └── health-check.spec.ts
```

## Quick Start

```bash
# 1. Install dependencies
npm install
npx playwright install chromium

# 2. Check environment connectivity
npm run env:check       # Web endpoints
npm run db:check        # Database connection

# 3. Seed / inspect test data
npm run data:seed       # Report available test data

# 4. Run tests
npm test                # All tests
npm run test:smoke      # Smoke tests only
npm run test:so         # SO flow tests
npm run test:po         # PO flow tests
npm run test:wo         # WO flow tests
npm run test:inv        # Inventory tests
npm run test:web        # Web-only tests
npm run test:rf         # RF-only tests
npm run test:and        # AND org tests
npm run test:ddr        # DDR org tests

# 5. View report
npm run report

# 6. Cleanup test data
npm run data:cleanup
```

## Environments

| Env | Web URL | DB Host |
|-----|---------|---------|
| INT | `https://iwmsint.corp.ivcinc.com:8010` | `iwmsintdb01.corp.ivcinc.com:1521/IWMSINT` |
| UAT | `https://iwmsuat.corp.ivcinc.com:8010` | `iwmsuatdb01.corp.ivcinc.com:1521/IWMSUAT` |

Switch environment: `TEST_ENV=uat npm test`

## Test Accounts

| Account | User | Radius | Usage |
|---------|------|--------|-------|
| Admin | fei.fu.aland | ✅ Yes | Web admin operations (SO Release, Ship Confirm) |
| Test | Test | ❌ No | RF operations (Pick, Receive, Load, etc.) |

## SO Complete Flow (Primary)

```
[Web Admin] SO Release (Direct or Wave)
    ↓
[RF Test] SO Pick (GoodsPickUp) or Wave Pick
    ↓ (if Wave)
[RF Test] Sorter Pick (SorterPickingNew)
    ↓
[RF Test] SO Load
    ↓
[Web Admin] Ship Confirm
```

## Test Tags

| Tag | Description |
|-----|-------------|
| `@smoke` | Quick sanity checks (login, navigation) |
| `@e2e` | Full end-to-end flows |
| `@so` | Sales Order related |
| `@po` | Purchase Order related |
| `@wo` | Work Order related |
| `@inventory` | Inventory operations |
| `@web` | Web EasyUI tests |
| `@rf` | RF MobileApp tests |
| `@api` | API-level tests |
| `@AND` | AND (DC) organization |
| `@DDR` | DDR (Factory) organization |

## Database Access

- **Read-Write:** `WMS/WMS` — used for test data creation and cleanup
- **Read-Only:** `xxwms_ro/xxwms_ro` — used for verification queries

## Key Notes

1. **VPN Required** — all endpoints are internal corporate network
2. **Single Worker** — tests run sequentially to avoid data conflicts  
3. **Self-signed Certs** — `ignoreHTTPSErrors: true` in config
4. **Page Objects** are based on source code analysis; selectors may need refinement after first run against actual pages
5. **Test data** — factory queries existing data; avoids creating synthetic records where possible
