// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Generate a random 96-bit nonce for AES-GCM.
 * @returns {Uint8Array} 12-byte nonce.
 */
export function generateNonce () {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Generate a random 128-bit salt for PBKDF2.
 * @returns {Uint8Array} 16-byte salt.
 */
export function generateSalt () {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random 256-bit key for AES-256-GCM.
 * @returns {Uint8Array} 32-byte key.
 */
export function generateRandomKey () {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Derive a 256-bit key from a password using PBKDF2.
 * @param {string} password - User-supplied password.
 * @param {Uint8Array} salt - 128-bit salt.
 * @returns {Promise<Uint8Array>} 32-byte derived key.
 * @throws {Error} If Web Crypto PBKDF2 is unavailable or key derivation fails.
 */
export async function deriveKeyFromPassword (password, salt) {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 600000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return new Uint8Array(derivedBits);
  } catch (err) {
    throw new Error('Key derivation failed', { cause: err });
  }
}

/**
 * Encrypt data using AES-256-GCM.
 * @param {Uint8Array} keyBytes - 256-bit encryption key.
 * @param {Uint8Array} nonce - 96-bit nonce / initialization vector.
 * @param {any} plaintext - Data to encrypt (will be JSON-serialized).
 * @returns {Promise<Uint8Array>} Ciphertext with appended GCM auth tag.
 * @throws {Error} If Web Crypto AES-GCM is unavailable or encryption fails.
 */
export async function encryptData (keyBytes, nonce, plaintext) {
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      'AES-GCM',
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      cryptoKey,
      encoder.encode(JSON.stringify(plaintext))
    );

    return new Uint8Array(encrypted);
  } catch (err) {
    throw new Error('Encryption failed', { cause: err });
  }
}

/**
 * Decrypt data using AES-256-GCM.
 * @param {Uint8Array} keyBytes - 256-bit decryption key.
 * @param {Uint8Array} nonce - 96-bit nonce / initialization vector.
 * @param {Uint8Array} ciphertext - Ciphertext with appended GCM auth tag.
 * @returns {Promise<any>} Parsed plaintext (JSON-deserialized).
 * @throws {Error} If decryption or authentication fails (wrong key / corrupted data).
 */
export async function decryptData (keyBytes, nonce, ciphertext) {
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      'AES-GCM',
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      cryptoKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (err) {
    throw new Error('Decryption failed', { cause: err });
  }
}
