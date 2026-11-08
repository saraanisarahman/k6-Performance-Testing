// Shared settings. Values can be overridden with environment variables,
// e.g. k6 run -e BASE_URL=https://my-staging-server tests/smoke.js
export const BASE_URL = __ENV.BASE_URL || 'https://restful-booker.herokuapp.com';

// Public demo credentials for this practice API.
// In a real project these would come from environment variables or CI secrets.
export const CREDENTIALS = {
  username: __ENV.RB_USERNAME || 'admin',
  password: __ENV.RB_PASSWORD || 'password123',
};

// Pass/fail rules used by the smoke and load tests.
// If any rule is broken, k6 marks the run as failed (non-zero exit code).
export const THRESHOLDS = {
  http_req_failed: ['rate<0.01'], // less than 1% of requests may fail
  http_req_duration: ['p(95)<1000'], // 95% of requests faster than 1 second
  checks: ['rate>0.99'], // more than 99% of checks must pass
  // Per-endpoint rules, so the summary shows each endpoint's response time
  'http_req_duration{name:GET /booking}': ['p(95)<1500'],
  'http_req_duration{name:POST /booking}': ['p(95)<1000'],
  'http_req_duration{name:GET /booking/:id}': ['p(95)<1000'],
  'http_req_duration{name:PATCH /booking/:id}': ['p(95)<1000'],
  'http_req_duration{name:DELETE /booking/:id}': ['p(95)<1000'],
};