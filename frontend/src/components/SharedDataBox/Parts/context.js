// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { createContext } from 'preact';

/**
 * Announces a message in the page-level role="status" region of the
 * recipient page. Without a provider it does nothing.
 * @type {import('preact').Context<function(string, number=): void>}
 */
export const AnnounceContext = createContext(() => {});

/**
 * Shared copy state of the revealed note: the footer CTA and the copy button
 * in the read-only field copy the same text and show "copied" together.
 * @type {import('preact').Context<{ value: string, copied: boolean, copy: function(): Promise<void>, failures: number }|null>}
 */
export const NoteCopyContext = createContext(null);
