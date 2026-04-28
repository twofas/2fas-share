// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef } from 'preact/hooks';
import { useInView } from '@/utils/inView';
import { t } from '@/i18n';
import Check from '@/assets/check.svg?react';
import S from './SecurityPrivacy.module.scss';

/**
 * Renders a single security feature pill with a check icon and label.
 * @param {object} props - Component props.
 * @param {number} props.index - Stagger index for the entrance animation.
 * @param {string} props.label - Translated feature label.
 * @param {string} [props.suffix] - Optional suffix rendered in lighter weight.
 * @returns {import('preact').JSX.Element} A feature pill element.
 */
function Feature ({ index, label, suffix }) {
  return (
    <div className={S.securityPrivacyFeature} style={{ '--pill-i': index }}>
      <span className={S.securityPrivacyIcon} aria-hidden='true'>
        <Check className={S.securityPrivacyCheck} />
      </span>
      <span className={S.securityPrivacyLabel}>
        {label}{suffix && <span className={S.securityPrivacySuffix}> {suffix}</span>}
      </span>
    </div>
  );
}

/**
 * Security and privacy section showcasing security features as animated pills.
 * Each pill fades in with a staggered delay when the section scrolls into view.
 * @returns {import('preact').JSX.Element} The security and privacy component.
 */
export default function SecurityPrivacy () {
  const ref = useRef(null);
  const visible = useInView(ref, 0.15);

  return (
    <div className='container'>
      <section className={`${S.securityPrivacy} ${visible ? S.visible : ''}`} ref={ref}>
        <div className={S.securityPrivacyHeader}>
          <h2 className={S.securityPrivacyTitle}>{t('securityPrivacy.title')}</h2>
          <p className={S.securityPrivacySubtitle}>{t('securityPrivacy.subtitle')}</p>
        </div>

        <div className={S.securityPrivacyFeatures}>
          <Feature index={0} label={t('securityPrivacy.e2e')} />
          <Feature index={1} label={t('securityPrivacy.autoExpiry')} />
          <Feature index={2} label={t('securityPrivacy.oneTime')} />
          <Feature index={3} label={t('securityPrivacy.password')} />
          <Feature index={4} label={t('securityPrivacy.noExternalAccess')} />
          <Feature index={5} label={t('securityPrivacy.openSource')} />
          <Feature index={6} label={t('securityPrivacy.zeroKnowledge')} />
          <Feature index={7} label={t('securityPrivacy.selfHosted')} suffix={t('securityPrivacy.selfHostedSuffix')} />
        </div>
      </section>
    </div>
  );
}
