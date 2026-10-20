// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useLayoutEffect, useRef, useContext } from 'preact/hooks';
import useCopy from './useCopy';
import { NoteCopyContext } from './context';
import CopyIcon from '@/assets/icons/file-copy-line.svg?react';
import CheckIcon from '@/assets/icons/check-line.svg?react';
import btn from '@/styles/ds/button.module.scss';
import field from '@/styles/ds/field.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import S from './Parts.module.scss';
import { t } from '@/i18n';

const cx = (...names) => names.filter(Boolean).join(' ');

/**
 * Medallion from the design system (always aria-hidden).
 * @param {object} props - Component props.
 * @param {import('preact').ComponentType} props.icon - Remix icon component.
 * @param {'neutral'|'info'|'error'|'accent'} [props.tone='neutral'] - Tone.
 * @param {'tint'|'inverse'|'solid'} [props.variant='tint'] - Style.
 * @param {24|32|40|96} [props.size=40] - Size in px.
 * @param {string} [props.className] - Extra class.
 * @returns {import('preact').JSX.Element} Medallion.
 */
export function Medallion ({ icon: Icon, tone = 'neutral', variant = 'tint', size = 40, className }) {
  return (
    <span
      className={cx(fb.medallion, fb[`size${size}`], fb[variant], fb[tone], className)}
      aria-hidden='true'
    >
      <Icon />
    </span>
  );
}

/**
 * Window row: Medallion 40, Label/strong title and a Body/xs caption.
 * @param {object} props - Component props.
 * @param {import('preact').ComponentType} props.icon - Remix icon component.
 * @param {string} [props.tone] - Medallion tone.
 * @param {string} [props.variant] - Medallion style.
 * @param {import('preact').ComponentChildren} props.title - Title.
 * @param {import('preact').ComponentChildren} [props.body] - Caption.
 * @param {import('preact').ComponentChildren} [props.children] - Extra content under the caption.
 * @returns {import('preact').JSX.Element} Info row content.
 */
export function InfoRow ({ icon, tone, variant, title, body, children }) {
  return (
    <div className={S.infoRow}>
      <Medallion icon={icon} tone={tone} variant={variant} />
      <div className={S.infoText}>
        <p className={S.infoTitle}>{title}</p>
        {body && <p className={S.infoBody}>{body}</p>}
        {children}
      </div>
    </div>
  );
}

/**
 * Alert / card: stroke only, a medallion, a title and one sentence; permanent
 * information, so role="note" (never role="alert"), and the tone in words as
 * a hidden prefix of the title. Warning = Solid Accent medallion and the
 * accent border; Info = Tint Info.
 * @param {object} props - Component props.
 * @param {import('preact').ComponentType} props.icon - Remix icon component.
 * @param {'warning'|'info'} [props.tone='warning'] - Alert tone.
 * @param {string} [props.id] - Id, for the aria-describedby of a field.
 * @param {import('preact').ComponentChildren} props.title - Title.
 * @param {import('preact').ComponentChildren} [props.body] - Sentence.
 * @param {string} [props.className] - Extra class.
 * @returns {import('preact').JSX.Element} Alert card.
 */
export function AlertCard ({ icon, tone = 'warning', id, title, body, className }) {
  const warning = tone === 'warning';
  const prefix = warning ? t('recipient.warningPrefix') : t('recipient.infoPrefix');

  return (
    <div id={id} role='note' className={cx(fb.alert, warning && fb.alertWarning, S.alert, className)}>
      <Medallion
        icon={icon}
        tone={warning ? 'accent' : 'info'}
        variant={warning ? 'solid' : 'tint'}
      />
      <div className={fb.alertText}>
        <p className={fb.alertTitle}>
          <span className='visually-hidden'>{prefix} </span>
          {title}
        </p>
        {body && <p className={fb.alertBody}>{body}</p>}
      </div>
    </div>
  );
}

/**
 * Copy button: the glyph turns into a checkmark for 2 s and the page status
 * region announces the copy; the button keeps its name.
 * @param {object} props - Component props.
 * @param {string} props.value - Text to copy.
 * @param {'icon'|'adornment'} [props.kind='icon'] - Button / icon (44 px) or a field adornment (24 px glyph).
 * @param {string} [props.message] - Announced text; "Copied!" by default.
 * @param {{ copied: boolean, copy: function(): Promise<void> }} [props.shared] - Copy state shared with the footer CTA.
 * @param {string} [props.className] - Extra class.
 * @returns {import('preact').JSX.Element} Copy button.
 */
export function CopyButton ({ value, kind = 'icon', message, shared, className }) {
  const [ownCopied, ownCopy] = useCopy(value, message || t('common.copied'));
  const copied = shared ? shared.copied : ownCopied;
  const copy = shared ? shared.copy : ownCopy;

  return (
    <button
      type='button'
      className={cx(
        kind === 'icon' ? `${btn.icon} ${S.copyIcon}` : field.adornment,
        copied && S.copied,
        className
      )}
      onClick={copy}
      aria-label={t('common.copyToClipboard')}
    >
      {copied ? <CheckIcon aria-hidden='true' /> : <CopyIcon aria-hidden='true' />}
    </button>
  );
}

/**
 * Field / textarea, State=Readonly with the Copy button: the shared text,
 * selectable with the keyboard (readonly textarea in the Tab order),
 * growing with its content. When the footer CTA copies the same text, the
 * copy button shows its checkmark too.
 * @param {object} props - Component props.
 * @param {string} props.value - Text.
 * @param {string} [props.id] - Textarea id.
 * @param {string} [props.labelledBy] - Id of the visible label.
 * @returns {import('preact').JSX.Element} Read-only secret field.
 */
export function SecretField ({ value, id, labelledBy }) {
  const ref = useRef(null);
  const noteCopy = useContext(NoteCopyContext);
  const shared = noteCopy && noteCopy.value === value ? noteCopy : undefined;

  // Grow with the content where field-sizing: content is not supported.
  useLayoutEffect(() => {
    const el = ref.current;

    if (!el || CSS.supports('field-sizing', 'content')) {
      return undefined;
    }

    /**
     * Fit the textarea height to its content.
     */
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`;
    };

    fit();
    window.addEventListener('resize', fit);

    return () => window.removeEventListener('resize', fit);
  }, [value]);

  return (
    <div className={S.secret}>
      <textarea
        ref={ref}
        id={id}
        className={`${field.textarea} ${S.secretText}`}
        value={value}
        readOnly
        rows={1}
        aria-labelledby={labelledBy}
      />
      <CopyButton value={value} message={t('recipient.contentCopied')} shared={shared} className={S.secretCopy} />
    </div>
  );
}
