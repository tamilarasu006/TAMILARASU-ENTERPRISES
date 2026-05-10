/**
 * TAMILARASU ENTERPRISES — Base API Client
 * Wraps fetch() with auth headers, error handling, and redirect on 401.
 */

const API_BASE = '';

/**
 * Core fetch wrapper.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(API_BASE + url, {
    ...options,
    headers,
    credentials: 'include', // send session cookie
  });

  if (response.status === 401) {
    // Redirect to login unless already there
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
    }
    throw new Error('Authentication required');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && data.error) ? data.error : `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * GET request
 * @param {string} url
 * @returns {Promise<any>}
 */
function get(url) {
  return apiFetch(url, { method: 'GET' });
}

/**
 * POST request
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
function post(url, body) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
function put(url, body) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 * @param {string} url
 * @returns {Promise<any>}
 */
function del(url) {
  return apiFetch(url, { method: 'DELETE' });
}

/**
 * POST with FormData (for file uploads)
 * @param {string} url
 * @param {FormData} formData
 * @returns {Promise<any>}
 */
async function postForm(url, formData) {
  const response = await fetch(API_BASE + url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (response.status === 401) {
    window.location.href = '/login.html';
    throw new Error('Authentication required');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data && data.error) ? data.error : `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Export for use in other scripts
window.api = { get, post, put, del, postForm };
