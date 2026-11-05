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

// Rolldown (Vite 8) injects __vite__mapDeps into entry chunks after
// generateBundle, so hashing chunk.code there produces stale digests.
// writeBundle runs after the final files are on disk — hash those instead.
function sri () {
  return {
    name: 'vite-plugin-sri',
    enforce: 'post',
    apply: 'build',
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
      '@': path.resolve(__dirname, 'src')
    }
  }
});
