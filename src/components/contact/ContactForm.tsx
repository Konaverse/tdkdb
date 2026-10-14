'use client';

import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import TDKSelect from '@/components/forms/TDKSelect';
import controls from '@/components/forms/FormControls.module.css';
import { submissionAttempt, type SubmissionAttempt } from '@/lib/contact/attribution';
import { LEAD_CATEGORIES } from '@/lib/meta/config';
import { trackMeta } from '@/lib/meta/pixel';

const TYPES = [
  { value: 'residence-enquiry', label: 'A residence' },
  { value: 'new-build', label: 'A new build' },
  { value: 'renovation', label: 'A renovation' },
  { value: 'interior-design', label: 'Interior design' },
  { value: 'consultation', label: 'A consultation' },
  { value: 'other', label: 'Something else' },
];

const FIELD = controls.control;
const LABEL = 'mb-2.5 block text-[14px] font-[400]';
type FieldErrors = Partial<Record<'name' | 'email' | 'projectType' | 'message', string>>;
type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Shared by the homepage and Contact page; both submit to the existing endpoint. */
export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const prefix = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const attemptRef = useRef<SubmissionAttempt | null>(null);
  const submittingRef = useRef(false);
  const id = (name: string) => `${prefix}-${name}`;
  const span = compact ? 'xl:col-span-2' : 'sm:col-span-2';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || status === 'sending') return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const field = (name: string) => String(fields.get(name) ?? '').trim();
    const data = {
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
      projectType: field('projectType'),
      message: field('message'),
      _honeypot: field('_honeypot'),
    };
    const next: FieldErrors = {};
    if (!data.name) next.name = 'Please tell us your name.';
    if (!data.email) next.email = 'Please leave an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      next.email = 'Please enter a valid email address.';
    if (!data.projectType) next.projectType = 'Please choose one.';
    if (!data.message) next.message = 'Please write us a line.';
    setErrors(next);
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    attemptRef.current = submissionAttempt(data, attemptRef.current);
    submittingRef.current = true;
    setStatus('sending');
    setServerError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          submissionId: attemptRef.current.submissionId,
          attribution: attemptRef.current.attribution,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        setStatus('sent');
        // Same event id and parameters as the server's Conversions API copy.
        trackMeta(
          'Lead',
          { content_category: LEAD_CATEGORIES.contact },
          attemptRef.current.submissionId,
        );
      } else {
        setStatus('error');
        setServerError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setServerError('We could not reach the server. Please try again.');
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <div aria-live="polite" className={controls.light}>
      {status === 'sent' ? (
        <div data-rise>
          <p className="text-[clamp(26px,2.3vw,42px)] font-[300] leading-[1.2]">
            Thank you — your message is with us.
          </p>
          <p className="mt-5 max-w-[42ch] text-[17px] font-[300] leading-[1.5] text-[#111111]/70">
            Someone from the studio will write back within a day or two.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Contact TDK"
          aria-busy={status === 'sending'}
          className={`gap-x-gutter grid gap-y-6 ${compact ? 'xl:grid-cols-2' : 'sm:grid-cols-2'}`}
        >
          <input
            type="text"
            name="_honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <Field id={id('name')} name="name" label="Name" error={errors.name} autoComplete="name" />
          <Field
            id={id('email')}
            name="email"
            type="email"
            label="Email"
            error={errors.email}
            autoComplete="email"
          />
          <Field
            id={id('phone')}
            name="phone"
            type="tel"
            label="Phone"
            optional
            autoComplete="tel"
          />
          <div data-rise>
            <label htmlFor={id('type')} className={LABEL}>
              What is it about?
            </label>
            <TDKSelect
              id={id('type')}
              name="projectType"
              label="What is it about?"
              placeholder="Choose one"
              options={TYPES}
              required
              invalid={!!errors.projectType}
              describedBy={errors.projectType ? id('type-note') : undefined}
            />
            {errors.projectType && <Note id={id('type-note')}>{errors.projectType}</Note>}
          </div>
          <div data-rise className={span}>
            <label htmlFor={id('message')} className={LABEL}>
              Message
            </label>
            <div className={controls.shell}>
              <textarea
                id={id('message')}
                name="message"
                rows={compact ? 4 : 6}
                maxLength={10000}
                required
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? id('message-note') : undefined}
                className={`${FIELD} resize-y`}
              />
            </div>
            {errors.message && <Note id={id('message-note')}>{errors.message}</Note>}
          </div>
          <div data-rise className={`${span} flex flex-col items-start gap-4`}>
            {status === 'error' && (
              <p role="alert" className="text-[15px] leading-[1.4] text-threshold">
                {serverError}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex min-h-12 items-center justify-center bg-[#111111] px-8 py-4 text-[13px] font-[600] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-threshold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-threshold disabled:opacity-60"
            >
              <span className="button-label">
                {status === 'sending' ? 'Sending' : 'Send message'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type = 'text',
  error,
  optional,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  error?: string;
  optional?: boolean;
  autoComplete?: string;
}) {
  return (
    <div data-rise>
      <label htmlFor={id} className={LABEL}>
        {label} {optional && <span className="text-[#111111]/50">(optional)</span>}
      </label>
      <div className={controls.shell}>
        <input
          id={id}
          name={name}
          type={type}
          maxLength={name === 'name' ? 200 : name === 'email' ? 320 : 80}
          required={!optional}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-note` : undefined}
          className={FIELD}
        />
      </div>
      {error && <Note id={`${id}-note`}>{error}</Note>}
    </div>
  );
}

function Note({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 text-[14px] leading-[1.4] text-threshold">
      {children}
    </p>
  );
}
