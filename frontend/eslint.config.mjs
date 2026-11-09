// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    // Flat config matches only .js/.mjs/.cjs by default; components are .jsx.
    files: ['**/*.{js,jsx,mjs}'],
    plugins: {
      jsdoc
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'space-before-function-paren': ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'jsx-quotes': ['error', 'prefer-single'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: true,
          FunctionExpression: true,
          ArrowFunctionExpression: true
        }
      }],
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'warn',
      // Nested props of a destructured object (props.content.name) are documentation, not parameters.
      'jsdoc/check-param-names': ['error', { disableExtraPropertyReporting: true }],
      'jsdoc/check-types': 'error',
      'jsdoc/valid-types': 'error',
      'comma-dangle': ['error', 'never']
    }
  },
  {
    files: ['server.js', 'vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    ignores: ['dist/', 'node_modules/', '.pnp.*', '.yarn/', 'scripts/']
  }
];
