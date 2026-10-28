// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNS, RUN_LIMIT, CTA_COOLDOWN, runEnd, peakOpacity, runDecision, ctaReady, runName, streakBox
} from './arcsLight.js';

test('every run ends before the 4.5 s limit, with the pattern numbers', () => {
  assert.equal(runEnd(RUNS.entry), 4300);
  assert.equal(runEnd(RUNS.ready), 2950);
  assert.equal(runEnd(RUNS.cta), 2200);

  for (const run of Object.values(RUNS)) {
    assert.ok(runEnd(run) < RUN_LIMIT);
  }
});

test('three, two and one streaks, all clockwise', () => {
  assert.equal(RUNS.entry.streaks.length, 3);
  assert.equal(RUNS.ready.streaks.length, 2);
  assert.equal(RUNS.cta.streaks.length, 1);

  for (const run of Object.values(RUNS)) {
    for (const s of run.streaks) {
      assert.ok(s.to > s.from);
    }
  }
});

test('ready is brighter, capped at 1', () => {
  assert.equal(peakOpacity(RUNS.entry), 0.8);
  assert.equal(peakOpacity(RUNS.ready), 1);
});

test('ready interrupts a run, entry and cta never start during one', () => {
  assert.equal(runDecision('ready', true), 'interrupt');
  assert.equal(runDecision('entry', true), 'skip');
  assert.equal(runDecision('cta', true), 'skip');
  assert.equal(runDecision('entry', false), 'start');
  assert.equal(runDecision('cta', false), 'start');
  assert.equal(runDecision('loop', false), 'skip');
});

test('cta at most once every 8 s', () => {
  assert.equal(ctaReady(1000, -Infinity), true);
  assert.equal(ctaReady(1000 + CTA_COOLDOWN - 1, 1000), false);
  assert.equal(ctaReady(1000 + CTA_COOLDOWN, 1000), true);
});

test('the earlier call forms map to a run name', () => {
  assert.equal(runName('cta'), 'cta');
  assert.equal(runName({ throttle: true }), 'cta');
  assert.equal(runName(), 'ready');
  assert.equal(runName({}), 'ready');
});

test('a streak box covers only its arc, at most about 300 px long', () => {
  const small = streakBox(266.5);
  assert.equal(small.arc, 36);
  assert.equal(small.cx, 8);
  assert.ok(Math.abs(small.cy - (266.5 * Math.cos(Math.PI / 5) - 8) * -1) < 1e-9);

  const large = streakBox(694);
  assert.ok(large.arc < 36);
  assert.ok(Math.abs((large.arc * Math.PI / 180) * 694 - 300) < 1e-9);
  assert.ok(large.width < 694 && large.height < 694);
});
