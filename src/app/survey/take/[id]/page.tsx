// Survey Take Page - Minimal version while debugging build hang
export default async function SurveyTakePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Survey Loading...</h1>
            <p>Survey ID: {id}</p>
            <p>Build test successful - SurveyRenderer causes hang</p>
        </div>
    );
}
