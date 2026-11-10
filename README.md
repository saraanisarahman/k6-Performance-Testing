# Restful-Booker Performance Tests (k6)

[![k6 Smoke Test](https://github.com/saraanisarahman/k6-Performance-Testing/actions/workflows/k6-smoke.yml/badge.svg)](https://github.com/saraanisarahman/k6-Performance-Testing/actions/workflows/k6-smoke.yml)

Performance tests for the [Restful-Booker](https://restful-booker.herokuapp.com/apidoc/index.html) hotel booking API using [k6](https://k6.io). Each virtual user runs a realistic booking journey, with pass/fail thresholds on response time, error rate and checks. A smoke test runs in GitHub Actions on every push.

## Highlights

- **3 test types**: smoke, load and spike, sharing one reusable user journey
- **Realistic user journey**: browse, create, view, update and cancel a booking, with think time between steps
- **SLA thresholds** overall and per endpoint (p95 response time, error rate, checks)
- **Per-user auth tokens** with automatic re-login if the server rejects a token
- **Failure logging** with the real HTTP status code for every failed step
- **Reports**: k6 web dashboard HTML reports and JSON summaries
- **CI/CD**: GitHub Actions runs the smoke test on push and pull request

## User journey (one iteration)

| Step | Request | Check |
|---|---|---|
| 1. Browse bookings | `GET /booking` | 200 |
| 2. Create booking | `POST /booking` | 200, booking id returned |
| 3. View booking | `GET /booking/:id` | 200, correct data |
| 4. Update booking | `PATCH /booking/:id` (token) | 200, field changed |
| 5. Cancel booking | `DELETE /booking/:id` (token) | 201 (API quirk) |

## Test types

| Test | Load profile | Purpose | Thresholds |
|---|---|---|---|
| Smoke | 1 user, 30 s | Does everything work? | errors < 1%, checks > 99% |
| Load | ramp to 10 users, about 3 min | Normal expected traffic | p95 < 1 s overall, per-endpoint p95 limits, errors < 1% |
| Spike | 2 → 25 users suddenly, then back to 2 | Sudden burst and recovery | p95 < 3 s, errors < 5% |

User counts are kept low on purpose because this is a shared public demo server.

## Results

| Test | Peak users | Requests | Failed | Checks | Avg | p95 | Result |
|---|---|---|---|---|---|---|---|
| Smoke | 1 | 27 | 0% | 100% (44/44) | 357 ms | 760 ms | ✅ Pass |
| Load | 10 | 1,006 | 0% | 100% (1,614/1,614) | 385 ms | 976 ms | ✅ Pass |
| Spike | 25 | 896 | 0% | 100% (1,444/1,444) | 314 ms | 523 ms | ✅ Pass |

### Load test: response time per endpoint (10 users)

| Endpoint | Avg | p95 | Threshold |
|---|---|---|---|
| `GET /booking` (list all) | 861 ms | 1,275 ms | p95 < 1,500 ms ✅ |
| `POST /booking` | 272 ms | 279 ms | p95 < 1,000 ms ✅ |
| `GET /booking/:id` | 267 ms | 274 ms | p95 < 1,000 ms ✅ |
| `PATCH /booking/:id` | 264 ms | 277 ms | p95 < 1,000 ms ✅ |
| `DELETE /booking/:id` | 269 ms | 270 ms | p95 < 1,000 ms ✅ |

## Findings

1. **`GET /booking` is the bottleneck.** It is about 3× slower on average and about 4.6× slower at p95 than every other endpoint. It returns every booking on the server in one response, with no pagination, and most of the 10.7 MB received during the load test came from this endpoint. **Recommendation:** add pagination or a page size limit.
2. **The list endpoint's speed is inconsistent.** In an early smoke run with only 1 user, its p95 reached 3.29 s; in later runs it stayed under 1.3 s. Its speed probably depends on how many bookings exist at that moment, since the demo data resets regularly.
3. **The API handled a sudden spike well.** Going from 2 to 25 users caused no errors, and p95 stayed at 523 ms.
4. **A test design issue was found and fixed.** The first load test version shared a single login token between all users and had **5.09% failed requests**, almost all on the token-protected update and delete steps (likely because the demo server resets and forgets its tokens). The script was redesigned so each virtual user has its own token and logs in again if it is rejected. The same load test then ran with **0% failures**.

## Project structure

```
├── .github/workflows/k6-smoke.yml   # CI: smoke test on every push
├── lib/
│   ├── config.js        # base URL, credentials, thresholds
│   ├── booking-flow.js  # user journey, auth and failure logging
│   └── summary.js       # saves the JSON summary
├── tests/
│   ├── smoke.js
│   ├── load.js
│   └── spike.js
└── reports/             # HTML reports and JSON summaries
```

## How to run

Install k6 (Windows: `winget install k6 --source winget`; other systems: see the [k6 docs](https://grafana.com/docs/k6/latest/set-up/install-k6/)).

PowerShell:

```powershell
$env:K6_WEB_DASHBOARD="true"
$env:K6_WEB_DASHBOARD_EXPORT="reports/smoke-report.html"; k6 run tests/smoke.js
$env:K6_WEB_DASHBOARD_EXPORT="reports/load-report.html";  k6 run tests/load.js
$env:K6_WEB_DASHBOARD_EXPORT="reports/spike-report.html"; k6 run tests/spike.js
```

A live dashboard is available at http://localhost:5665 while a test runs.

To test another server: `k6 run -e BASE_URL=https://your-server tests/smoke.js`

## Note

Restful-Booker is a public practice API shared by many users, so results vary between runs. Numbers above are from runs on 8 November 2026.

## Author

**Sara Anisa Rahman**, Software Development Engineer in Test
[LinkedIn](https://www.linkedin.com/in/sara-anisa-rahman) · [GitHub](https://github.com/saraanisarahman) · [API test suite (Playwright)](https://github.com/saraanisarahman/API-Testing--Playwright)
