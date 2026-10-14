import CookieSettingsButton from '@/components/consent/CookieSettingsButton';
import type { SiteSettings } from '@/lib/sanity/types';

/* The privacy and cookie policy. Plain statements of what the site does
   today: the enquiry forms, where they go, the consent cookie, and Meta's
   Pixel and Conversions API. Contact details come from Site Settings. */

const H2 = 'mt-[9svh] text-[clamp(26px,2.6vw,40px)] font-[200] leading-[1.15] tracking-[-0.01em]';
const P = 'mt-5 max-w-[66ch] text-[clamp(16px,1.15vw,19px)] font-[300] leading-[1.55]';
const UL = `${P} list-disc space-y-2 pl-6`;
const LINK =
  'underline decoration-[#111111]/30 underline-offset-4 transition-colors duration-300 hover:text-threshold';

const UPDATED = '14 October 2026';

export default function PrivacyPolicy({ settings }: { settings: SiteSettings | null }) {
  const email = settings?.email;
  const address = settings?.address;

  return (
    <main style={{ background: '#ffffff', color: '#111111' }}>
      <section
        data-nav="light"
        className="px-page pb-[18svh] pt-[24svh]"
        style={{ fontFamily: 'var(--font-josefin)' }}
      >
        <h1 className="text-[clamp(40px,6.4vw,96px)] font-[200] leading-[1] tracking-[-0.015em]">
          Privacy and cookies
        </h1>
        <p className={`${P} text-[#111111]/60`}>Last updated {UPDATED}.</p>
        <p className={P}>
          TDK Design &amp; Build{address ? `, ${address}` : ''}, is the controller of the personal
          data described here. This page explains what the website collects, why, who receives it,
          and the choices you have.
          {email && (
            <>
              {' '}
              Questions go to{' '}
              <a href={`mailto:${email}`} className={LINK}>
                {email}
              </a>
              .
            </>
          )}
        </p>

        <h2 id="what-we-collect" className={H2}>
          What we collect
        </h2>
        <ul className={UL}>
          <li>
            <strong className="font-[500]">Enquiry forms.</strong> Your name, email address, the
            phone number and message you choose to give, and the residence or service you are asking
            about.
          </li>
          <li>
            <strong className="font-[500]">Technical details with an enquiry.</strong> The page you
            sent it from, your IP address and browser identifier, and any campaign parameters in the
            link that brought you here (for example utm tags or a Meta click identifier), so we know
            which advertising led to the enquiry.
          </li>
          <li>
            <strong className="font-[500]">Cookies.</strong> Only those described under Cookies
            below. The site has no accounts and no other analytics.
          </li>
        </ul>

        <h2 id="why" className={H2}>
          Why we use it
        </h2>
        <ul className={UL}>
          <li>
            To answer your enquiry and, where you ask for it, send plans, prices and availability.
          </li>
          <li>To keep a record of enquiries so the studio can follow up.</li>
          <li>
            With your consent only, to measure whether our advertising on Meta platforms leads to
            enquiries.
          </li>
        </ul>
        <p className={P}>
          Replying to an enquiry rests on the steps you ask us to take before any agreement; keeping
          records rests on our legitimate interest in running the studio; advertising measurement
          rests on your consent.
        </p>

        <h2 id="who-receives" className={H2}>
          Who receives it
        </h2>
        <ul className={UL}>
          <li>
            <strong className="font-[500]">Resend</strong> delivers your enquiry to the studio by
            email and sends you an acknowledgement.
          </li>
          <li>
            <strong className="font-[500]">Sanity</strong> hosts the website content and holds a
            private copy of each enquiry.
          </li>
          <li>
            <strong className="font-[500]">Brevo</strong> is the studio&rsquo;s customer
            relationship system, where enquiries are followed up. It does not send you marketing
            unless you separately agree to it.
          </li>
          <li>
            <strong className="font-[500]">Vercel</strong> hosts the website and processes requests,
            including IP addresses, to serve it.
          </li>
          <li>
            <strong className="font-[500]">Meta Platforms</strong>, as described below, and only
            with your consent.
          </li>
        </ul>
        <p className={P}>We do not sell personal data.</p>

        <h2 id="cookies" className={H2}>
          Cookies, Meta Pixel and the Conversions API
        </h2>
        <p className={P}>
          Without your consent the site sets one cookie, <code>tdk_consent</code>, which only
          records your choice and lasts six months. Nothing else is set and no data goes to Meta.
        </p>
        <p className={P}>
          If you accept, we load the <strong className="font-[500]">Meta Pixel</strong> from Meta
          Platforms Ireland Limited. It sets the <code>_fbp</code> and <code>_fbc</code> cookies (up
          to 90 days) and reports to Meta which pages you view, when you open the Almond Suites
          page, when you tap a phone link, and when you send an enquiry. Page events carry no
          personal details.
        </p>
        <p className={P}>
          When you send an enquiry with consent given, our server also reports that one enquiry to
          Meta through the <strong className="font-[500]">Conversions API</strong>, so that the
          measurement works even where the browser blocks the Pixel. That report contains the time
          and page of the enquiry, your IP address and browser identifier, the Pixel cookies, and
          your email address, phone number, first and last name and country. These five values are
          converted to a SHA-256 hash before they leave our server; Meta uses them only to match the
          enquiry to an advertising click and discards values it cannot match. Browser and server
          reports share an identifier so the enquiry is counted once.
        </p>
        <p className={P}>
          The purpose is to measure and improve our advertising. Meta also processes this data under
          its own{' '}
          <a
            href="https://www.facebook.com/privacy/policy/"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            privacy policy
          </a>
          .
        </p>
        <p className={P}>
          <strong className="font-[500]">Withdrawing consent.</strong> Open{' '}
          <CookieSettingsButton className={LINK}>Cookie settings</CookieSettingsButton> here or in
          the footer and choose Reject. The Pixel stops immediately, its cookies are removed, and
          later enquiries are not reported to Meta. Withdrawal does not affect what was already
          sent.
        </p>

        <h2 id="retention" className={H2}>
          How long we keep it
        </h2>
        <p className={P}>
          Enquiries are kept while the conversation is live and for as long as the studio needs to
          evidence it afterwards, after which they are deleted. You can ask for deletion earlier.
        </p>

        <h2 id="rights" className={H2}>
          Your rights
        </h2>
        <p className={P}>
          Under the GDPR you can ask for access to, correction or deletion of your data, object to
          or restrict its use, receive a copy of what you gave us, and withdraw consent at any time.
          {email && (
            <>
              {' '}
              Write to{' '}
              <a href={`mailto:${email}`} className={LINK}>
                {email}
              </a>
              .
            </>
          )}{' '}
          You may also complain to the Commissioner for Personal Data Protection in Cyprus.
        </p>

        <h2 id="changes" className={H2}>
          Changes
        </h2>
        <p className={P}>
          We will update this page when the site changes what it collects, and the date above with
          it.
        </p>
      </section>
    </main>
  );
}
