// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/* global process */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import buildFontEntries from './licenseInfo/buildFontEntries.mjs';
import collectPackages from './licenseInfo/collectPackages.mjs';
import fetchRemoteVersions from './licenseInfo/fetchRemoteVersions.mjs';
import fetchRepositoryLicenseFiles from './licenseInfo/fetchRepositoryLicenseFiles.mjs';
import { getPreviousRemoteVersions, readPreviousEntries, reusePreviousLicenseFiles } from './licenseInfo/previousLicenseInfo.mjs';
import { buildEntries, renderLicenseHtml, serializeLicenseJson } from './licenseInfo/formatLicenseInfo.mjs';
import { parseYarnLock } from './licenseInfo/readPackageDetails.mjs';

// Self-hosted fonts (src/styles/_fonts.scss).
const DEFAULT_FONTS_DIR = 'public/fonts';

const OUTPUT_FILES = Object.freeze({
  json: 'open-source-licenses.json',
  html: 'open-source-licenses.html'
});

/**
 * Reads "key=value" command line arguments.
 * @param {string[]} args - Arguments after the script path.
 * @return {Object<string, string>} Parsed arguments.
 */
const parseArgs = args => {
  return Object.fromEntries(args.map(arg => {
    const [key, ...value] = arg.replace(/^--/, '').split('=');

    return [key, value.join('=') || 'true'];
  }));
};

/**
 * Builds the package lookup for a Yarn Plug'n'Play install (no node_modules). Folders stay unqualified (virtual
 * paths included), so peer dependencies resolve from the package that receives them; "paths" show the Yarn
 * locator instead of the zip path in the cache, which differs between machines.
 * @param {Object} pnp - The pnpapi module.
 * @return {{ resolveDir: Function, describeDir: Function }} Options for collectPackages.
 */
export const createPnpResolver = pnp => {
  return {
    resolveDir: (fromDir, name) => {
      try {
        // Through package.json: a bare name that is also a Node builtin (punycode) resolves to null.
        const manifest = pnp.resolveToUnqualified(`${name}/package.json`, `${fromDir}${path.sep}`);

        return manifest && fs.existsSync(manifest) ? path.dirname(manifest) : null;
      } catch {
        // Optional dependencies of other platforms are not installed.
        return null;
      }
    },
    describeDir: (dir, rootDir) => {
      const locator = pnp.findPackageLocator(`${dir}${path.sep}`);

      // A virtual reference ("virtual:<hash>#npm:1.0.0") ends with the real one.
      return locator ? `${locator.name}@${locator.reference.replace(/^virtual:[^#]*#/, '')}` : path.relative(rootDir, dir);
    }
  };
};

/**
 * Loads the Plug'n'Play API when the script runs under Yarn PnP (`yarn node`).
 * @param {string} rootDir - Project root.
 * @return {Object|null} The pnpapi module or null outside PnP.
 */
const loadPnpApi = rootDir => {
  try {
    return createRequire(path.join(rootDir, 'package.json'))('pnpapi');
  } catch {
    return null;
  }
};

/**
 * Generates the open source license files (JSON and/or HTML) of the project, overwriting the previous ones.
 * Packages whose installed version is the same as in the previous JSON reuse its network data (remote version,
 * license files from GitHub); everything read from node_modules and yarn.lock is always read again.
 * The fonts from licenseInfo/fonts.mjs follow the npm packages; their files are read from fontsDir.
 * @param {Object} options - Options.
 * @param {string} options.rootDir - Project root.
 * @param {string} [options.format='all'] - 'json', 'html' or 'all'.
 * @param {string} [options.outDir] - Output folder (defaults to the project root).
 * @param {boolean} [options.offline=false] - Skips the network: the npm registry (remoteVersion becomes 'n/a') and license files from GitHub.
 * @param {boolean} [options.refresh=false] - Ignores the previous JSON and fetches the network data of every package again.
 * @param {Function} [options.fetchFn] - fetch implementation for the npm registry and GitHub.
 * @param {string} [options.fontsDir='public/fonts'] - Folder with the font files, relative to the project root.
 * @param {Object[]} [options.fonts] - Font list (defaults to licenseInfo/fonts.mjs).
 * @param {Object} [options.resolver] - Package lookup for collectPackages (see createPnpResolver); defaults to node_modules.
 * @return {Promise<{ entries: Object[], files: string[], missing: string[], reused: { remoteVersions: number, licenseFiles: number } }>} Generated entries, written files and reuse counts.
 */
export const generateLicenseInfo = async ({ rootDir, format = 'all', outDir = rootDir, offline = false, refresh = false, fetchFn, fontsDir = DEFAULT_FONTS_DIR, fonts, resolver }) => {
  if (!['json', 'html', 'all'].includes(format)) {
    throw new Error(`Unknown format "${format}" (expected json, html or all)`);
  }

  const { rootId, packages, missing } = collectPackages(rootDir, resolver);
  const lockPath = path.join(rootDir, 'yarn.lock');
  const lock = fs.existsSync(lockPath) ? parseYarnLock(fs.readFileSync(lockPath, 'utf8')) : new Map();
  const previous = refresh ? new Map() : readPreviousEntries(path.join(outDir, OUTPUT_FILES.json));
  const remoteVersions = getPreviousRemoteVersions(previous, packages);
  let reusedRemoteVersions = remoteVersions.size;

  if (!offline) {
    const namesToFetch = packages.map(record => record.name).filter(name => !remoteVersions.has(name));

    for (const [name, version] of await fetchRemoteVersions(namesToFetch, fetchFn)) {
      remoteVersions.set(name, version);
    }
  }

  const entries = buildEntries(packages, { rootDir: fs.realpathSync(rootDir), remoteVersions, lock });
  const reusedLicenseFiles = reusePreviousLicenseFiles(entries, previous);
  const files = [];

  if (!offline) {
    await fetchRepositoryLicenseFiles(entries.filter(entry => !reusedLicenseFiles.has(entry)), fetchFn);
  }

  const fontEntries = await buildFontEntries({ rootDir, rootId, fontsDir, previous, offline, fetchFn, fonts });

  entries.push(...fontEntries.entries);
  missing.push(...fontEntries.missing);
  reusedRemoteVersions += fontEntries.reused;

  fs.mkdirSync(outDir, { recursive: true });

  if (format === 'json' || format === 'all') {
    const filePath = path.join(outDir, OUTPUT_FILES.json);
    fs.writeFileSync(filePath, serializeLicenseJson(entries));
    files.push(filePath);
  }

  if (format === 'html' || format === 'all') {
    const filePath = path.join(outDir, OUTPUT_FILES.html);
    fs.writeFileSync(filePath, renderLicenseHtml(entries, { title: `${rootId} - open source licenses` }));
    files.push(filePath);
  }

  return { entries, files, missing, reused: { remoteVersions: reusedRemoteVersions, licenseFiles: reusedLicenseFiles.size } };
};

/**
 * CLI entry: `yarn node scripts/generate-license-info.mjs [format=json|html|all] [out=<dir>] [fonts=<dir>] [offline] [refresh]`.
 * @return {Promise<void>}
 */
const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const pnp = loadPnpApi(rootDir);

  if (!pnp && !fs.existsSync(path.join(rootDir, 'node_modules'))) {
    throw new Error('No node_modules and no Plug\'n\'Play API: run it with `yarn node` (or `yarn generate-license-info`).');
  }
  const { entries, files, missing, reused } = await generateLicenseInfo({
    rootDir,
    format: args.format || 'all',
    outDir: args.out ? path.resolve(rootDir, args.out) : rootDir,
    offline: args.offline === 'true',
    refresh: args.refresh === 'true',
    fontsDir: args.fonts || DEFAULT_FONTS_DIR,
    resolver: pnp ? createPnpResolver(pnp) : undefined
  });

  const withoutRemote = entries.filter(entry => entry.remoteVersion === 'n/a').length;
  const withoutFiles = entries.filter(entry => Object.keys(entry.licenseFiles).length === 0).length;

  console.log(`License info: ${entries.length} packages (${entries.filter(entry => entry.direct).length} direct).`);
  console.log(`Without a license file: ${withoutFiles}. Without a remote version: ${withoutRemote}.`);
  console.log(`Reused from the previous JSON: ${reused.remoteVersions} remote versions, ${reused.licenseFiles} repository license lookups.`);

  for (const missingDependency of missing) {
    console.warn(`Not installed: ${missingDependency}`);
  }

  for (const file of files) {
    console.log(`Written ${path.relative(rootDir, file)}`);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(err => {
    console.error('Error generating license info:', err);
    process.exitCode = 1;
  });
}
