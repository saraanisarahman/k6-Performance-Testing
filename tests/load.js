// LOAD TEST: ramps up to 10 virtual users, holds, then ramps down (about 3 minutes).
// Purpose: check response times and errors under normal expected traffic.
// User numbers are kept small on purpose: this is a shared public demo server.
import { getToken, bookingJourney } from '../lib/booking-flow.js';
import { THRESHOLDS } from '../lib/config.js';
import { makeSummary } from '../lib/summary.js';

export const options = {
  stages: [
    { duration: '30s', target: 5 }, // ramp up to 5 users
    { duration: '30s', target: 10 }, // ramp up to 10 users
    { duration: '1m30s', target: 10 }, // stay at 10 users
    { duration: '30s', target: 0 }, // ramp down
  ],
  thresholds: THRESHOLDS,
};

// Health check: log in once before the test starts. If this fails, k6 stops early.
export function setup() {
  getToken();
}

export default function () {
  bookingJourney();
}

export const handleSummary = makeSummary('load');