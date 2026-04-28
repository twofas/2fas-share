// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { UAParser } from 'ua-parser-js';

const parser = new UAParser();
const device = parser.getDevice();
const os = parser.getOS();

const isMobileOS = os.name === 'iOS' || os.name === 'Android';
const isMobileDevice = device.type === 'mobile' || device.type === 'tablet';

/**
 * Whether the current device is an iOS or Android phone/tablet.
 * @type {boolean}
 */
export const isMobileOrTablet = isMobileOS && isMobileDevice;

/**
 * Whether the current device runs iOS.
 * @type {boolean}
 */
export const isIOS = os.name === 'iOS';

/**
 * Whether the current device runs Android.
 * @type {boolean}
 */
export const isAndroid = os.name === 'Android';
