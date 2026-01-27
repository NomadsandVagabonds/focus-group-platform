import { redirect } from 'next/navigation';

/**
 * Temporary redirect to /join while main landing page is being reviewed by legal.
 * 
 * To restore the original marketing page:
 * 1. Delete this file
 * 2. Rename page.tsx.bak-marketing back to page.tsx
 */
export default function Home() {
    redirect('/join');
}
