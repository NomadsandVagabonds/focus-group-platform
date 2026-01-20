// Debug page for dynamic route
export default async function DebugPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    console.log('[DebugPage] Starting');

    const { id } = await params;
    console.log('[DebugPage] ID:', id);

    const resolvedParams = await searchParams;
    console.log('[DebugPage] SearchParams:', resolvedParams);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Dynamic Debug Page</h1>
            <p>ID: {id}</p>
            <p>Preview: {String(resolvedParams.preview)}</p>
        </div>
    );
}
