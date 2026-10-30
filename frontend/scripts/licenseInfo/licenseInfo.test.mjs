// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import collectPackages, { resolvePackageDir } from './collectPackages.mjs';
import fetchRemoteVersions from './fetchRemoteVersions.mjs';
import fetchRepositoryLicenseFiles, { parseGitHubRepository } from './fetchRepositoryLicenseFiles.mjs';
import { LEGACY_COLUMNS, buildEntries, renderLicenseHtml, serializeLicenseJson } from './formatLicenseInfo.mjs';
import { formatPerson, getLicenseType, parseYarnLock, readLicenseFiles, readReadmeLicenseSection } from './readPackageDetails.mjs';
import { createPnpResolver, generateLicenseInfo } from '../generate-license-info.mjs';
import { assertMatch } from './testUtils.mjs';

const APACHE_APPENDIX = 'Copyright [yyyy] [name of copyright owner]';

let root;

/**
 * Writes a file (and its parent folders) inside the temporary project.
 * @param {string} relativePath - Path relative to the project root.
 * @param {string|Object} content - File content (objects are written as JSON).
 * @return {void}
 */
const writeProjectFile = (relativePath, content) => {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, typeof content === 'string' ? content : JSON.stringify(content));
};

/**
 * Creates an installed package in the temporary project.
 * @param {string} folder - Package folder relative to the project root.
 * @param {Object} pkg - package.json content.
 * @param {Object<string, string>} [files] - Extra files of the package.
 * @return {void}
 */
const installPackage = (folder, pkg, files = {}) => {
  writeProjectFile(path.join(folder, 'package.json'), pkg);

  for (const [name, content] of Object.entries(files)) {
    writeProjectFile(path.join(folder, name), content);
  }
};

/**
 * Builds a project where:
 * - "alpha" (dependency) needs "beta@^1", installed nested under alpha,
 * - "beta@2" is a direct devDependency (hoisted),
 * - "gamma" is required by beta@1 and resolved from the root node_modules,
 * - "orphan" sits in node_modules but nothing requires it,
 * - "missing-optional" is an optional dependency that is not installed.
 * @return {void}
 */
const createProject = () => {
  writeProjectFile('package.json', {
    name: 'test-project',
    version: '1.0.0',
    dependencies: { alpha: '^1.0.0' },
    devDependencies: { beta: '^2.0.0' }
  });

  installPackage('node_modules/alpha', {
    name: 'alpha',
    version: '1.2.0',
    license: 'MIT',
    description: 'Alpha package',
    author: { name: 'Alice', email: 'alice@example.com', url: 'https://alice.example.com' },
    repository: { type: 'git', url: 'git+https://github.com/example/alpha.git' },
    keywords: ['first', 'second'],
    dependencies: { beta: '^1.0.0' },
    optionalDependencies: { 'missing-optional': '^1.0.0' }
  }, {
    LICENSE: `MIT License\n\n${APACHE_APPENDIX}\r\n`,
    NOTICE: 'Alpha notice'
  });

  installPackage('node_modules/alpha/node_modules/beta', {
    name: 'beta',
    version: '1.0.0',
    license: 'ISC',
    dependencies: { gamma: '~3.0.0' }
  }, { 'license.md': 'ISC text' });

  installPackage('node_modules/beta', { name: 'beta', version: '2.1.0', license: 'Apache-2.0' }, { LICENSE: 'Apache text' });
  installPackage('node_modules/gamma', { name: 'gamma', version: '3.0.4', licenses: [{ type: 'MIT' }, { type: 'GPL-2.0' }] }, { 'README.md': '# gamma\n\n## License\n\nMIT\n\n## Other\n\nx' });
  installPackage('node_modules/orphan', { name: 'orphan', version: '9.9.9', license: 'MIT' }, { LICENSE: 'orphan' });

  writeProjectFile('yarn.lock', [
    '# yarn lockfile v1',
    '',
    'alpha@^1.0.0:',
    '  version "1.2.0"',
    '  resolved "https://registry.yarnpkg.com/alpha/-/alpha-1.2.0.tgz#abc"',
    '  integrity sha512-alpha',
    '',
    '"beta@^1.0.0":',
    '  version "1.0.0"',
    '  resolved "https://registry.yarnpkg.com/beta/-/beta-1.0.0.tgz#def"',
    '  integrity sha512-beta1',
    ''
  ].join('\n'));
};

/**
 * Creates a fetch mock answering the npm registry dist-tags endpoint.
 * @param {Object<string, string>} latest - Latest version per package name.
 * @return {Function} fetch mock.
 */
const createRegistryFetch = latest => {
  return mock.fn(async url => {
    const name = decodeURIComponent(/\/-\/package\/(.+)\/dist-tags$/.exec(url)?.[1] || '');

    if (latest[name]) {
      return { ok: true, status: 200, json: async () => ({ latest: latest[name] }) };
    }

    return { ok: false, status: 404 };
  });
};

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'license-info-'));
  createProject();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('collectPackages', () => {
  it('returns only the installed versions reachable from package.json, through every nesting level', () => {
    const { packages, missing } = collectPackages(root);
    const keys = packages.map(record => record.key).sort();

    assert.deepEqual(keys, ['alpha@1.2.0', 'beta@1.0.0', 'beta@2.1.0', 'gamma@3.0.4']);
    assert.deepEqual(missing, []);
  });

  it('marks direct packages, the dependency group, depth and who requires each package', () => {
    const { packages } = collectPackages(root);
    const byKey = Object.fromEntries(packages.map(record => [record.key, record]));

    assertMatch(byKey['alpha@1.2.0'], { direct: true, rootRange: '^1.0.0', dependencyType: 'dependencies', depth: 1 });
    assertMatch(byKey['beta@2.1.0'], { direct: true, rootRange: '^2.0.0', dependencyType: 'devDependencies', depth: 1 });
    assertMatch(byKey['beta@1.0.0'], { direct: false, dependencyType: 'dependencies', depth: 2, requiredBy: { 'alpha@1.2.0': '^1.0.0' } });
    assertMatch(byKey['gamma@3.0.4'], { depth: 3, requiredBy: { 'beta@1.0.0': '~3.0.0' } });
    assert.deepEqual(byKey['beta@1.0.0'].dirs, [path.join('node_modules', 'alpha', 'node_modules', 'beta')]);
  });

  it('uses an injected package lookup and writes the folders the way describeDir names them', () => {
    const resolveDir = mock.fn((fromDir, name, rootDir) => resolvePackageDir(fromDir, name, rootDir));
    const describeDir = dir => `${path.basename(dir)}@locator`;
    const { packages } = collectPackages(root, { resolveDir, describeDir });
    const alpha = packages.find(record => record.key === 'alpha@1.2.0');

    assert.ok(resolveDir.mock.calls.length > 0);
    assert.deepEqual(alpha.dirs, ['alpha@locator']);

    // License files are still read from the real folder, not from the described one.
    const [entry] = buildEntries([alpha], { rootDir: root, remoteVersions: new Map(), lock: new Map() });

    assertMatch(entry, { paths: 'alpha@locator', licenseFilesSource: 'package', licenseFiles: { NOTICE: 'Alpha notice' } });
  });

  it('identifies a project without a version by its name', () => {
    writeProjectFile('package.json', { ...JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')), version: undefined });

    const { rootId, packages } = collectPackages(root);

    assert.equal(rootId, 'test-project');
    assertMatch(packages.find(record => record.key === 'alpha@1.2.0'), { requiredBy: { 'test-project': '^1.0.0' } });
  });

  it('reports a required dependency that is not installed', () => {
    installPackage('node_modules/beta', { name: 'beta', version: '2.1.0', dependencies: { absent: '^1.0.0' } });

    assert.deepEqual(collectPackages(root).missing, ['absent@^1.0.0 (required by beta@2.1.0)']);
  });
});

describe('createPnpResolver', () => {
  /**
   * Fake pnpapi resolving packages to folders of the temporary project.
   * @param {Object<string, string>} folders - Package name to folder relative to the project root.
   * @param {Object<string, string>} references - Folder relative to the project root to its Yarn reference.
   * @return {Object} pnpapi stand-in.
   */
  const createPnp = (folders, references) => ({
    resolveToUnqualified: mock.fn(request => {
      const name = request.replace(/\/package\.json$/, '');

      if (!folders[name]) {
        throw new Error(`${name} is not installed`);
      }

      return request.endsWith('/package.json') ? path.join(root, folders[name], 'package.json') : null;
    }),
    findPackageLocator: location => {
      const folder = Object.keys(references).find(key => location.startsWith(path.join(root, key) + path.sep));

      return folder ? { name: path.basename(folder), reference: references[folder] } : null;
    }
  });

  it('resolves through package.json, so a name shared with a Node builtin is found too', () => {
    installPackage('cache/punycode', { name: 'punycode', version: '2.3.1' });

    const { resolveDir } = createPnpResolver(createPnp({ punycode: 'cache/punycode' }, {}));

    assert.equal(resolveDir(root, 'punycode'), path.join(root, 'cache/punycode'));
  });

  it('treats a package PnP cannot resolve as not installed', () => {
    const { resolveDir } = createPnpResolver(createPnp({}, {}));

    assert.equal(resolveDir(root, 'other-platform-binary'), null);
  });

  it('writes the Yarn locator without the virtual prefix', () => {
    const { describeDir } = createPnpResolver(createPnp({}, {
      'cache/alpha': 'virtual:0123abcd#npm:1.2.0',
      'cache/beta': 'npm:2.1.0'
    }));

    assert.equal(describeDir(path.join(root, 'cache/alpha'), root), 'alpha@npm:1.2.0');
    assert.equal(describeDir(path.join(root, 'cache/beta'), root), 'beta@npm:2.1.0');
    assert.equal(describeDir(path.join(root, 'elsewhere/gamma'), root), path.join('elsewhere', 'gamma'));
  });
});

describe('buildEntries and serializeLicenseJson', () => {
  /**
   * Builds the entries of the test project.
   * @return {Object[]} Entries.
   */
  const build = () => {
    const { packages } = collectPackages(root);

    return buildEntries(packages, {
      rootDir: root,
      remoteVersions: new Map([['alpha', '1.3.0']]),
      lock: parseYarnLock(readFileSync(path.join(root, 'yarn.lock'), 'utf8'))
    });
  };

  it('keeps the license-report fields first, in their original order', () => {
    const [alpha] = build();

    assert.deepEqual(Object.keys(alpha).slice(0, LEGACY_COLUMNS.length), LEGACY_COLUMNS.map(([key]) => key));
    assertMatch(alpha, {
      department: 'kessler',
      relatedTo: 'stuff',
      name: 'alpha',
      licensePeriod: 'perpetual',
      material: 'material',
      licenseType: 'MIT',
      link: 'git+https://github.com/example/alpha.git',
      remoteVersion: '1.3.0',
      installedVersion: '1.2.0',
      definedVersion: '^1.0.0',
      author: 'Alice <alice@example.com> (https://alice.example.com)'
    });
  });

  it('adds the package details, lock data and full license file texts', () => {
    const entries = build();
    const alpha = entries.find(entry => entry.name === 'alpha');
    const beta1 = entries.find(entry => entry.name === 'beta' && entry.installedVersion === '1.0.0');
    const gamma = entries.find(entry => entry.name === 'gamma');

    assertMatch(alpha, {
      description: 'Alpha package',
      keywords: 'first, second',
      resolved: 'https://registry.yarnpkg.com/alpha/-/alpha-1.2.0.tgz#abc',
      integrity: 'sha512-alpha',
      licenseFilesSource: 'package',
      licenseFiles: { LICENSE: `MIT License\n\n${APACHE_APPENDIX}\n`, NOTICE: 'Alpha notice' }
    });
    assertMatch(beta1, { definedVersion: '^1.0.0', remoteVersion: 'n/a', licenseFiles: { 'license.md': 'ISC text' } });
    assertMatch(gamma, {
      licenseType: '(MIT OR GPL-2.0)',
      licenseFilesSource: 'package-readme',
      licenseFiles: { 'README.md (License section)': '## License\n\nMIT' }
    });
  });

  it('writes no "]" before the end of the array, so old split(\']\') readers still get every entry', () => {
    const entries = build();
    const json = serializeLicenseJson(entries);
    const asReadBySplit = JSON.parse(json.split(']')[0] + ']');

    assert.deepEqual(asReadBySplit, JSON.parse(json));
    assert.deepEqual(asReadBySplit, JSON.parse(JSON.stringify(entries)));
    assert.ok(asReadBySplit[0].licenseFiles.LICENSE.includes(APACHE_APPENDIX));
  });

  it('escapes license texts in the HTML page', () => {
    const entries = build();
    entries[0].licenseFiles.LICENSE = '<script>alert(1)</script>';

    const html = renderLicenseHtml(entries, { title: 'Licenses' });

    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('<th class="string">installed version</th>'));
  });
});

describe('readPackageDetails', () => {
  it('reads license, notice and "SEE LICENSE IN" files only', () => {
    installPackage('node_modules/delta', { name: 'delta', version: '1.0.0' }, {
      'LICENSE-MIT': 'mit',
      COPYING: 'copying',
      'ThirdPartyNotices.txt': 'notices',
      'terms.txt': 'custom terms',
      'index.js': 'code',
      'licenseChecker.js': 'code'
    });
    mkdirSync(path.join(root, 'node_modules/delta/license'));

    assert.deepEqual(readLicenseFiles(path.join(root, 'node_modules/delta'), 'SEE LICENSE IN terms.txt'), {
      COPYING: 'copying',
      'LICENSE-MIT': 'mit',
      'terms.txt': 'custom terms',
      'ThirdPartyNotices.txt': 'notices'
    });
  });

  it('never reads a "SEE LICENSE IN" file outside the package', () => {
    writeProjectFile('secret.txt', 'secret');

    assert.deepEqual(readLicenseFiles(path.join(root, 'node_modules/orphan'), 'SEE LICENSE IN ../../secret.txt'), { LICENSE: 'orphan' });
  });

  it('formats people and license expressions', () => {
    assert.equal(formatPerson('Bob <bob@example.com>'), 'Bob <bob@example.com>');
    assert.equal(formatPerson({ name: 'Bob' }), 'Bob');
    assert.equal(getLicenseType({ license: { type: 'BSD' } }), 'BSD');
    assert.equal(getLicenseType({ licenses: ['MIT'] }), 'MIT');
    assert.equal(getLicenseType({}), 'n/a');
  });

  it('parses scoped and multi-range yarn.lock headers', () => {
    const lock = parseYarnLock([
      '"@scope/pkg@^1.0.0", "@scope/pkg@^1.1.0":',
      '  version "1.1.2"',
      '  resolved "https://example.com/pkg.tgz"',
      '  integrity sha512-x'
    ].join('\n'));

    assert.deepEqual(lock.get('@scope/pkg@1.1.2'), { resolved: 'https://example.com/pkg.tgz', integrity: 'sha512-x' });
  });

  it('parses a yarn berry lockfile, skipping its __metadata block', () => {
    const lock = parseYarnLock([
      '__metadata:',
      '  version: 8',
      '  cacheKey: 10c0',
      '',
      '"@scope/pkg@npm:^1.0.0, @scope/pkg@npm:^1.1.0":',
      '  version: 1.1.2',
      '  resolution: "@scope/pkg@npm:1.1.2"',
      '  dependencies:',
      '    other: "npm:^2.0.0"',
      '  checksum: 10c0/abc',
      '  languageName: node',
      '  linkType: hard'
    ].join('\n'));

    assert.deepEqual([...lock.keys()], ['@scope/pkg@1.1.2']);
    assert.deepEqual(lock.get('@scope/pkg@1.1.2'), { resolved: '@scope/pkg@npm:1.1.2', integrity: '10c0/abc' });
  });

  it('returns no README section when the README has no license heading', () => {
    assert.deepEqual(readReadmeLicenseSection(path.join(root, 'node_modules/beta')), {});
  });
});

describe('fetchRemoteVersions', () => {
  it('retries rate-limited requests', async () => {
    let calls = 0;
    const fetchFn = mock.fn(async () => {
      calls += 1;

      return calls === 1
        ? { ok: false, status: 429, headers: new Headers() }
        : { ok: true, status: 200, json: async () => ({ latest: '2.0.0' }) };
    });

    const versions = await fetchRemoteVersions(['@scope/pkg'], fetchFn, 1);

    assert.equal(versions.get('@scope/pkg'), '2.0.0');
    assert.equal(fetchFn.mock.callCount(), 2);
    assert.equal(fetchFn.mock.calls[0].arguments[0], 'https://registry.npmjs.org/-/package/@scope%2fpkg/dist-tags');
  });

  it('skips packages the registry does not know', async () => {
    const versions = await fetchRemoteVersions(['unknown'], createRegistryFetch({}), 1);

    assert.equal(versions.size, 0);
  });
});

describe('fetchRepositoryLicenseFiles', () => {
  it('parses GitHub repository forms', () => {
    assert.deepEqual(parseGitHubRepository('git+https://github.com/wxt-dev/wxt.git (directory: packages/storage)'), { owner: 'wxt-dev', repo: 'wxt', directory: 'packages/storage' });
    assert.deepEqual(parseGitHubRepository('git://github.com/juliangruber/isarray.git'), { owner: 'juliangruber', repo: 'isarray', directory: '' });
    assert.deepEqual(parseGitHubRepository('git@github.com:owner/repo.git'), { owner: 'owner', repo: 'repo', directory: '' });
    assert.deepEqual(parseGitHubRepository('sass/embedded-host-node'), { owner: 'sass', repo: 'embedded-host-node', directory: '' });
    assert.equal(parseGitHubRepository('https://gitlab.com/owner/repo'), null);
  });

  it('adds the repository license to packages without a license file, keeping the README section', async () => {
    const entry = {
      installedVersion: '3.0.4',
      repository: 'https://github.com/example/mono.git (directory: packages/gamma)',
      licenseFilesSource: 'package-readme',
      licenseFiles: { 'README.md (License section)': 'MIT' }
    };
    const fetchFn = mock.fn(async url => {
      return url === 'https://raw.githubusercontent.com/example/mono/HEAD/LICENSE'
        ? { ok: true, status: 200, text: async () => 'MIT License\r\n' }
        : { ok: false, status: 404 };
    });

    await fetchRepositoryLicenseFiles([entry, { licenseFilesSource: 'package', licenseFiles: { LICENSE: 'x' } }], fetchFn);

    assert.deepEqual(entry.licenseFiles, { LICENSE: 'MIT License\n', 'README.md (License section)': 'MIT' });
    assert.equal(entry.licenseFilesSource, 'https://github.com/example/mono/blob/HEAD/LICENSE');
    assert.equal(fetchFn.mock.calls[0].arguments[0], 'https://raw.githubusercontent.com/example/mono/v3.0.4/packages/gamma/LICENSE');
  });
});

describe('generateLicenseInfo', () => {
  it('overwrites the JSON and HTML files instead of appending to them', async () => {
    const outDir = path.join(root, 'out');
    const fetchFn = createRegistryFetch({ alpha: '1.3.0', beta: '2.2.0', gamma: '3.1.0' });

    mkdirSync(outDir);
    writeFileSync(path.join(outDir, 'open-source-licenses.json'), '[{"name":"stale"}]');

    await generateLicenseInfo({ rootDir: root, outDir, fetchFn });
    await generateLicenseInfo({ rootDir: root, outDir, fetchFn });

    const json = readFileSync(path.join(outDir, 'open-source-licenses.json'), 'utf8');
    const entries = JSON.parse(json);

    assert.deepEqual(entries.map(entry => `${entry.name}@${entry.installedVersion}`), ['alpha@1.2.0', 'beta@1.0.0', 'beta@2.1.0', 'gamma@3.0.4']);
    assert.deepEqual(entries.map(entry => entry.remoteVersion), ['1.3.0', '2.2.0', '2.2.0', '3.1.0']);
    assert.equal(readFileSync(path.join(outDir, 'open-source-licenses.html'), 'utf8').match(/<table>/g).length, 1);
  });

  it('reuses the network data of packages whose installed version has not changed', async () => {
    const outDir = path.join(root, 'out');
    const repositoryFetch = mock.fn(async url => {
      if (url.startsWith('https://raw.githubusercontent.com/example/gamma/v3.0.4/')) {
        return url.endsWith('/LICENSE') ? { ok: true, status: 200, text: async () => 'Gamma license' } : { ok: false, status: 404 };
      }

      return createRegistryFetch({ alpha: '1.3.0', beta: '2.2.0', gamma: '3.1.0' })(url);
    });

    installPackage('node_modules/gamma', { name: 'gamma', version: '3.0.4', license: 'MIT', repository: 'example/gamma' });
    await generateLicenseInfo({ rootDir: root, outDir, fetchFn: repositoryFetch });

    installPackage('node_modules/alpha', {
      name: 'alpha',
      version: '1.2.1',
      license: 'MIT',
      dependencies: { beta: '^1.0.0' }
    }, { LICENSE: 'MIT License' });

    const fetchFn = createRegistryFetch({ alpha: '1.4.0', beta: '9.9.9', gamma: '9.9.9' });
    const { entries, reused } = await generateLicenseInfo({ rootDir: root, outDir, fetchFn });
    const byKey = Object.fromEntries(entries.map(entry => [`${entry.name}@${entry.installedVersion}`, entry]));

    assert.deepEqual(fetchFn.mock.calls.map(call => call.arguments[0]), ['https://registry.npmjs.org/-/package/alpha/dist-tags']);
    assert.deepEqual(reused, { remoteVersions: 2, licenseFiles: 1 });
    assert.equal(byKey['alpha@1.2.1'].remoteVersion, '1.4.0');
    assert.equal(byKey['beta@2.1.0'].remoteVersion, '2.2.0');
    assertMatch(byKey['gamma@3.0.4'], {
      remoteVersion: '3.1.0',
      licenseFilesSource: 'https://github.com/example/gamma/blob/v3.0.4/LICENSE',
      licenseFiles: { LICENSE: 'Gamma license' }
    });
  });

  it('fetches everything again with refresh, or when the previous file is the old appended format', async () => {
    const outDir = path.join(root, 'out');

    mkdirSync(outDir);
    writeFileSync(path.join(outDir, 'open-source-licenses.json'), '[{"name":"alpha","installedVersion":"1.2.0","remoteVersion":"0.0.1"}][{"name":"alpha"}]');

    const fetchFn = createRegistryFetch({ alpha: '1.3.0', beta: '2.2.0', gamma: '3.1.0' });
    const first = await generateLicenseInfo({ rootDir: root, outDir, fetchFn });

    assert.equal(first.reused.remoteVersions, 0);
    assert.equal(first.entries[0].remoteVersion, '1.3.0');

    fetchFn.mock.resetCalls();
    const second = await generateLicenseInfo({ rootDir: root, outDir, refresh: true, fetchFn });

    assert.deepEqual(second.reused, { remoteVersions: 0, licenseFiles: 0 });
    assert.equal(fetchFn.mock.callCount(), 3);
  });

  it('works offline', async () => {
    const outDir = path.join(root, 'out');
    const fetchFn = mock.fn();
    const { entries, files } = await generateLicenseInfo({ rootDir: root, outDir, format: 'json', offline: true, fetchFn });

    assert.equal(fetchFn.mock.callCount(), 0);
    assert.equal(entries.every(entry => entry.remoteVersion === 'n/a'), true);
    assert.deepEqual(files, [path.join(outDir, 'open-source-licenses.json')]);
  });
});
