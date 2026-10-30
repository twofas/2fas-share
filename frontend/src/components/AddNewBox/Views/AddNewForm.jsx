// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Fragment } from 'preact';
import { useState, useEffect, useLayoutEffect, useRef, useId } from 'preact/hooks';
import { FRONTEND_URL } from '@/env';
import { createSecret } from '@/api/client';
import { toBase64, toBase64Url } from '@/crypto/encoding';
import {
  generateNonce,
  generateSalt,
  generateRandomKey,
  deriveKeyFromPassword,
  encryptData
} from '@/crypto/encrypt';
import PrefetchLink from '@/components/PrefetchLink';
import { WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import FieldMessage from './FieldMessage';
import usePresence from './usePresence';
import btn from '@/styles/ds/button.module.scss';
import lnk from '@/styles/ds/link.module.scss';
import field from '@/styles/ds/field.module.scss';
import ctl from '@/styles/ds/controls.module.scss';
import S from '../AddNewBox.module.scss';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off-line.svg?react';
import { t, tCount } from '@/i18n';
import { contentLimit, noteData } from '@/utils/contentLimit';
import { runArcsLight } from '@/components/ArcsDecor';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import { typedPrefix } from '@/utils/typedText';

// Segmented / expiry: three presets and "Other", which reveals the
// Generator / custom expiry track. Together the same six values as before.
const PRESETS = [
  { value: 3600, label: 'expiry.1hour', short: 'generator.hourShort' },
  { value: 86400, label: 'expiry.1day', short: 'generator.dayShort' },
  { value: 604800, label: 'generator.week', short: 'expiry.7days' }
];
const CUSTOM = [
  { value: 300, label: 'v2.expiry.5min', short: 'expiry.5min' },
  { value: 1800, label: 'v2.expiry.30min', short: 'expiry.30min' },
  { value: 2592000, label: 'expiry.30days' }
];
const OTHER = 'other';
const CUSTOM_DEFAULT = 1800;
const MIN_CREATING_MS = 400;
// The hint types itself once the window has come in (entrance 0.40 + 0.65 s).
const HINT_DELAY_MS = 1100;
const HINT_CHAR_MS = 45;
// The screen reader hears the character count after a pause in typing (BEHAVIOR-SPEC 59.9).
const COUNTER_PAUSE_MS = 1000;

/**
 * Form for creating a new secure share (custom/text content type).
 * Handles client-side encryption (AES-256-GCM) and API submission.
 * @param {Object} props
 * @param {(result: {link: string, expiration: number, oneTimeAccess: boolean, password: string}) => void} props.onSuccess - Called with the share result on success.
 * @param {boolean} [props.focusOnMount] - Focus the content field after mounting.
 * @param {string} [props.labelledBy] - Id of the page heading that names the form.
 * @param {(text: string) => void} props.announce - Write to the window's role="status" region.
 * @returns {import('preact').JSX.Element} The add new form.
 */
export default function AddNewForm({ onSuccess, focusOnMount = false, labelledBy, announce }) {
  const [text, setText] = useState('');
  const [expiration, setExpiration] = useState(3600);
  const [oneTimeAccess, setOneTimeAccess] = useState(true);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Presentational: "Other" selected in the expiry track, failed attempts (medallion bump).
  const [otherSelected, setOtherSelected] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const noteRef = useRef(null);
  const passwordRef = useRef(null);
  const ctaRef = useRef(null);
  const limit = contentLimit(text);
  const uid = useId();
  /**
   * Build a unique element id for this generator instance.
   * @param {string} name - Local name.
   * @returns {string} Element id.
   */
  const id = (name) => `${uid}-${name}`;

  useEffect(() => {
    if (focusOnMount) {
      noteRef.current?.focus();
    }
  }, [focusOnMount]);

  // Field hint typing itself once, letter by letter, while the field is empty
  // and not in use; focus, typing or reduced motion show it whole at once.
  // A screen reader reads the hint on focus, when it is already complete.
  const fullHint = t('v2.addForm.notePlaceholder');
  const [hint, setHint] = useState(() => (focusOnMount || prefersReducedMotion() ? fullHint : ''));

  useEffect(() => {
    if (hint === fullHint) {
      return undefined;
    }

    const note = noteRef.current;
    const start = performance.now();
    let timer;

    const tick = () => {
      if (!note || note.value || document.activeElement === note) {
        setHint(fullHint);
        return;
      }

      const next = typedPrefix(fullHint, performance.now() - start, HINT_DELAY_MS, HINT_CHAR_MS);

      setHint(next);

      if (next !== fullHint) {
        timer = setTimeout(tick, HINT_CHAR_MS);
      }
    };

    timer = setTimeout(tick, HINT_DELAY_MS);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The content field keeps the height it has in the Empty state: a message,
  // the custom expiry block or the password field grow the window instead of
  // shrinking the field (Figma: Error +32 px, Custom +84 px). The height is
  // measured only while none of those is shown.
  const plainRef = useRef(true);
  plainRef.current = !errors.content && !errors.submit && !otherSelected && !usePassword &&
    !limit.over && !limit.showCounter;

  useLayoutEffect(() => {
    const note = noteRef.current;

    if (!note) {
      return undefined;
    }

    /** Measure the free height of the field in the Empty state and keep it. */
    const lock = () => {
      if (!plainRef.current) {
        return;
      }

      note.style.minBlockSize = '';
      note.style.minBlockSize = `${note.offsetHeight}px`;
    };

    lock();
    document.fonts?.ready.then(lock);
    window.addEventListener('resize', lock);

    return () => window.removeEventListener('resize', lock);
  }, []);

  // The counter is read 1 s after the last keystroke, not on every character;
  // the visible text follows the typing at once.
  const counterText = limit.showCounter ? tCount('v2.addForm.contentLeft', limit.remaining) : '';
  const counter = usePresence(limit.showCounter, counterText);

  useEffect(() => {
    if (!counterText) {
      return undefined;
    }

    const timer = setTimeout(() => announce?.(counterText), COUNTER_PAUSE_MS);

    return () => clearTimeout(timer);
  }, [counterText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Field / textarea grows with the content up to a ceiling, then scrolls
  // inside. CSS field-sizing does it where supported; elsewhere measure it.
  useEffect(() => {
    const note = noteRef.current;

    if (!note || CSS.supports?.('field-sizing', 'content')) {
      return;
    }

    note.style.blockSize = 'auto';
    note.style.blockSize = `${note.scrollHeight + 2}px`;
  }, [text]);

  /**
   * Validate form fields before submission.
   * @returns {boolean} True if all fields are valid.
   */
  const validate = () => {
    const newErrors = {};

    if (!text.trim()) {
      newErrors.content = t('v2.addForm.errorContentRequired');
    }

    if (usePassword && password.trim().length < 8) {
      newErrors.password = t('addForm.errorPasswordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !limit.over;
  };

  /**
   * Encrypt the form data and submit it to the API.
   * On success, calls onSuccess with the generated share link.
   * @param {Event} e - The submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validate()) {
      setAttempt((n) => n + 1);
      // Focus goes to the first invalid field; the entered content stays.
      if (!text.trim() || limit.over) {
        noteRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    // Enter on a pill or a switch submits too: those get disabled for the
    // request, so focus moves to the button first instead of the page start.
    if (e.currentTarget.contains(document.activeElement) && document.activeElement.matches('input[type="radio"], input[type="checkbox"]')) {
      ctaRef.current?.focus({ preventScroll: true });
    }

    setAttempt(0);
    setIsSubmitting(true);
    setErrors({});

    // The Creating state lasts at least 400 ms (BEHAVIOR-SPEC), also when the
    // request fails, so a fast server does not make it flash.
    const started = performance.now();
    const settle = () => new Promise(resolve => setTimeout(resolve, Math.max(0, MIN_CREATING_MS - (performance.now() - started))));

    try {
      const data = noteData(text);
      let shareKey, type, urlSecret;
      const nonce = generateNonce();

      if (password.trim()) {
        type = 'v1p';
        const salt = generateSalt();
        shareKey = await deriveKeyFromPassword(password.trim(), salt);
        urlSecret = toBase64Url(salt);
      } else {
        type = 'v1k';
        shareKey = generateRandomKey();
        urlSecret = toBase64Url(shareKey);
      }

      const encrypted = await encryptData(shareKey, nonce, data);

      const result = await createSecret({
        data: toBase64(encrypted),
        validForSeconds: expiration,
        singleUse: oneTimeAccess
      });

      const link = `${FRONTEND_URL}/#/${result.id}/${type}/${toBase64Url(nonce)}/${urlSecret}`;
      await settle();
      onSuccess({ link, expiration, oneTimeAccess, password: password.trim() });
    } catch (err) {
      await settle();
      setErrors({ submit: t('addForm.errorSubmit') });
      // The CTA keeps focus: the message reaches the screen reader through role="status".
      announce?.(`${t('common.errorPrefix')} ${t('addForm.errorSubmit')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Select an option of the first expiry track. "Other" reveals the second
   * track with its default value; a preset hides it again.
   * @param {number|string} value - Seconds or OTHER.
   */
  const selectPreset = (value) => {
    if (value === OTHER) {
      setOtherSelected(true);
      setExpiration(CUSTOM_DEFAULT);
      return;
    }

    setOtherSelected(false);
    setExpiration(value);
  };

  /**
   * Toggle the password option; turning it off clears the password and its error.
   * @param {Event} e - Change event of the switch.
   */
  const togglePassword = (e) => {
    setUsePassword(e.target.checked);

    if (!e.target.checked) {
      setPassword('');
      setShowPassword(false);
      setErrors((prev) => {
        const { password: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Error semantics: the CTA keeps its look but is aria-disabled while the
  // reported problem is still there; pressing it validates again.
  const blocked = Boolean(
    (errors.content && !text.trim()) ||
    limit.over > 0 ||
    (errors.password && usePassword && password.trim().length < 8)
  );
  const contentError = errors.content && !text.trim()
    ? errors.content
    : limit.over > 0 && tCount('v2.addForm.errorContentTooLong', limit.over);
  const ctaDescribedBy = [
    contentError && id('note-error'),
    errors.submit && id('submit-error'),
    errors.password && id('password-error')
  ].filter(Boolean).join(' ') || undefined;

  /**
   * Render one option of a segmented track: a visually hidden radio and its pill.
   * @param {string} name - Radio group name.
   * @param {number|string} value - Option value.
   * @param {boolean} checked - Whether it is selected.
   * @param {string} label - Full label (also the accessible name).
   * @param {string} [short] - Short label shown below 768 px.
   * @param {(value: number|string) => void} onSelect - Selection handler.
   * @returns {import('preact').JSX.Element} Radio and pill.
   */
  /**
   * Home and End jump to the first and last option of a radio group
   * (arrows are native); the selection follows focus, as with the arrows.
   * @param {KeyboardEvent} e - Key event on a radio.
   */
  const selectEdge = (e) => {
    if (e.key !== 'Home' && e.key !== 'End') {
      return;
    }

    const radios = [...e.currentTarget.form.querySelectorAll(`input[type="radio"][name="${e.currentTarget.name}"]`)];
    const target = e.key === 'Home' ? radios[0] : radios[radios.length - 1];

    e.preventDefault();
    target.focus();
    target.click();
  };

  const renderOption = (name, value, checked, label, short, onSelect) => {
    const optionId = id(`${name}-${value}`);

    return (
      <Fragment key={optionId}>
        <input
          type='radio'
          className={ctl.radio}
          id={optionId}
          name={id(name)}
          value={value}
          checked={checked}
          aria-label={short ? label : undefined}
          onKeyDown={selectEdge}
          // A click on the pill focuses its radio, so the next arrow starts
          // from it (AC 83).
          onClick={(e) => e.currentTarget.focus({ preventScroll: true })}
          onChange={() => onSelect(value)}
        />
        <label className={ctl.option} htmlFor={optionId}>
          {short ? (
            <>
              <span className={S.labelLong}>{label}</span>
              <span className={S.labelShort} aria-hidden='true'>{short}</span>
            </>
          ) : label}
        </label>
      </Fragment>
    );
  };

  const sentence = t('v2.legal.share');
  const terms = t('legal.termsOfUse');
  const privacy = t('legal.privacyPolicy');
  const [beforeTerms, afterTermsRaw] = sentence.split(terms);
  const [betweenLinks, afterPrivacy] = afterTermsRaw.split(privacy);

  return (
    <form className={S.view} onSubmit={handleSubmit} noValidate aria-labelledby={labelledBy}>
      <WindowCard className={S.card}>
        <WindowSection className={S.main}>
          <div className={S.noteStack}>
            <FieldHeader
              htmlFor={id('note')}
              title={t('v2.addForm.secureNote')}
              caption={t('stepPreview.noteCaption')}
              captionId={id('note-caption')}
              star
            />
            <div className={`${field.arc} ${S.noteWrap}`}>
              <textarea
                ref={noteRef}
                id={id('note')}
                className={`${field.textarea} ${S.note}`}
                placeholder={hint}
                value={text}
                readOnly={isSubmitting}
                aria-invalid={contentError ? 'true' : undefined}
                aria-describedby={[
                  id('note-caption'),
                  contentError && id('note-error'),
                  limit.showCounter && id('note-counter')
                ].filter(Boolean).join(' ')}
                onInput={(e) => setText(e.target.value)}
              />
            </div>
            <FieldMessage id={id('note-error')} open={Boolean(contentError)} attempt={attempt} className={S.stackMessage}>
              {contentError}
            </FieldMessage>
            {/* The server refused or the network failed (BEHAVIOR-SPEC 59.8): under the note field. */}
            <FieldMessage id={id('submit-error')} open={Boolean(errors.submit)} className={S.stackMessage}>
              {errors.submit}
            </FieldMessage>
            {counter.present && (
              <p
                id={counter.closing ? undefined : id('note-counter')}
                className={`${field.collapsible} ${S.counter}`}
                data-closing={counter.closing ? '' : undefined}
                aria-hidden={counter.closing ? 'true' : undefined}
              >
                <span>{counter.content}</span>
              </p>
            )}
          </div>

          <fieldset
            className={S.group}
            disabled={isSubmitting}
            aria-describedby={id('expiry-desc')}
          >
            <legend className={S.groupLabel}>{t('v2.addForm.expirationTitle')}</legend>
            <p id={id('expiry-desc')} className='visually-hidden'>{t('addForm.expirationDesc')}</p>
            <div className={`${ctl.segmented} ${S.track}`}>
              {PRESETS.map((p) => renderOption(
                'expiry', p.value, !otherSelected && expiration === p.value,
                t(p.label), t(p.short), selectPreset
              ))}
              {renderOption('expiry', OTHER, otherSelected, t('generator.other'), null, selectPreset)}
            </div>
          </fieldset>

          <div className={`${S.collapse} ${S.customCollapse} ${otherSelected ? S.expanded : ''}`} inert={!otherSelected}>
            <div className={S.collapseInner}>
              <fieldset className={`${S.group} ${S.custom}`} disabled={isSubmitting}>
                <legend className={S.groupLabel}>{t('generator.otherDuration')}</legend>
                <div className={`${ctl.segmented} ${S.track} ${S.trackCustom}`}>
                  {CUSTOM.map((c) => renderOption(
                    'expiry-other', c.value, otherSelected && expiration === c.value,
                    t(c.label), c.short && t(c.short), setExpiration
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </WindowSection>

        <WindowSection compact className={S.option}>
          <label className={`${ctl.switchRow} ${S.optionRow}`}>
            <span className={S.optionText}>
              <span id={id('once-title')} className={S.optionTitle}>{t('v2.addForm.oneTimeAccessTitle')}</span>
              <span id={id('once-desc')} className={S.optionDesc}>{t('v2.addForm.oneTimeAccessDesc')}</span>
            </span>
            <input
              type='checkbox'
              role='switch'
              className={ctl.switch}
              checked={oneTimeAccess}
              disabled={isSubmitting}
              aria-labelledby={id('once-title')}
              aria-describedby={id('once-desc')}
              onChange={(e) => setOneTimeAccess(e.target.checked)}
            />
          </label>
        </WindowSection>

        <WindowSection compact className={S.option}>
          <label className={`${ctl.switchRow} ${S.optionRow}`}>
            <span className={S.optionText}>
              <span id={id('pass-title')} className={S.optionTitle}>
                {t('v2.addForm.passwordTitle')}{' '}
                <span className={S.optional}>{t('stepPreview.optionalSuffix')}</span>
              </span>
              <span id={id('pass-desc')} className={S.optionDesc}>{t('v2.addForm.passwordDesc')}</span>
            </span>
            <input
              type='checkbox'
              role='switch'
              className={ctl.switch}
              checked={usePassword}
              disabled={isSubmitting}
              aria-labelledby={id('pass-title')}
              aria-describedby={id('pass-desc')}
              aria-expanded={usePassword ? 'true' : 'false'}
              aria-controls={id('pass-field')}
              onChange={togglePassword}
            />
          </label>

          <div
            id={id('pass-field')}
            className={`${S.collapse} ${usePassword ? S.expanded : ''}`}
            inert={!usePassword}
          >
            <div className={S.collapseInner}>
              <div className={S.collapseBody}>
                <div className={field.arc}>
                  <div className={field.control}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={field.input}
                      ref={passwordRef}
                      placeholder={t('addForm.passwordPlaceholder')}
                      aria-label={t('content.password')}
                      autoComplete='new-password'
                      value={password}
                      readOnly={isSubmitting}
                      aria-invalid={errors.password ? 'true' : undefined}
                      aria-describedby={errors.password ? id('password-error') : undefined}
                      onInput={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type='button'
                      className={field.adornment}
                      disabled={isSubmitting}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={t('common.togglePasswordVisibility')}
                      aria-pressed={showPassword ? 'true' : 'false'}
                    >
                      {showPassword ? <EyeOffIcon aria-hidden='true' /> : <EyeIcon aria-hidden='true' />}
                    </button>
                  </div>
                </div>
                <FieldMessage id={id('password-error')} open={Boolean(errors.password)} attempt={attempt}>
                  {errors.password}
                </FieldMessage>
              </div>
            </div>
          </div>
        </WindowSection>
      </WindowCard>

      <WindowFooter className={S.footer}>
        <button
          ref={ctaRef}
          type='submit'
          className={`${btn.cta} ${btn.ctaBig} ${S.cta}`}
          onPointerEnter={(e) => e.pointerType === 'mouse' && runArcsLight('cta')}
          aria-busy={isSubmitting ? 'true' : undefined}
          aria-disabled={isSubmitting || blocked ? 'true' : undefined}
          aria-describedby={ctaDescribedBy}
        >
          {isSubmitting ? t('addForm.submitting') : t('v2.addForm.submit')}
        </button>

        <p className={S.legal}>
          {beforeTerms}
          <PrefetchLink href='/terms-of-use' className={`${lnk.link} ${lnk.linkAccent}`}>{terms}</PrefetchLink>
          {betweenLinks}
          <PrefetchLink href='/privacy-policy' className={`${lnk.link} ${lnk.linkAccent}`}>{privacy}</PrefetchLink>
          {afterPrivacy}
        </p>
      </WindowFooter>
    </form>
  );
}
