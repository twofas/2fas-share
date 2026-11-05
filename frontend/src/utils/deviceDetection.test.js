// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isIPadOSLike, computeDeviceFlags } from './deviceDetection.js';

// Real user-agent strings observed in the field.
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const ANDROID_TABLET_UA = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPAD_CHROME_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
const WINDOWS_TOUCH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Mirror the wiring in device.js: derive the public flags from parsed
 * user-agent data plus a navigator-like object.
 * @param {{ os: { name?: string }, device: { type?: string }, nav: object }} input - Parsed UA + navigator.
 * @returns {{ isMobileOrTablet: boolean, isIOS: boolean, isAndroid: boolean }} Computed device flags.
 */
function flagsFor (input) {
  return computeDeviceFlags(input.os, input.device, isIPadOSLike(input.nav));
}

test('iPhone Safari is treated as mobile', () => {
  const flags = flagsFor({
    os: { name: 'iOS' },
    device: { type: 'mobile' },
    nav: { maxTouchPoints: 5, userAgent: IPHONE_UA }
  });
  assert.equal(flags.isMobileOrTablet, true);
  assert.equal(flags.isIOS, true);
  assert.equal(flags.isAndroid, false);
});

test('Android phone is treated as mobile', () => {
  const flags = flagsFor({
    os: { name: 'Android' },
    device: { type: 'mobile' },
    nav: { maxTouchPoints: 5, userAgent: ANDROID_PHONE_UA }
  });
  assert.equal(flags.isMobileOrTablet, true);
  assert.equal(flags.isAndroid, true);
  assert.equal(flags.isIOS, false);
});

test('Android tablet is treated as mobile', () => {
  const flags = flagsFor({
    os: { name: 'Android' },
    device: { type: 'tablet' },
    nav: { maxTouchPoints: 5, userAgent: ANDROID_TABLET_UA }
  });
  assert.equal(flags.isMobileOrTablet, true);
  assert.equal(flags.isAndroid, true);
});

test('Chrome on iPad (keeps iPad in UA) is treated as mobile', () => {
  const flags = flagsFor({
    os: { name: 'iOS' },
    device: { type: 'tablet' },
    nav: { maxTouchPoints: 5, userAgent: IPAD_CHROME_UA }
  });
  assert.equal(flags.isMobileOrTablet, true);
  assert.equal(flags.isIOS, true);
});

test('Safari on iPad (desktop Macintosh UA + touch) is treated as mobile', () => {
  // iPadOS 13+ Safari sends a Macintosh UA: ua-parser reports macOS / no device
  // type. Touch support is the only signal that it is really an iPad.
  const flags = flagsFor({
    os: { name: 'macOS' },
    device: { type: undefined },
    nav: { maxTouchPoints: 5, userAgent: MAC_UA }
  });
  assert.equal(flags.isMobileOrTablet, true);
  assert.equal(flags.isIOS, true);
});

test('real Mac desktop (no touch) is NOT treated as mobile', () => {
  const flags = flagsFor({
    os: { name: 'macOS' },
    device: { type: undefined },
    nav: { maxTouchPoints: 0, userAgent: MAC_UA }
  });
  assert.equal(flags.isMobileOrTablet, false);
  assert.equal(flags.isIOS, false);
});

test('isIPadOSLike detects an iPad reporting a desktop Mac UA', () => {
  assert.equal(isIPadOSLike({ maxTouchPoints: 5, userAgent: MAC_UA }), true);
});

test('isIPadOSLike rejects a real Mac without touch', () => {
  assert.equal(isIPadOSLike({ maxTouchPoints: 0, userAgent: MAC_UA }), false);
});

test('isIPadOSLike rejects a touch Windows laptop (no Macintosh in UA)', () => {
  assert.equal(isIPadOSLike({ maxTouchPoints: 10, userAgent: WINDOWS_TOUCH_UA }), false);
});

test('isIPadOSLike is safe when navigator is absent', () => {
  assert.equal(isIPadOSLike(undefined), false);
});
