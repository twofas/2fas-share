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
import path from 'path';

/**
 * Vite plugin that adds Subresource Integrity (SRI) hashes to script and link tags.
 * Computes SHA-384 hashes of each JS/CSS asset and injects integrity attributes
 * into the built HTML so browsers can verify file authenticity.
 * @returns {import('vite').Plugin} Vite plugin definition.
 */
function sri () {
  return {
    name: 'vite-plugin-sri',
    enforce: 'post',
    apply: 'build',
    /**
     * Compute SRI hashes for emitted JS/CSS chunks and inject integrity attributes
     * into HTML assets in the bundle.
     * @param {object} _options Rollup output options (unused).
     * @param {object} bundle Map of emitted asset/chunk objects.
     */
    generateBundle (_options, bundle) {
      const htmlAssets = Object.entries(bundle)
        .filter(([key]) => key.endsWith('.html'));

      for (const [, htmlAsset] of htmlAssets) {
        let html = typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : new TextDecoder().decode(htmlAsset.source);

        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (!fileName.endsWith('.js') && !fileName.endsWith('.css')) {
            continue;
          }

          const content = chunk.type === 'chunk' ? chunk.code : chunk.source;
          const hash = createHash('sha384')
            .update(typeof content === 'string' ? content : Buffer.from(content))
            .digest('base64');
          const escaped = `/${fileName}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          html = html.replace(
            new RegExp(`((?:src|href)="${escaped}")`, 'g'),
            `$1 integrity="sha384-${hash}"`
          );
        }

        htmlAsset.source = html;
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
