// SMOKE TEST: 1 virtual user for 30 seconds.
// Purpose: check the script and the API work before running heavier tests.
import { getToken, bookingJourney } from '../lib/booking-flow.js';
import { makeSummary } from '../lib/summary.js';

// The smoke test only answers "does everything work?", so its thresholds check
// errors and checks. Response time targets are checked in the load test.
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

// Health check: log in once before the test starts. If this fails, k6 stops early.
export function setup() {
  getToken();
}

export default function () {
  bookingJourney();
}

export const handleSummary = makeSummary('smoke');