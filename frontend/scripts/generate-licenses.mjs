#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Generate open-source-licenses.json from the installed direct dependencies.
 *
 * Usage:
 *   yarn generate-license-info
 *
 * Must run through `yarn node` so the Plug'n'Play API and its zip-aware
 * `fs` are available. Reads each package's own package.json from the
 * install, so versions and licenses match what is actually built.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const OUTPUT = resolve(ROOT_DIR, 'open-source-licenses.json');
const require = createRequire(join(ROOT_DIR, 'package.json'));

let pnp;

try {
  pnp = require('pnpapi');
} catch {
  console.error('Plug\'n\'Play API not found. Run this script with `yarn node` (or `yarn generate-license-info`).');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'));
const defined = { ...manifest.dependencies, ...manifest.devDependencies };

/**
 * Normalize the `license` field, including the legacy object and array forms.
 * @param {any} pkg Parsed package.json of a dependency.
 * @returns {string} SPDX expression, or `n/a` when missing.
 */
function licenseOf (pkg) {
  if (typeof pkg.license === 'string') {
    return pkg.license;
  }

  if (pkg.license?.type) {
    return pkg.license.type;
  }

  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map(l => l.type ?? l).join(' OR ');
  }

  return 'n/a';
}

/**
 * Pick a browsable source link from `repository`, falling back to `homepage`.
 * @param {any} pkg Parsed package.json of a dependency.
 * @returns {string} Repository URL, or an empty string.
 */
function linkOf (pkg) {
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;

  if (repo) {
    // "owner/repo" and "github:owner/repo" are npm shorthands for GitHub.
    const url = /^[\w.-]+\/[\w.-]+$/.test(repo) ? `github:${repo}` : repo;

    return url
      .replace(/^github:/, 'https://github.com/')
      .replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/\.git$/, '');
  }

  return pkg.homepage ?? '';
}

/**
 * Normalize the `author` field to a plain name.
 * @param {any} pkg Parsed package.json of a dependency.
 * @returns {string} Author name, or `n/a`.
 */
function authorOf (pkg) {
  if (typeof pkg.author === 'string') {
    return pkg.author.replace(/\s*[<(].*$/, '');
  }

  return pkg.author?.name ?? 'n/a';
}

const licenses = Object.keys(defined)
  .sort((a, b) => a.localeCompare(b))
  .map(name => {
    const dir = pnp.resolveToUnqualified(name, join(ROOT_DIR, '/'));
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

    return {
      name,
      licenseType: licenseOf(pkg),
      link: linkOf(pkg),
      installedVersion: pkg.version,
      definedVersion: defined[name],
      author: authorOf(pkg)
    };
  });

writeFileSync(OUTPUT, `${JSON.stringify(licenses, null, 2)}\n`);
console.log(`Wrote ${licenses.length} packages to ${OUTPUT}`);
