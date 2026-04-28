// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef } from 'preact/hooks';
import { useParallax } from '@/utils/parallax';
import S from './decors.module.scss';
import Decor from '@/assets/decor.svg?react';

/**
 * Decors component for displaying decorative elements
 * with entry animations and subtle cursor parallax.
 * @returns {import('preact').JSX.Element} The decors component.
 */
export default function Decors () {
  const containerRef = useRef(null);

  useParallax(containerRef);

  return (
    <div className={S.decors} ref={containerRef}>
      <Decor className={`${S.decorsItem} ${S.small} ${S.p1}`} data-dx='4' data-dy='-4' />
      <Decor className={`${S.decorsItem} ${S.large} ${S.p2}`} data-dx='-10' data-dy='10' />
      <Decor className={`${S.decorsItem} ${S.medium} ${S.p3}`} data-dx='-7' data-dy='-7' />
      <Decor className={`${S.decorsItem} ${S.small} ${S.p4}`} data-dx='-4' data-dy='4' />
      <Decor className={`${S.decorsItem} ${S.medium} ${S.p5}`} data-dx='7' data-dy='7' />
      <Decor className={`${S.decorsItem} ${S.large} ${S.p6}`} data-dx='10' data-dy='-10' />
    </div>
  );
}
