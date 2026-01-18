import { redirect } from 'next/navigation';

export default async function JoinPage({ params, searchParams }: { params: Promise<{ sessionCode: string }>, searchParams: Promise<{ p?: string }> }) {
    const { sessionCode } = await params;
    const { p } = await searchParams;
    const pQuery = p ? `&p=${p}` : '';
    redirect(`/?session=${sessionCode}${pQuery}`);
}
