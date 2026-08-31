// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { UAParser } from 'ua-parser-js';
import { isIPadOSLike, computeDeviceFlags } from './deviceDetection';

const parser = new UAParser();
const nav = typeof navigator !== 'undefined' ? navigator : undefined;

const flags = computeDeviceFlags(parser.getOS(), parser.getDevice(), isIPadOSLike(nav));

/**
 * Whether the current device is an iOS/Android phone or tablet. Includes iPadOS
 * Safari, which reports a desktop Mac user-agent and is detected via touch support.
 * @type {boolean}
 */
export const isMobileOrTablet = flags.isMobileOrTablet;

/**
 * Whether the current device runs iOS or iPadOS.
 * @type {boolean}
 */
export const isIOS = flags.isIOS;

/**
 * Whether the current device runs Android.
 * @type {boolean}
 */
export const isAndroid = flags.isAndroid;
