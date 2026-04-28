// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/** @type {RegExp} Domain URL regex — requires a TLD-like suffix after a dot. */
const URL_REGEX = /^(https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/i;

/** @type {RegExp} IPv4 and IPv6 address regex. */
const IP_REGEX = /((^((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))$)|(^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?$))/i;

/** @type {RegExp} Matches protocol-only strings such as 'https://' or 'ftp:/'. */
const PROTOCOL_ONLY_REGEX = /^[a-z][a-z0-9+.-]*:\/?\/?$/i;

/** @type {RegExp} Trailing slash followed by zero or more '?' or '#' characters. */
const TRAILING_CHARS_REGEX = /\/(\?|#)*$/;

/** @type {RegExp} Leading characters that are not alphanumeric (stripped before prepending). */
const LEADING_NON_ALNUM_REGEX = /^[^a-zA-Z0-9]+/;

/**
 * Check if a URL starts with http:// or https://.
 * @param {string} url - The URL to check.
 * @returns {boolean} True if the URL has a standard HTTP(S) protocol.
 */
function hasStandardProtocol (url) {
  const lower = url.toLowerCase();

  return lower.startsWith('http://') || lower.startsWith('https://');
}

/**
 * Prepend 'https://' to a URL if it lacks a standard protocol.
 * Leading non-alphanumeric characters are stripped before prepending.
 * @param {string} url - The URL to process.
 * @returns {string} The URL with a protocol.
 */
function prependProtocol (url) {
  if (hasStandardProtocol(url)) {
    return url;
  }

  const cleaned = url.replace(LEADING_NON_ALNUM_REGEX, '');

  return `https://${cleaned}`;
}

/**
 * Check whether a string looks like a URL (domain, IP, or http/https).
 * @param {string} url - The string to validate.
 * @returns {boolean} True if the string is a valid URL.
 */
function isUrl (url) {
  if (url.length <= 0) {
    return false;
  }

  if (/\s/.test(url)) {
    return false;
  }

  if (hasStandardProtocol(url)) {
    return true;
  }

  if (URL_REGEX.test(url) || IP_REGEX.test(url)) {
    const prepended = prependProtocol(url);

    try {
      new URL(prepended);

      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Lowercase the hostname of a URL while preserving protocol, port, path, query, and hash.
 * @param {string} url - The URL to process.
 * @returns {string} The URL with a lowercased hostname.
 */
function lowerCaseHostname (url) {
  const urlObj = new URL(url);
  const { hostname, protocol, port, pathname, search, hash } = urlObj;
  const portPart = port ? `:${port}` : '';

  return `${protocol}//${hostname.toLowerCase()}${portPart}${pathname}${search}${hash}`;
}

/**
 * Remove a trailing slash plus any trailing '?' or '#' characters from a URL.
 * Protocol-only strings (e.g. 'https://') are returned unchanged.
 * @param {string} url - The URL to process.
 * @returns {string} The URL with trailing characters removed.
 */
function removeTrailingChars (url) {
  if (PROTOCOL_ONLY_REGEX.test(url)) {
    return url;
  }

  return url.replace(TRAILING_CHARS_REGEX, '');
}

/**
 * Normalize a user-provided URI so it can be used as an anchor href.
 * Pipeline: trim → validate → prepend 'https://' if missing →
 * IDN-normalize via the URL constructor → lowercase the hostname →
 * strip trailing slash, '?', or '#'.
 * Ported from the 2fas-pass-browser-extension URIMatcher, minus the
 * public-suffix and internal-browser-protocol handling (not relevant
 * in a web frontend).
 * @param {string} url - The URI to normalize.
 * @returns {string} The normalized URL.
 * @throws {Error} If the input is not a string or is not a valid URL.
 */
export default function normalizeUrl (url) {
  if (typeof url !== 'string') {
    throw new Error('Parameter is not a string');
  }

  const trimmed = url.trim();

  if (!isUrl(trimmed)) {
    throw new Error('Parameter is not a valid URL');
  }

  const prepended = prependProtocol(trimmed);
  const hrefNormalized = new URL(prepended).href;
  const lowered = lowerCaseHostname(hrefNormalized);

  return removeTrailingChars(lowered);
}
