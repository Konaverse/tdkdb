'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import { TextButton } from '@/components/ui/Button';

interface ProjectInterestFormProps {
  projectSlug: string;
  projectName: string;
}

export default function ProjectInterestForm({ projectSlug, projectName }: ProjectInterestFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      unitPreference: (form.elements.namedItem('unitPreference') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      projectSlug,
      projectName,
      _honeypot: (form.elements.namedItem('_honeypot') as HTMLInputElement).value,
    };

    try {
      const res = await fetch('/api/project-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        // GA4 event
        if (typeof window !== 'undefined') {
          (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'project_interest_submit', {
            project_slug: projectSlug,
            unit_preference: data.unitPreference,
          });
        }
      } else {
        setStatus('error');
        setErrorMsg(json.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <div className="flex flex-col items-start gap-4 py-8">
              <div className="h-px w-8 bg-threshold" />
              <p className="text-heading text-paper">INTEREST REGISTERED</p>
              <p className="text-body-lg text-stone">
                Thank you for your interest in {projectName}. We will be in touch shortly.
              </p>
            </div>
          </FadeUp>
        </GridWrapper>
      </Section>
    );
  }

  return (
    <Section background="surface">
      <GridWrapper>
        <FadeUp>
          <p className="text-label mb-8 text-stone">REGISTER YOUR INTEREST</p>
        </FadeUp>
        <FadeUp delay={100}>
          <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6" noValidate>
            {/* Honeypot — hidden from users */}
            <input type="text" name="_honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="interest-name" className="text-label text-stone">
                  FULL NAME *
                </label>
                <input
                  id="interest-name"
                  name="name"
                  type="text"
                  required
                  className="border-b border-border bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="interest-email" className="text-label text-stone">
                  EMAIL *
                </label>
                <input
                  id="interest-email"
                  name="email"
                  type="email"
                  required
                  className="border-b border-border bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="interest-phone" className="text-label text-stone">
                  PHONE
                </label>
                <input
                  id="interest-phone"
                  name="phone"
                  type="tel"
                  className="border-b border-border bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="interest-unit" className="text-label text-stone">
                  UNIT PREFERENCE
                </label>
                <input
                  id="interest-unit"
                  name="unitPreference"
                  type="text"
                  placeholder="e.g. 2-bedroom, ground floor"
                  className="border-b border-border bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth placeholder:text-stone/50 focus:border-threshold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="interest-message" className="text-label text-stone">
                MESSAGE
              </label>
              <textarea
                id="interest-message"
                name="message"
                rows={4}
                className="resize-none border-b border-border bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold"
              />
            </div>

            {status === 'error' && (
              <p className="text-body text-threshold">{errorMsg}</p>
            )}

            <TextButton>
              {status === 'submitting' ? 'SENDING...' : 'REGISTER INTEREST →'}
            </TextButton>
          </form>
        </FadeUp>
      </GridWrapper>
    </Section>
  );
}
