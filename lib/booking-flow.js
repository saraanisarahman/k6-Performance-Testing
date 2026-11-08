import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, CREDENTIALS } from './config.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Each virtual user runs in its own JavaScript copy, so every VU keeps its own token.
// If the server rejects it (e.g. after the demo server resets and forgets all tokens),
// the VU logs in again on its next request.
let vuToken = null;

// Logs in and returns the auth token. Also used in setup() as a health check.
export function getToken() {
  const res = http.post(`${BASE_URL}/auth`, JSON.stringify(CREDENTIALS), {
    headers: JSON_HEADERS,
    tags: { name: 'POST /auth' },
  });

  const ok = check(res, {
    'auth: status is 200': (r) => r.status === 200,
    'auth: token returned': (r) => r.status === 200 && !!r.json('token'),
  });
  if (!ok) {
    throw new Error(`Login failed: HTTP ${res.status} ${res.body}`);
  }
  return res.json('token');
}

function authHeaders() {
  if (!vuToken) vuToken = getToken();
  return { ...JSON_HEADERS, Cookie: `token=${vuToken}` };
}

// Prints the real status code when a step fails, so failures can be explained.
function logIfFailed(step, res, expectedStatus) {
  if (res.status !== expectedStatus) {
    console.warn(`[VU ${__VU} iter ${__ITER}] ${step} failed: expected ${expectedStatus}, got HTTP ${res.status}`);
  }
  // 403 on a protected endpoint means our token is no longer valid: log in again next time.
  if (res.status === 403) {
    vuToken = null;
  }
}

function bookingPayload() {
  return {
    firstname: `Perf${__VU}_${__ITER}`, // unique per virtual user and iteration
    lastname: 'Test',
    totalprice: Math.floor(Math.random() * 500) + 50,
    depositpaid: true,
    bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
    additionalneeds: 'Breakfast',
  };
}

// One realistic user journey: browse, create, view, update, cancel.
// sleep() adds "think time" between steps, like a real user.
export function bookingJourney() {
  let bookingId;

  group('01 Browse bookings', () => {
    const res = http.get(`${BASE_URL}/booking`, {
      headers: JSON_HEADERS,
      tags: { name: 'GET /booking' },
    });
    check(res, { 'list: status is 200': (r) => r.status === 200 });
    logIfFailed('list', res, 200);
  });
  sleep(1);

  group('02 Create booking', () => {
    const res = http.post(`${BASE_URL}/booking`, JSON.stringify(bookingPayload()), {
      headers: JSON_HEADERS,
      tags: { name: 'POST /booking' },
    });
    const ok = check(res, {
      'create: status is 200': (r) => r.status === 200,
      'create: bookingid returned': (r) => r.status === 200 && r.json('bookingid') !== undefined,
    });
    logIfFailed('create', res, 200);
    if (ok) bookingId = res.json('bookingid');
  });

  // Without a booking the remaining steps make no sense, so stop this iteration.
  if (!bookingId) return;
  sleep(1);

  group('03 View booking', () => {
    const res = http.get(`${BASE_URL}/booking/${bookingId}`, {
      headers: JSON_HEADERS,
      tags: { name: 'GET /booking/:id' },
    });
    check(res, {
      'view: status is 200': (r) => r.status === 200,
      'view: correct lastname': (r) => r.status === 200 && r.json('lastname') === 'Test',
    });
    logIfFailed('view', res, 200);
  });
  sleep(1);

  group('04 Update booking', () => {
    const res = http.patch(
      `${BASE_URL}/booking/${bookingId}`,
      JSON.stringify({ additionalneeds: 'Late checkout' }),
      { headers: authHeaders(), tags: { name: 'PATCH /booking/:id' } }
    );
    check(res, {
      'update: status is 200': (r) => r.status === 200,
      'update: field changed': (r) => r.status === 200 && r.json('additionalneeds') === 'Late checkout',
    });
    logIfFailed('update', res, 200);
  });
  sleep(1);

  group('05 Cancel booking', () => {
    const res = http.del(`${BASE_URL}/booking/${bookingId}`, null, {
      headers: authHeaders(),
      tags: { name: 'DELETE /booking/:id' },
    });
    // Known API quirk: a successful delete returns 201
    check(res, { 'delete: status is 201': (r) => r.status === 201 });
    logIfFailed('delete', res, 201);
  });
  sleep(1);
}