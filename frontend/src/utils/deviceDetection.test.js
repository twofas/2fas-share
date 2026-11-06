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
const IPHONE_FACEBOOK_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21B80 [FBAN/FBIOS;FBAV/442.0.0.40.112;FBBV/553012345;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.1;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]';
const IPOD_UA = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1';
const IPAD_CHROME_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
const ANDROID_PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const ANDROID_REDUCED_UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const ANDROID_TABLET_UA = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ANDROID_FIREFOX_UA = 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0';
const ANDROID_WEBVIEW_UA = 'Mozilla/5.0 (Linux; Android 13; SM-S911B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.163 Mobile Safari/537.36';
const ANDROID_TV_UA = 'Mozilla/5.0 (Linux; Android 9; BRAVIA 4K GB ATV3 Build/PTT1.190515.001.S52) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.5249.126 Safari/537.36';
const FIRE_TV_UA = 'Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7233) AppleWebKit/537.36 (KHTML, like Gecko) Silk/112.3.1 like Chrome/112.0.5615.213 Safari/537.36';
const WINDOWS_PHONE_UA = 'Mozilla/5.0 (Mobile; Windows Phone 8.1; Android 4.0; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 635) like iPhone OS 7_0_3 Mac OS X AppleWebKit/537 (KHTML, like Gecko) Mobile Safari/537';
const HARMONYOS_UA = 'Mozilla/5.0 (Linux; Android 10; HarmonyOS; NOH-NX9; HMSCore 6.13.0.302) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 HuaweiBrowser/14.0.5.302 Mobile Safari/537.36';
const WINDOWS_TOUCH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const LINUX_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

test('iPhone Safari is treated as mobile iOS', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: IPHONE_UA });
  assert.deepEqual(flags, { isMobileOrTablet: true, isIOS: true, isAndroid: false });
});

test('iPhone in-app browser (no Safari token) is treated as mobile iOS', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: IPHONE_FACEBOOK_UA });
  assert.deepEqual(flags, { isMobileOrTablet: true, isIOS: true, isAndroid: false });
});

test('iPod touch is treated as mobile iOS', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: IPOD_UA });
  assert.deepEqual(flags, { isMobileOrTablet: true, isIOS: true, isAndroid: false });
});

test('Chrome on iPad (keeps iPad in UA) is treated as mobile iOS', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: IPAD_CHROME_UA });
  assert.deepEqual(flags, { isMobileOrTablet: true, isIOS: true, isAndroid: false });
});

test('Safari on iPad (desktop Macintosh UA + touch) is treated as mobile iOS', () => {
  // iPadOS 13+ Safari sends a Macintosh UA. Touch support is the only signal
  // that it is really an iPad.
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: MAC_UA });
  assert.deepEqual(flags, { isMobileOrTablet: true, isIOS: true, isAndroid: false });
});

test('real Mac desktop (no touch) is NOT treated as mobile', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 0, userAgent: MAC_UA });
  assert.deepEqual(flags, { isMobileOrTablet: false, isIOS: false, isAndroid: false });
});

for (const [name, ua] of [
  ['Android phone', ANDROID_PHONE_UA],
  ['Android phone with reduced UA', ANDROID_REDUCED_UA],
  ['Android tablet', ANDROID_TABLET_UA],
  ['Firefox on Android', ANDROID_FIREFOX_UA],
  ['Android WebView', ANDROID_WEBVIEW_UA]
]) {
  test(`${name} is treated as mobile Android`, () => {
    const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: ua });
    assert.deepEqual(flags, { isMobileOrTablet: true, isIOS: false, isAndroid: true });
  });
}

for (const [name, ua] of [
  ['Android TV', ANDROID_TV_UA],
  ['Fire TV', FIRE_TV_UA]
]) {
  test(`${name} is Android but NOT mobile`, () => {
    const flags = computeDeviceFlags({ maxTouchPoints: 0, userAgent: ua });
    assert.deepEqual(flags, { isMobileOrTablet: false, isIOS: false, isAndroid: true });
  });
}

test('Windows Phone (spoofs Android and iPhone tokens) is neither iOS nor Android', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: WINDOWS_PHONE_UA });
  assert.deepEqual(flags, { isMobileOrTablet: false, isIOS: false, isAndroid: false });
});

test('HarmonyOS (carries an Android token) is neither Android nor mobile', () => {
  const flags = computeDeviceFlags({ maxTouchPoints: 5, userAgent: HARMONYOS_UA });
  assert.deepEqual(flags, { isMobileOrTablet: false, isIOS: false, isAndroid: false });
});

for (const [name, ua] of [
  ['touch Windows laptop', WINDOWS_TOUCH_UA],
  ['Linux desktop', LINUX_UA]
]) {
  test(`${name} is NOT treated as mobile`, () => {
    const flags = computeDeviceFlags({ maxTouchPoints: 10, userAgent: ua });
    assert.deepEqual(flags, { isMobileOrTablet: false, isIOS: false, isAndroid: false });
  });
}

test('computeDeviceFlags is safe when navigator is absent', () => {
  assert.deepEqual(computeDeviceFlags(undefined), { isMobileOrTablet: false, isIOS: false, isAndroid: false });
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
