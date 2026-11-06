// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import FONTS from './fonts.mjs';
import readFontInfo from './readFontInfo.mjs';
import { parseGitHubRepository } from './fetchRepositoryLicenseFiles.mjs';

const TIMEOUT_MS = 15000;
const FONT_FILE_PATTERN = /\.(?:woff2|ttf|otf)$/i;

/**
 * Finds the font files of one family in a folder (whatever their file names) and reads their metadata.
 * The family is matched on the typographic family name, falling back to the legacy family name, which for the
 * instances of a variable font may carry the style ("Montserrat Thin").
 * @param {string} rootDir - Project root.
 * @param {string} fontsDir - Folder with the font files, relative to the project root.
 * @param {string} family - Font family name.
 * @return {Array<{ file: string, info: Object }>} Font files (relative to the project root) with their metadata.
 */
const findFontFiles = (rootDir, fontsDir, family) => {
  const dir = path.join(rootDir, fontsDir);
  const familyPattern = new RegExp(`^${family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`, 'i');
  let names;

  try {
    names = fs.readdirSync(dir).filter(name => FONT_FILE_PATTERN.test(name)).sort();
  } catch {
    return [];
  }

  return names.flatMap(name => {
    try {
      const info = readFontInfo(fs.readFileSync(path.join(dir, name)));

      return familyPattern.test(info.typographicFamily || info.family) ? [{ file: path.join(fontsDir, name), info }] : [];
    } catch {
      return [];
    }
  });
};

/**
 * Fetches the latest release tag of a GitHub repository.
 * @param {string} repository - Repository URL.
 * @param {Function} fetchFn - fetch implementation.
 * @return {Promise<string|null>} Release version without a leading "v", or null.
 */
const fetchLatestRelease = async (repository, fetchFn) => {
  const location = parseGitHubRepository(repository);

  if (!location) {
    return null;
  }

  try {
    const response = await fetchFn(`https://api.github.com/repos/${location.owner}/${location.repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!response.ok) {
      return null;
    }

    const release = await response.json();

    return typeof release?.tag_name === 'string' ? release.tag_name.replace(/^v/, '') : null;
  } catch {
    return null;
  }
};

/**
 * Tells whether a font is licensed under the SIL Open Font License 1.1. Fonts served by Google Fonts drop the license
 * description (nameID 13) and keep only https://openfontlicense.org as the license URL, so the license file is checked too.
 * @param {Object} info - Font metadata.
 * @param {Object<string, string>} licenseFiles - License file name to text.
 * @return {boolean} True for OFL 1.1.
 */
const isOfl11 = (info, licenseFiles) => {
  return /open font license/i.test(info.licenseDescription)
    || /\bOFL\b|openfontlicense\.org/i.test(info.licenseUrl)
    || Object.values(licenseFiles).some(text => /SIL OPEN FONT LICENSE Version 1\.1/i.test(text));
};

/**
 * Builds the license entries of the fonts, in the same format as the npm package entries.
 * @param {Object} options - Options.
 * @param {string} options.rootDir - Project root.
 * @param {string} options.rootId - name@version of the project.
 * @param {string} options.fontsDir - Folder with the font files, relative to the project root.
 * @param {Map<string, Object>} options.previous - Entries of the previous run (their remote versions are reused).
 * @param {boolean} options.offline - Skips the network.
 * @param {Function} [options.fetchFn] - fetch implementation.
 * @param {Object[]} [options.fonts] - Font list (defaults to fonts.mjs).
 * @return {Promise<{ entries: Object[], missing: string[], reused: number }>} Font entries, missing font files and reused remote versions.
 */
const buildFontEntries = async ({ rootDir, rootId, fontsDir, previous, offline, fetchFn = globalThis.fetch, fonts = FONTS }) => {
  const entries = [];
  const missing = [];
  let reused = 0;

  for (const font of fonts) {
    const found = findFontFiles(rootDir, fontsDir, font.family);

    if (found.length === 0) {
      missing.push(`${path.join(fontsDir, '*')} (font ${font.name})`);
      continue;
    }

    const files = found.map(item => item.file);
    const infos = found.map(item => item.info);
    const [info] = infos;
    const name = `${font.name} (font)`;
    const version = info.versionNumber || 'n/a';
    const previousEntry = previous.get(`${name}@${version}`);
    let remoteVersion = previousEntry && previousEntry.remoteVersion !== 'n/a' ? previousEntry.remoteVersion : null;

    if (remoteVersion) {
      reused += 1;
    } else if (!offline) {
      remoteVersion = await fetchLatestRelease(font.repository, fetchFn);
    }

    const licensePath = path.join(rootDir, font.licenseFile);
    const licenseFiles = fs.existsSync(licensePath)
      ? { [path.basename(font.licenseFile)]: fs.readFileSync(licensePath, 'utf8').replace(/\r\n?/g, '\n') }
      : {};

    if (Object.keys(licenseFiles).length === 0) {
      missing.push(`${font.licenseFile} (license of font ${font.name})`);
    }

    entries.push({
      department: 'kessler',
      relatedTo: 'stuff',
      name,
      licensePeriod: 'perpetual',
      material: 'material',
      licenseType: isOfl11(info, licenseFiles) ? 'OFL-1.1' : 'n/a',
      link: font.repository,
      remoteVersion: remoteVersion || 'n/a',
      installedVersion: version,
      definedVersion: font.release || version,
      author: info.designer || info.manufacturer || info.copyright,
      dependencyType: 'font',
      direct: true,
      depth: 1,
      requiredBy: { [rootId]: font.usedBy },
      description: info.description,
      homepage: info.vendorUrl || info.designerUrl,
      repository: font.repository,
      copyright: [...new Set(infos.map(item => item.copyright).filter(Boolean))].join('; '),
      designer: info.designer,
      designerUrl: info.designerUrl,
      manufacturer: info.manufacturer,
      licenseDescription: info.licenseDescription,
      licenseUrl: info.licenseUrl,
      styles: [...new Set(infos.map(item => item.subfamily).filter(Boolean))].join(', '),
      axes: info.axes,
      glyphs: info.glyphs,
      source: font.source,
      modifications: font.modifications,
      paths: files.join(', '),
      sha256: Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(rootDir, file))).digest('hex')])),
      licenseFilesSource: Object.keys(licenseFiles).length > 0 ? font.licenseFile : 'none',
      licenseFiles
    });
  }

  return { entries, missing, reused };
};

export default buildFontEntries;
