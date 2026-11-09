// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Browsable source URL of an npm package, from the `link` field of
 * open-source-licenses.json. That field keeps the raw `repository` value:
 * npm shorthands ("owner/repo", "github:owner/repo"), git URLs and a
 * monorepo folder written as " (directory: packages/x)".
 * @param {string} link - Raw link from the license entry.
 * @returns {string} HTTPS URL (pointing at the folder in a GitHub monorepo), or an empty string.
 */
export function sourceLink (link) {
  if (!link) {
    return '';
  }

  const [, repo, directory] = /^(.*?)(?: \(directory: (.+)\))?$/.exec(link.trim());
  // "owner/repo" is the npm shorthand for GitHub.
  const url = (/^[\w.-]+\/[\w.-]+$/.test(repo) ? `github:${repo}` : repo)
    .replace(/^github:/, 'https://github.com/')
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '');

  if (directory && url.startsWith('https://github.com/')) {
    return `${url}/tree/HEAD/${directory.replace(/^\/+|\/+$/g, '')}`;
  }

  return url;
}
