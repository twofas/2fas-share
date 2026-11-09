// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Window, WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import { t } from '@/i18n';
import ctl from '@/styles/ds/controls.module.scss';
import field from '@/styles/ds/field.module.scss';
import W from '@/components/Window/Window.module.scss';
import Star from '@/assets/star.svg?react';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import S from './StepPreview.module.scss';

const EXPIRY = ['expiry.1hour', 'expiry.1day', 'generator.week', 'generator.other'];

/**
 * Option row with a switch that is on.
 * @param {object} props - Component props.
 * @param {import('preact').ComponentChildren} props.title - Row title.
 * @param {string} props.caption - Row caption.
 * @param {string} [props.switchClassName] - Extra class on the switch (turn-on animation).
 * @param {import('preact').ComponentChildren} [props.children] - Content under the row.
 * @returns {import('preact').JSX.Element} Option row.
 */
function SwitchRow ({ title, caption, switchClassName, children }) {
  return (
    <WindowSection compact>
      <span className={S.switchRow}>
        <FieldHeader as='p' title={title} caption={caption} />
        <span className={`${ctl.switch} ${S.switch} ${S.fakeSwitchOn} ${switchClassName || ''}`} />
      </span>
      {children}
    </WindowSection>
  );
}

/**
 * Text field picture of the thumbnail.
 * @param {object} props - Component props.
 * @param {import('preact').ComponentChildren} props.children - Field content.
 * @returns {import('preact').JSX.Element} Field picture.
 */
function PreviewField ({ children }) {
  return <div className={`${field.textarea} ${S.textarea}`}>{children}</div>;
}

/**
 * Card content of one step, drawn in its final state; the micro-sequence
 * classes replay the way there when the card enters the view.
 * @param {object} props - Component props.
 * @param {'content'|'rules'|'password'|'link'} props.step - Which step to draw.
 * @returns {import('preact').JSX.Element} Card sections.
 */
function StepContent ({ step }) {
  if (step === 'rules') {
    return (
      <>
        <WindowSection>
          <FieldHeader as='p' title={t('v2.addForm.expirationTitle')} />
          <div className={ctl.segmented}>
            {EXPIRY.map((key, i) => (
              <span key={key} className={S.segment}>
                <span className={`${ctl.option} ${S.option} ${i === 0 ? `${S.optionSelected} ${S.pillPress}` : ''}`}>{t(key)}</span>
              </span>
            ))}
          </div>
        </WindowSection>
        <SwitchRow title={t('v2.addForm.oneTimeAccessTitle')} caption={t('v2.addForm.oneTimeAccessDesc')} />
      </>
    );
  }

  if (step === 'password') {
    return (
      <>
        <SwitchRow title={t('v2.addForm.oneTimeAccessTitle')} caption={t('v2.addForm.oneTimeAccessDesc')} />
        <SwitchRow
          title={<>{t('v2.addForm.passwordTitle')} <span className={S.titleSuffix}>{t('stepPreview.optionalSuffix')}</span></>}
          caption={t('v2.addForm.passwordDesc')}
          switchClassName={S.switchOn}
        >
          <div className={`${field.control} ${S.control} ${S.fieldDrop}`}>
            <span className={`${field.input} ${S.typedField}`}>
              <span className={`${S.placeholder} ${S.ghost} ${S.passwordGhost}`}>{t('addForm.passwordPlaceholder')}</span>
              <span className={`${S.typed} ${S.typedPassword}`}>••••••••••••</span>
            </span>
            <span className={`${field.adornment} ${S.eye} ${S.eyePop}`}><EyeIcon /></span>
          </div>
        </SwitchRow>
      </>
    );
  }

  if (step === 'link') {
    return (
      <WindowSection>
        <div className={W.fieldHeader}>
          <div className={W.fieldText}>
            <p className={`${W.fieldTitle} ${S.readyTitle}`}>{t('v2.result.title')}</p>
            <p className={`${W.fieldCaption} ${S.readyCaption}`}>{t('generator.readyCaption')}</p>
          </div>
          <Star className={`${W.star} ${S.readyStar}`} aria-hidden='true' />
        </div>
        <PreviewField>
          <span className={`${S.typed} ${S.typedLink}`}>share.2fas.com/#/Tc6MdEbR…</span>
        </PreviewField>
      </WindowSection>
    );
  }

  return (
    <WindowSection className={S.grow}>
      <FieldHeader as='p' title={t('v2.addForm.secureNote')} caption={t('stepPreview.noteCaption')} star />
      <PreviewField>
        <span className={`${S.placeholder} ${S.ghost} ${S.noteGhost}`}>{t('v2.addForm.notePlaceholder')}</span>
        <span className={`${S.typed} ${S.typedLine1}`}>{t('stepPreview.typedLine1')}</span>
        <span className={`${S.typed} ${S.typedLine2}`}>{t('stepPreview.typedLine2', { year: new Date().getFullYear() })}</span>
      </PreviewField>
    </WindowSection>
  );
}

/**
 * Decorative thumbnail of the generator window for a step card of section 03.
 * A picture, not an interface (Figma: aria-hidden and inert, no focusable
 * elements): built only from <span>s, with a grey mock button, and not
 * reacting to the pointer at all (no hover, no zoom: M-26). Drawn at the
 * 1440 size with the tokens times --steps-mini and zoomed to its column by
 * CSS alone (container units), so the layout takes the scaled height along.
 * With `play`, the step's micro-sequence (Figma E · Motion, 03) runs once:
 * typing, the CTA press, the pill press, the switch turning on, "Link ready".
 * Without it, or under prefers-reduced-motion, the final state shows.
 * @param {object} props - Component props.
 * @param {'content'|'rules'|'password'|'link'} props.step - Which step to draw.
 * @param {boolean} [props.play] - Start the micro-sequence (set once, when the card enters the view).
 * @param {string} [props.className] - Extra class on the box.
 * @returns {import('preact').JSX.Element} Step thumbnail.
 */
export default function StepPreview ({ step, play, className }) {
  return (
    <div className={`${S.preview} ${play ? S.play : ''} ${className || ''}`} aria-hidden='true' inert>
      <Window as='div' className={S.window}>
        <WindowCard className={`${S.card} ${step === 'password' ? S.cardEnd : ''}`}>
          <StepContent step={step} />
        </WindowCard>
        <WindowFooter>
          <span className={`${S.cta} ${step === 'content' ? S.ctaPress : ''} ${step === 'link' ? S.ctaAppear : ''}`}>
            {t(step === 'link' ? 'result.copyShareLink' : 'v2.addForm.submit')}
          </span>
        </WindowFooter>
      </Window>
    </div>
  );
}
