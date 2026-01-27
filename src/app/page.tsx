import { redirect } from 'next/navigation';

/**
 * Temporary redirect to /join while main landing page is being reviewed by legal.
 * 
 * The 501(c)(3) compliant marketing page is saved in page.tsx.bak-marketing.
 * 
 * To restore the marketing page:
 * 1. Delete this file
 * 2. Rename page.tsx.bak-marketing back to page.tsx
 */
export default function Home() {
    redirect('/join');
}
