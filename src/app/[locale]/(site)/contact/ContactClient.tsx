'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import TextReveal from '@/components/animations/TextReveal';
import { TextButton } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const PROJECT_TYPES = [
  { value: '', label: 'Select project type' },
  { value: 'new-build', label: 'New Build' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'interior-design', label: 'Interior Design' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'other', label: 'Other' },
];

interface FieldError {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
}

function validate(data: {
  name: string;
  email: string;
  projectType: string;
  message: string;
}): FieldError {
  const errors: FieldError = {};
  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email address';
  if (!data.projectType) errors.projectType = 'Please select a project type';
  if (!data.message.trim()) errors.message = 'Message is required';
  return errors;
}

export default function ContactClient() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      projectType: (form.elements.namedItem('projectType') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      _honeypot: (form.elements.namedItem('_honeypot') as HTMLInputElement).value,
    };

    // Client-side validation
    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStatus('submitting');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setServerError(json.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setServerError('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <main className="bg-void text-paper">
        <Section>
          <GridWrapper>
            <FadeUp>
              <div className="flex min-h-[50vh] flex-col items-start justify-center gap-6 py-24">
                <div className="h-px w-8 bg-threshold" />
                <h2 className="text-heading text-paper">MESSAGE RECEIVED</h2>
                <p className="text-body-lg text-stone">
                  Thank you for getting in touch. We will respond within 1–2 business days.
                </p>
              </div>
            </FadeUp>
          </GridWrapper>
        </Section>
      </main>
    );
  }

  return (
    <main className="bg-void text-paper">
      {/* ── Hero ── */}
      <section className="flex min-h-[40vh] items-end pb-24 pt-40">
        <GridWrapper>
          <TextReveal tag="h1" className="text-display-lg max-w-2xl text-paper">
            LET&apos;S TALK.
          </TextReveal>
          <p className="mt-4 text-body-lg text-stone">
            Tell us about your project. We read every message.
          </p>
        </GridWrapper>
      </section>

      {/* ── Form + Info ── */}
      <Section>
        <GridWrapper>
          <div className="grid gap-24 lg:grid-cols-[1fr_360px]">
            {/* Form */}
            <FadeUp>
              <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
                {/* Honeypot */}
                <input
                  type="text"
                  name="_honeypot"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Name + Email */}
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-name" className="text-label text-stone">
                      NAME *
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      className={cn(
                        'border-b bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold',
                        fieldErrors.name ? 'border-threshold' : 'border-border',
                      )}
                    />
                    {fieldErrors.name && (
                      <p className="text-label text-threshold">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-email" className="text-label text-stone">
                      EMAIL *
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      className={cn(
                        'border-b bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold',
                        fieldErrors.email ? 'border-threshold' : 'border-border',
                      )}
                    />
                    {fieldErrors.email && (
                      <p className="text-label text-threshold">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Phone + Project Type */}
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-phone" className="text-label text-stone">
                      PHONE
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      className="border-b border-border bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-type" className="text-label text-stone">
                      PROJECT TYPE *
                    </label>
                    <select
                      id="contact-type"
                      name="projectType"
                      required
                      className={cn(
                        'border-b bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold',
                        fieldErrors.projectType ? 'border-threshold' : 'border-border',
                      )}
                    >
                      {PROJECT_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-void">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.projectType && (
                      <p className="text-label text-threshold">{fieldErrors.projectType}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-message" className="text-label text-stone">
                    MESSAGE *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    required
                    className={cn(
                      'resize-none border-b bg-transparent pb-2 text-body text-paper outline-none transition-colors duration-fast ease-smooth focus:border-threshold',
                      fieldErrors.message ? 'border-threshold' : 'border-border',
                    )}
                  />
                  {fieldErrors.message && (
                    <p className="text-label text-threshold">{fieldErrors.message}</p>
                  )}
                </div>

                {serverError && <p className="text-body text-threshold">{serverError}</p>}

                <div>
                  <TextButton>
                    {status === 'submitting' ? 'SENDING...' : 'SEND MESSAGE →'}
                  </TextButton>
                </div>
              </form>
            </FadeUp>

            {/* Contact Info */}
            <FadeUp delay={200}>
              <div className="flex flex-col gap-10">
                <div>
                  <p className="text-label mb-3 text-stone">OFFICE</p>
                  <p className="text-body text-paper">Nicosia, Cyprus</p>
                </div>
                <div>
                  <p className="text-label mb-3 text-stone">EMAIL</p>
                  <p className="text-body text-paper">info@tdkdb.com</p>
                </div>
                <div>
                  <p className="text-label mb-3 text-stone">PHONE</p>
                  <p className="text-body text-paper">+357 22 000 000</p>
                </div>
                <div>
                  <p className="text-label mb-3 text-stone">HOURS</p>
                  <p className="text-body text-stone">Monday – Friday</p>
                  <p className="text-body text-stone">9:00 – 18:00</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </GridWrapper>
      </Section>

      {/* ── Map ── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <div className="aspect-video w-full overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52354.53406897888!2d33.3218967!3d35.1856438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14de1767d9a77c23%3A0xacac28e97fb73c0!2sNicosia%2C%20Cyprus!5e0!3m2!1sen!2sus!4v1700000000000"
                title="TDK office location"
                className="h-full w-full"
                style={{ filter: 'grayscale(1) invert(0.9)' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </FadeUp>
        </GridWrapper>
      </Section>
    </main>
  );
}
