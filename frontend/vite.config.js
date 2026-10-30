// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import svgr from 'vite-plugin-svgr';
import { compression } from 'vite-plugin-compression2';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'path';
import { sourceLink } from './src/utils/sourceLink.js';

/**
 * Add Subresource Integrity (sha384) attributes to the JS and CSS tags of the
 * built HTML. Rolldown (Vite 8) injects __vite__mapDeps into entry chunks after
 * generateBundle, so hashing chunk.code there produces stale digests;
 * writeBundle runs after the final files are on disk — hash those instead.
 * @returns {import('vite').Plugin} Vite plugin.
 */
function sri () {
  return {
    name: 'vite-plugin-sri',
    enforce: 'post',
    apply: 'build',
    /**
     * Rewrite every emitted HTML file with integrity attributes.
     * @param {import('rollup').NormalizedOutputOptions} options Output options (dir).
     * @param {import('rollup').OutputBundle} bundle Emitted files keyed by name.
     */
    writeBundle (options, bundle) {
      const outDir = options.dir;
      const htmlFiles = Object.keys(bundle).filter(k => k.endsWith('.html'));

      for (const htmlFile of htmlFiles) {
        const htmlPath = path.join(outDir, htmlFile);
        let html = readFileSync(htmlPath, 'utf-8');

        for (const fileName of Object.keys(bundle)) {
          if (!fileName.endsWith('.js') && !fileName.endsWith('.css')) continue;

          const content = readFileSync(path.join(outDir, fileName));
          const hash = createHash('sha384').update(content).digest('base64');
          const escaped = `/${fileName}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          html = html.replace(
            new RegExp(`((?:src|href)="${escaped}")`, 'g'),
            `$1 integrity="sha384-${hash}"`
          );
        }

        writeFileSync(htmlPath, html);
      }
    }
  };
}

const LICENSES_ID = 'virtual:open-source-licenses';
const LICENSES_FILE = path.resolve(import.meta.dirname, 'open-source-licenses.json');

/**
 * Serve the direct npm dependencies of open-source-licenses.json to the Open
 * Source Licenses page (its copy names npm packages, so the font entries stay
 * out), with the license texts the package itself ships (not those fetched
 * from its repository). The file also holds every transitive package with its
 * license texts (over 1 MB), which must not reach the bundle.
 * @returns {import('vite').Plugin} Vite plugin.
 */
function openSourceLicenses () {
  return {
    name: 'open-source-licenses',
    /**
     * Claim the virtual module id.
     * @param {string} id Imported id.
     * @returns {string|undefined} Resolved id of the virtual module.
     */
    resolveId (id) {
      return id === LICENSES_ID ? `\0${LICENSES_ID}` : undefined;
    },
    /**
     * Build the module from the generated JSON.
     * @param {string} id Resolved id.
     * @returns {string|undefined} Module source.
     */
    load (id) {
      if (id !== `\0${LICENSES_ID}`) {
        return undefined;
      }

      this.addWatchFile(LICENSES_FILE);

      const list = JSON.parse(readFileSync(LICENSES_FILE, 'utf-8'))
        .filter(entry => entry.direct && entry.dependencyType !== 'font')
        .map(({ name, installedVersion, link, licenseFiles, licenseFilesSource }) => ({
          name,
          installedVersion,
          link: sourceLink(link),
          licenseFiles: licenseFilesSource === 'package' ? licenseFiles : {}
        }));

      return `export default ${JSON.stringify(list)};`;
    }
  };
}

/**
 * Vite configuration for Preact with SCSS support.
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  build: {
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://share.2fas.com/api',
        changeOrigin: true,
        /**
         * Strip the /api prefix from proxied request paths.
         * @param {string} p Original request path.
         * @returns {string} Path with the /api prefix removed.
         */
        rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    preact(),
    svgr(),
    openSourceLicenses(),
    sri(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress' })
  ],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  }
});
