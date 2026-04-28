// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { API_BASE_URL } from '@/env';

/**
 * Send an HTTP request and return parsed JSON.
 * @param {string} path - API endpoint path.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<any>} Parsed response body, or null for 204.
 * @throws {Error} On non-OK HTTP responses with `status` property.
 */
async function request (path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Send a GET request.
 * @param {string} path - API endpoint path.
 * @returns {Promise<any>} Parsed response body.
 */
export function get (path) {
  return request(path);
}

/**
 * Send a POST request with a JSON body.
 * @param {string} path - API endpoint path.
 * @param {any} body - Request payload to serialize as JSON.
 * @returns {Promise<any>} Parsed response body.
 */
export function post (path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}


/**
 * Create a new shared secret.
 * @param {object} params - Secret parameters.
 * @param {string} params.data - Encrypted secret data.
 * @param {number} params.validForSeconds - How long the secret stays valid (in seconds).
 * @param {boolean} params.singleUse - If true, the secret can only be retrieved once.
 * @returns {Promise<any>} Created secret metadata from the server.
 */
export function createSecret ({ data, validForSeconds, singleUse }) {
  return post('/secret', { data, validForSeconds, singleUse });
}

/**
 * Retrieve a shared secret by its ID.
 * @param {string} id - The secret identifier.
 * @returns {Promise<{id: string, data: string, singleUse: boolean, validUntil: string}>} The secret data.
 */
export function getSecret (id) {
  return get(`/secret/${id}`);
}
