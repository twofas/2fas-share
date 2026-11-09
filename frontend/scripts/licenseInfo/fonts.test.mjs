// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import buildFontEntries from './buildFontEntries.mjs';
import FONTS from './fonts.mjs';
import readFontInfo from './readFontInfo.mjs';
import { assertMatch } from './testUtils.mjs';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const NAME_IDS = Object.freeze({ copyright: 0, family: 1, subfamily: 2, version: 5, designer: 9, licenseDescription: 13, licenseUrl: 14, typographicFamily: 16 });
const WOFF2_TAG_INDEXES = Object.freeze({ head: 1, hhea: 2, maxp: 4, name: 5 });

/**
 * Builds a "name" table with Windows (platform 3, encoding 1, en-US) records.
 * @param {Object<string, string>} names - Name strings keyed like NAME_IDS.
 * @return {Buffer} Table data.
 */
const buildNameTable = names => {
  const records = Object.entries(names).map(([key, value]) => ({ nameId: NAME_IDS[key], bytes: Buffer.from(value, 'utf16le').swap16() }));
  const header = Buffer.alloc(6 + (records.length * 12));
  let stringOffset = 0;

  header.writeUInt16BE(records.length, 2);
  header.writeUInt16BE(header.length, 4);
  records.forEach((record, i) => {
    const offset = 6 + (i * 12);
    header.writeUInt16BE(3, offset);
    header.writeUInt16BE(1, offset + 2);
    header.writeUInt16BE(0x409, offset + 4);
    header.writeUInt16BE(record.nameId, offset + 6);
    header.writeUInt16BE(record.bytes.length, offset + 8);
    header.writeUInt16BE(stringOffset, offset + 10);
    stringOffset += record.bytes.length;
  });

  return Buffer.concat([header, ...records.map(record => record.bytes)]);
};

/**
 * Builds the tables of a minimal font.
 * @param {Object<string, string>} names - Name strings.
 * @return {Array<[string, Buffer]>} Table tag and data.
 */
const buildTables = names => {
  const head = Buffer.alloc(54);
  const hhea = Buffer.alloc(36);
  const maxp = Buffer.alloc(6);

  head.writeUInt16BE(1000, 18);
  hhea.writeInt16BE(800, 4);
  hhea.writeInt16BE(-200, 6);
  maxp.writeUInt32BE(0x00005000, 0);
  maxp.writeUInt16BE(42, 4);

  return [['head', head], ['hhea', hhea], ['maxp', maxp], ['name', buildNameTable(names)]];
};

/**
 * Builds a minimal TrueType font.
 * @param {Object<string, string>} names - Name strings.
 * @return {Buffer} Font data.
 */
const buildTtf = names => {
  const tables = buildTables(names);
  const header = Buffer.alloc(12 + (tables.length * 16));
  let offset = header.length;

  header.writeUInt32BE(0x00010000, 0);
  header.writeUInt16BE(tables.length, 4);
  tables.forEach(([tag, data], i) => {
    const record = 12 + (i * 16);
    header.write(tag, record, 'latin1');
    header.writeUInt32BE(offset, record + 8);
    header.writeUInt32BE(data.length, record + 12);
    offset += data.length;
  });

  return Buffer.concat([header, ...tables.map(([, data]) => data)]);
};

/**
 * Encodes a UIntBase128 number (WOFF2).
 * @param {number} value - Number to encode.
 * @return {Buffer} Encoded bytes.
 */
const encodeUIntBase128 = value => {
  const bytes = [value & 0x7f];

  for (let rest = value >>> 7; rest > 0; rest >>>= 7) {
    bytes.unshift((rest & 0x7f) | 0x80);
  }

  return Buffer.from(bytes);
};

/**
 * Builds a minimal WOFF2 font with untransformed tables.
 * @param {Object<string, string>} names - Name strings.
 * @return {Buffer} Font data.
 */
const buildWoff2 = names => {
  const tables = buildTables(names);
  const directory = Buffer.concat(tables.map(([tag, data]) => Buffer.concat([Buffer.from([WOFF2_TAG_INDEXES[tag]]), encodeUIntBase128(data.length)])));
  const compressed = zlib.brotliCompressSync(Buffer.concat(tables.map(([, data]) => data)));
  const header = Buffer.alloc(48);

  header.write('wOF2', 0, 'latin1');
  header.writeUInt16BE(tables.length, 12);
  header.writeUInt32BE(compressed.length, 20);

  return Buffer.concat([header, directory, compressed]);
};

const MONTSERRAT_NAMES = Object.freeze({
  copyright: 'Copyright 2011 The Montserrat Project Authors',
  family: 'Montserrat Thin',
  subfamily: 'Bold',
  version: 'Version 9.000',
  licenseUrl: 'https://openfontlicense.org'
});

let root;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'license-fonts-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('readFontInfo', () => {
  it('reads the name strings, glyph count and metrics of a WOFF2 font', () => {
    const info = readFontInfo(buildWoff2({ ...MONTSERRAT_NAMES, designer: 'Julieta Ulanovsky' }));

    assertMatch(info, {
      copyright: 'Copyright 2011 The Montserrat Project Authors',
      family: 'Montserrat Thin',
      subfamily: 'Bold',
      versionNumber: '9.000',
      designer: 'Julieta Ulanovsky',
      licenseUrl: 'https://openfontlicense.org',
      glyphs: 42,
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      axes: ''
    });
  });

  it('reads a TrueType font', () => {
    assertMatch(readFontInfo(buildTtf({ family: 'Roboto', subfamily: 'Regular', version: 'Version 3.015' })), { family: 'Roboto', subfamily: 'Regular', versionNumber: '3.015' });
  });

  it('rejects files that are not fonts', () => {
    assert.throws(() => readFontInfo(Buffer.from('not a font')), /Unsupported font format/);
  });
});

describe('fonts.mjs', () => {
  it('ships the OFL 1.1 license text of every font', () => {
    for (const font of FONTS) {
      assert.ok(readFileSync(path.join(PROJECT_ROOT, font.licenseFile), 'utf8').includes('SIL OPEN FONT LICENSE Version 1.1'), font.name);
    }
  });
});

describe('buildFontEntries', () => {
  const font = Object.freeze({
    name: 'Montserrat',
    family: 'Montserrat',
    release: '',
    repository: 'https://github.com/JulietaUla/Montserrat',
    usedBy: 'Website',
    source: 'Google Fonts',
    modifications: 'subsets',
    licenseFile: 'licenses/OFL.txt'
  });
  const fontsDir = path.join('.next', 'static', 'media');

  beforeEach(() => {
    mkdirSync(path.join(root, fontsDir), { recursive: true });
    mkdirSync(path.join(root, 'licenses'));
    writeFileSync(path.join(root, fontsDir, 'b2-s.woff2'), buildWoff2(MONTSERRAT_NAMES));
    writeFileSync(path.join(root, fontsDir, 'a1-s.p.woff2'), buildWoff2({ ...MONTSERRAT_NAMES, subfamily: 'Regular' }));
    writeFileSync(path.join(root, fontsDir, 'c3-s.woff2'), buildWoff2({ family: 'Roboto', version: 'Version 3.015' }));
    writeFileSync(path.join(root, fontsDir, 'd4.svg'), '<svg/>');
    writeFileSync(path.join(root, 'licenses/OFL.txt'), 'SIL OPEN FONT LICENSE Version 1.1\r\n');
  });

  it('finds the files of the family under hashed names and builds one entry with the license text', async () => {
    const fetchFn = mock.fn(async () => ({ ok: true, status: 200, json: async () => ({ tag_name: 'v7.222' }) }));
    const { entries, missing, reused } = await buildFontEntries({ rootDir: root, rootId: 'project', fontsDir, previous: new Map(), offline: false, fetchFn, fonts: [font] });

    assert.equal(fetchFn.mock.calls[0].arguments[0], 'https://api.github.com/repos/JulietaUla/Montserrat/releases/latest');
    assert.deepEqual(missing, []);
    assert.equal(reused, 0);
    assert.equal(entries.length, 1);
    assert.deepEqual(Object.keys(entries[0]).slice(0, 11), ['department', 'relatedTo', 'name', 'licensePeriod', 'material', 'licenseType', 'link', 'remoteVersion', 'installedVersion', 'definedVersion', 'author']);
    assertMatch(entries[0], {
      name: 'Montserrat (font)',
      licenseType: 'OFL-1.1',
      remoteVersion: '7.222',
      installedVersion: '9.000',
      definedVersion: '9.000',
      author: 'Copyright 2011 The Montserrat Project Authors',
      dependencyType: 'font',
      requiredBy: { project: 'Website' },
      styles: 'Regular, Bold',
      paths: [path.join(fontsDir, 'a1-s.p.woff2'), path.join(fontsDir, 'b2-s.woff2')].join(', '),
      licenseFilesSource: 'licenses/OFL.txt',
      licenseFiles: { 'OFL.txt': 'SIL OPEN FONT LICENSE Version 1.1\n' }
    });
    assert.deepEqual(Object.keys(entries[0].sha256), [path.join(fontsDir, 'a1-s.p.woff2'), path.join(fontsDir, 'b2-s.woff2')]);
    assert.equal(Object.values(entries[0]).some(Array.isArray), false);
  });

  it('recognizes OFL 1.1 from the license text when the font only carries the license URL of Google Fonts', async () => {
    writeFileSync(path.join(root, fontsDir, 'b2-s.woff2'), buildWoff2({ ...MONTSERRAT_NAMES, licenseUrl: '' }));
    writeFileSync(path.join(root, fontsDir, 'a1-s.p.woff2'), buildWoff2({ ...MONTSERRAT_NAMES, licenseUrl: '' }));

    const { entries } = await buildFontEntries({ rootDir: root, rootId: 'project', fontsDir, previous: new Map(), offline: true, fonts: [font] });

    assert.equal(entries[0].licenseType, 'OFL-1.1');
  });

  it('reports a font whose files are missing', async () => {
    rmSync(path.join(root, '.next'), { recursive: true });

    const { entries, missing } = await buildFontEntries({ rootDir: root, rootId: 'project', fontsDir, previous: new Map(), offline: true, fonts: [font] });

    assert.deepEqual(entries, []);
    assert.deepEqual(missing, [`${path.join(fontsDir, '*')} (font Montserrat)`]);
  });

  it('reuses the remote version of an unchanged font and stays offline', async () => {
    const fetchFn = mock.fn();
    const previous = new Map([['Montserrat (font)@9.000', { remoteVersion: '7.222' }]]);
    const { entries, reused } = await buildFontEntries({ rootDir: root, rootId: 'project', fontsDir, previous, offline: false, fetchFn, fonts: [font] });
    const offline = await buildFontEntries({ rootDir: root, rootId: 'project', fontsDir, previous: new Map(), offline: true, fetchFn, fonts: [font] });

    assert.equal(fetchFn.mock.callCount(), 0);
    assert.equal(reused, 1);
    assert.equal(entries[0].remoteVersion, '7.222');
    assert.equal(offline.entries[0].remoteVersion, 'n/a');
  });
});
