import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// Prints the normal summary in the terminal and also saves it as JSON
// in the reports folder, e.g. reports/load-summary.json
export function makeSummary(testName) {
  return function (data) {
    return {
      stdout: textSummary(data, { indent: ' ', enableColors: true }),
      [`reports/${testName}-summary.json`]: JSON.stringify(data, null, 2),
    };
  };
}