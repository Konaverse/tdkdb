This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Typography uses the committed Josefin Sans variable font in `src/app/fonts/`,
loaded through `next/font/local`. Production builds need no Google Fonts download.
The font's SIL Open Font License is bundled alongside it.

Forms send through Resend using server-side environment variables. Configure
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_FORM_TO_EMAIL`, and
`INTEREST_FORM_TO_EMAIL` in Vercel's **Production** environment, then redeploy.
The sender must use a domain verified in the same Resend account as the API key,
and a domain-restricted key must permit that sender domain.
Server errors and warnings remain in production logs. A `Resend notification
rejected:` entry includes the provider's error name, status and message; API keys
and enquiry bodies are never logged.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
