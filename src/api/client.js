/**
 * VitalSense API Client
 * Axios instance with all REST API methods.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch aggregate statistics.
 * @param {number} hours - Time window in hours (default: 24)
 */
export async function fetchStats(hours = 24) {
  const { data } = await api.get(`/api/vitals/stats?hours=${hours}`);
  return data;
}

/**
 * Fetch the latest vital reading.
 */
export async function fetchLatest() {
  const { data } = await api.get('/api/vitals/latest');
  return data;
}

/**
 * Fetch historical readings.
 * @param {number} minutes - Time window in minutes
 */
export async function fetchHistory(minutes = 60) {
  const { data } = await api.get(`/api/vitals/history?minutes=${minutes}`);
  return data;
}

/**
 * Fetch time-bucketed time series for a metric.
 * @param {string} metric - Metric name (heart_rate, spo2, temperature, etc.)
 * @param {number} hours - Time window
 * @param {string} bucket - Bucket size (1min, 5min, 15min, 1hr)
 */
export async function fetchTimeSeries(metric = 'heart_rate', hours = 24, bucket = '5min') {
  const { data } = await api.get(`/api/analytics/timeseries?metric=${metric}&hours=${hours}&bucket=${bucket}`);
  return data;
}

/**
 * Fetch feature importance from the trained Random Forest.
 */
export async function fetchFeatureImportance() {
  const { data } = await api.get('/api/analytics/feature-importance');
  return data;
}

/**
 * Fetch sklearn classification report as JSON.
 */
export async function fetchClassificationReport() {
  const { data } = await api.get('/api/analytics/classification-report');
  return data;
}

/**
 * Fetch alert events.
 * @param {number} limit - Max alerts to return
 * @param {boolean|null} resolved - Filter by resolved status
 */
export async function fetchAlerts(limit = 10, resolved = null) {
  let url = `/api/alerts?limit=${limit}`;
  if (resolved !== null) url += `&resolved=${resolved}`;
  const { data } = await api.get(url);
  return data;
}

/**
 * Mark an alert as resolved.
 * @param {number} id - Alert ID
 */
export async function resolveAlert(id) {
  const { data } = await api.patch(`/api/alerts/${id}/resolve`);
  return data;
}

/**
 * Health check.
 */
export async function healthCheck() {
  const { data } = await api.get('/');
  return data;
}

export default api;
