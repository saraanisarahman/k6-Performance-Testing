// SPIKE TEST: normal traffic, then a sudden jump in users, then back to normal (about 1.5 minutes).
// Purpose: see how the API copes with a sudden burst, and whether it recovers afterwards.
import { getToken, bookingJourney } from '../lib/booking-flow.js';
import { makeSummary } from '../lib/summary.js';

export const options = {
  stages: [
    { duration: '10s', target: 2 }, // normal traffic
    { duration: '10s', target: 25 }, // sudden spike
    { duration: '30s', target: 25 }, // hold the spike
    { duration: '10s', target: 2 }, // drop back
    { duration: '20s', target: 2 }, // recovery: are responses back to normal?
    { duration: '10s', target: 0 },
  ],
  // Looser rules than the load test: some slowdown during a spike is expected.
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

// Health check: log in once before the test starts. If this fails, k6 stops early.
export function setup() {
  getToken();
}

export default function () {
  bookingJourney();
}

export const handleSummary = makeSummary('spike');