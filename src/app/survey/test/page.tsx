// Simple test page for debugging - testing CSS imports
import '@/app/survey.css';
import '@/app/survey-mobile.css';

export default async function TestPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Test Page - With CSS Imports</h1>
            <p>CSS loaded successfully</p>
        </div>
    );
}
