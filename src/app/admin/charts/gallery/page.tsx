'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    SankeyChart,
    BeeSwarmChart,
    LineChart,
    ScatterChart,
    HeatmapChart,
    BoxPlotChart,
    ViolinChart,
    HistogramChart,
    BarChart,
    PieChart,
    RadarChart,
    FunnelChart
} from '@/components/survey/analytics/charts';

// Sample data generators
const sampleData = {
    // Bar chart data - Survey response counts
    barData: [
        { label: 'Strongly Agree', value: 145 },
        { label: 'Agree', value: 234 },
        { label: 'Neutral', value: 89 },
        { label: 'Disagree', value: 56 },
        { label: 'Strongly Disagree', value: 23 }
    ],

    // Grouped bar data - Response by demographic
    groupedBarData: [
        { label: '18-24', value: 45, group: 'Male' },
        { label: '18-24', value: 52, group: 'Female' },
        { label: '25-34', value: 78, group: 'Male' },
        { label: '25-34', value: 85, group: 'Female' },
        { label: '35-44', value: 62, group: 'Male' },
        { label: '35-44', value: 58, group: 'Female' },
        { label: '45-54', value: 41, group: 'Male' },
        { label: '45-54', value: 47, group: 'Female' },
        { label: '55+', value: 28, group: 'Male' },
        { label: '55+', value: 35, group: 'Female' }
    ],

    // Pie/donut data - Market share
    pieData: [
        { label: 'Product A', value: 35 },
        { label: 'Product B', value: 28 },
        { label: 'Product C', value: 18 },
        { label: 'Product D', value: 12 },
        { label: 'Other', value: 7 }
    ],

    // Line chart data - Trends over time
    lineData: [
        {
            name: 'Satisfaction Score',
            data: [
                { label: 'Jan', value: 72 }, { label: 'Feb', value: 75 }, { label: 'Mar', value: 71 }, { label: 'Apr', value: 78 },
                { label: 'May', value: 82 }, { label: 'Jun', value: 79 }, { label: 'Jul', value: 85 }, { label: 'Aug', value: 88 },
                { label: 'Sep', value: 84 }, { label: 'Oct', value: 90 }, { label: 'Nov', value: 92 }, { label: 'Dec', value: 95 }
            ]
        },
        {
            name: 'NPS Score',
            data: [
                { label: 'Jan', value: 45 }, { label: 'Feb', value: 48 }, { label: 'Mar', value: 52 }, { label: 'Apr', value: 55 },
                { label: 'May', value: 58 }, { label: 'Jun', value: 54 }, { label: 'Jul', value: 62 }, { label: 'Aug', value: 65 },
                { label: 'Sep', value: 68 }, { label: 'Oct', value: 72 }, { label: 'Nov', value: 75 }, { label: 'Dec', value: 78 }
            ]
        }
    ],

    // Scatter data - Correlation
    scatterData: Array.from({ length: 50 }, (_, i) => {
        const x = Math.random() * 100;
        const noise = (Math.random() - 0.5) * 30;
        const y = x * 0.7 + 20 + noise;
        return {
            x,
            y,
            label: `Respondent ${i + 1}`,
            value: y, // Required by ChartDataPoint
            size: Math.random() * 20 + 5
        };
    }),

    // Histogram data - Age distribution
    histogramData: Array.from({ length: 200 }, () =>
        Math.floor(Math.random() * 50 + 20 + (Math.random() > 0.5 ? 10 : -5))
    ),

    // Box plot data - Score distributions by group
    boxPlotData: [
        { label: 'Control', values: Array.from({ length: 30 }, () => Math.random() * 30 + 50) },
        { label: 'Treatment A', values: Array.from({ length: 30 }, () => Math.random() * 25 + 60) },
        { label: 'Treatment B', values: Array.from({ length: 30 }, () => Math.random() * 35 + 55) },
        { label: 'Treatment C', values: Array.from({ length: 30 }, () => Math.random() * 20 + 70) }
    ],

    // Violin data - Distribution comparison
    violinData: [
        { label: 'Morning', values: Array.from({ length: 100 }, () => Math.random() * 40 + 30 + (Math.random() > 0.7 ? 20 : 0)) },
        { label: 'Afternoon', values: Array.from({ length: 100 }, () => Math.random() * 35 + 45) },
        { label: 'Evening', values: Array.from({ length: 100 }, () => Math.random() * 45 + 25 + (Math.random() > 0.6 ? 15 : 0)) }
    ],

    // Bee swarm data
    beeSwarmData: [
        ...Array.from({ length: 25 }, (_, i) => ({ label: `Respondent ${i + 1}`, value: Math.random() * 15 + 85, group: 'Very Satisfied' })),
        ...Array.from({ length: 40 }, (_, i) => ({ label: `Respondent ${i + 26}`, value: Math.random() * 20 + 65, group: 'Satisfied' })),
        ...Array.from({ length: 20 }, (_, i) => ({ label: `Respondent ${i + 66}`, value: Math.random() * 20 + 45, group: 'Neutral' })),
        ...Array.from({ length: 12 }, (_, i) => ({ label: `Respondent ${i + 86}`, value: Math.random() * 20 + 25, group: 'Dissatisfied' })),
        ...Array.from({ length: 8 }, (_, i) => ({ label: `Respondent ${i + 98}`, value: Math.random() * 15 + 10, group: 'Very Dissatisfied' }))
    ],

    // Heatmap data - Cross-tabulation
    heatmapData: (() => {
        const rows = ['18-24', '25-34', '35-44', '45-54', '55+'];
        const cols = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
        const data: { row: string; col: string; value: number }[] = [];

        for (const row of rows) {
            for (const col of cols) {
                data.push({
                    row,
                    col,
                    value: Math.floor(Math.random() * 100)
                });
            }
        }
        return data;
    })(),

    // Sankey data - User journey
    sankeyData: {
        nodes: [
            { id: 'home', label: 'Homepage', column: 0 },
            { id: 'products', label: 'Products', column: 1 },
            { id: 'about', label: 'About Us', column: 1 },
            { id: 'blog', label: 'Blog', column: 1 },
            { id: 'cart', label: 'Cart', column: 2 },
            { id: 'checkout', label: 'Checkout', column: 2 },
            { id: 'contact', label: 'Contact', column: 2 },
            { id: 'purchase', label: 'Purchase', column: 3 },
            { id: 'exit', label: 'Exit', column: 3 }
        ],
        links: [
            { source: 'home', target: 'products', value: 450 },
            { source: 'home', target: 'about', value: 120 },
            { source: 'home', target: 'blog', value: 80 },
            { source: 'products', target: 'cart', value: 280 },
            { source: 'products', target: 'exit', value: 170 },
            { source: 'about', target: 'contact', value: 60 },
            { source: 'about', target: 'exit', value: 60 },
            { source: 'blog', target: 'products', value: 40 },
            { source: 'blog', target: 'exit', value: 40 },
            { source: 'cart', target: 'checkout', value: 200 },
            { source: 'cart', target: 'exit', value: 80 },
            { source: 'checkout', target: 'purchase', value: 160 },
            { source: 'checkout', target: 'exit', value: 40 },
            { source: 'contact', target: 'exit', value: 60 }
        ]
    },

    // Radar data - Multi-dimensional comparison
    radarData: [
        {
            label: 'Product A',
            data: [
                { axis: 'Price', value: 85 },
                { axis: 'Quality', value: 72 },
                { axis: 'Support', value: 68 },
                { axis: 'Features', value: 90 },
                { axis: 'Ease of Use', value: 78 },
                { axis: 'Performance', value: 82 }
            ]
        },
        {
            label: 'Product B',
            data: [
                { axis: 'Price', value: 65 },
                { axis: 'Quality', value: 88 },
                { axis: 'Support', value: 92 },
                { axis: 'Features', value: 75 },
                { axis: 'Ease of Use', value: 85 },
                { axis: 'Performance', value: 70 }
            ]
        }
    ],

    // Funnel data - Conversion funnel
    funnelData: [
        { label: 'Visitors', value: 10000 },
        { label: 'Sign-ups', value: 4500 },
        { label: 'Activated', value: 2800 },
        { label: 'Subscribed', value: 1200 },
        { label: 'Retained', value: 850 }
    ]
};

type ChartCategory = 'distribution' | 'comparison' | 'correlation' | 'flow' | 'composition';

interface ChartDemo {
    id: string;
    name: string;
    description: string;
    category: ChartCategory;
    component: React.ReactNode;
    useCases: string[];
}

export default function ChartGalleryPage() {
    const [activeCategory, setActiveCategory] = useState<ChartCategory | 'all'>('all');
    const [selectedChart, setSelectedChart] = useState<string | null>(null);

    const categories: { id: ChartCategory | 'all'; label: string; description: string }[] = [
        { id: 'all', label: 'All Charts', description: 'View all available chart types' },
        { id: 'distribution', label: 'Distribution', description: 'Show data spread and frequency' },
        { id: 'comparison', label: 'Comparison', description: 'Compare values across categories' },
        { id: 'correlation', label: 'Correlation', description: 'Show relationships between variables' },
        { id: 'flow', label: 'Flow', description: 'Visualize journeys and transitions' },
        { id: 'composition', label: 'Composition', description: 'Show parts of a whole' }
    ];

    const charts: ChartDemo[] = [
        {
            id: 'bar',
            name: 'Bar Chart',
            description: 'Compare categorical data with vertical bars. Great for showing response distributions.',
            category: 'comparison',
            component: <BarChart data={sampleData.barData} config={{ width: 500, height: 300, title: 'Survey Responses' }} showValues />,
            useCases: ['Response counts', 'Category comparisons', 'Frequency data']
        },
        {
            id: 'horizontal-bar',
            name: 'Horizontal Bar Chart',
            description: 'Better for long category names and many categories.',
            category: 'comparison',
            component: <BarChart data={sampleData.barData} config={{ width: 500, height: 300, title: 'Survey Responses' }} horizontal showValues />,
            useCases: ['Rankings', 'Long labels', 'Many categories']
        },
        {
            id: 'grouped-bar',
            name: 'Grouped Bar Chart',
            description: 'Compare multiple series side by side within categories.',
            category: 'comparison',
            component: <BarChart data={sampleData.groupedBarData} config={{ width: 600, height: 350, title: 'Responses by Age & Gender' }} grouped />,
            useCases: ['Demographic breakdowns', 'Time period comparisons', 'A/B test results']
        },
        {
            id: 'stacked-bar',
            name: 'Stacked Bar Chart',
            description: 'Show composition within categories while comparing totals.',
            category: 'composition',
            component: <BarChart data={sampleData.groupedBarData} config={{ width: 600, height: 350, title: 'Responses by Age & Gender' }} stacked />,
            useCases: ['Part-to-whole comparisons', 'Cumulative data', 'Composition over categories']
        },
        {
            id: 'pie',
            name: 'Pie Chart',
            description: 'Show proportions of a whole. Best with 5 or fewer categories.',
            category: 'composition',
            component: <PieChart data={sampleData.pieData} config={{ width: 450, height: 350, title: 'Market Share' }} />,
            useCases: ['Market share', 'Budget allocation', 'Survey response ratios']
        },
        {
            id: 'donut',
            name: 'Donut Chart',
            description: 'Like a pie chart but with a center hole for additional info.',
            category: 'composition',
            component: <PieChart data={sampleData.pieData} config={{ width: 450, height: 350, title: 'Market Share' }} donut />,
            useCases: ['KPI displays', 'Progress indicators', 'Clean composition views']
        },
        {
            id: 'line',
            name: 'Line Chart',
            description: 'Show trends over time with smooth curves.',
            category: 'correlation',
            component: <LineChart series={sampleData.lineData} config={{ width: 600, height: 350, title: 'Satisfaction Trends', xAxisLabel: 'Month', yAxisLabel: 'Score' }} />,
            useCases: ['Time series', 'Trend analysis', 'Performance over time']
        },
        {
            id: 'scatter',
            name: 'Scatter Chart',
            description: 'Show correlation between two numeric variables.',
            category: 'correlation',
            component: <ScatterChart data={sampleData.scatterData} config={{ width: 550, height: 400, title: 'Engagement vs Satisfaction' }} showTrendLine showCorrelation />,
            useCases: ['Correlation analysis', 'Outlier detection', 'Regression visualization']
        },
        {
            id: 'bubble',
            name: 'Bubble Chart',
            description: 'Like scatter but with a third dimension shown as bubble size.',
            category: 'correlation',
            component: <ScatterChart data={sampleData.scatterData} config={{ width: 550, height: 400, title: 'Multi-dimensional Analysis' }} />,
            useCases: ['3-variable analysis', 'Portfolio views', 'Weighted relationships']
        },
        {
            id: 'histogram',
            name: 'Histogram',
            description: 'Show distribution of continuous numeric data.',
            category: 'distribution',
            component: <HistogramChart data={sampleData.histogramData} config={{ width: 550, height: 350, title: 'Age Distribution', xAxisLabel: 'Age', yAxisLabel: 'Count' }} showMean showMedian />,
            useCases: ['Age distribution', 'Score distributions', 'Response time analysis']
        },
        {
            id: 'box-plot',
            name: 'Box Plot',
            description: 'Show distribution summary: median, quartiles, and outliers.',
            category: 'distribution',
            component: <BoxPlotChart data={sampleData.boxPlotData} config={{ width: 550, height: 350, title: 'Score Distribution by Group' }} showMean showOutliers />,
            useCases: ['Group comparisons', 'Outlier identification', 'Distribution summaries']
        },
        {
            id: 'violin',
            name: 'Violin Chart',
            description: 'Combine box plot with density estimation for richer distribution view.',
            category: 'distribution',
            component: <ViolinChart data={sampleData.violinData} config={{ width: 550, height: 350, title: 'Response Time by Period' }} showBoxPlot showMedian />,
            useCases: ['Bimodal distributions', 'Detailed comparisons', 'Research presentations']
        },
        {
            id: 'bee-swarm',
            name: 'Bee Swarm Chart',
            description: 'Show every individual data point while revealing distribution.',
            category: 'distribution',
            component: <BeeSwarmChart data={sampleData.beeSwarmData} config={{ width: 600, height: 350, title: 'Individual Satisfaction Scores' }} />,
            useCases: ['Small datasets', 'Individual visibility', 'Pattern discovery']
        },
        {
            id: 'heatmap',
            name: 'Heatmap',
            description: 'Show patterns in matrix data using color intensity.',
            category: 'correlation',
            component: <HeatmapChart data={sampleData.heatmapData} config={{ width: 550, height: 400, title: 'Response Intensity by Age & Satisfaction' }} colorScale="sequential" />,
            useCases: ['Cross-tabulation', 'Correlation matrices', 'Time-based patterns']
        },
        {
            id: 'sankey',
            name: 'Sankey Diagram',
            description: 'Visualize flow and transitions between stages.',
            category: 'flow',
            component: <SankeyChart data={sampleData.sankeyData} config={{ width: 700, height: 450, title: 'User Journey Flow' }} />,
            useCases: ['User journeys', 'Conversion funnels', 'Resource flows']
        },
        {
            id: 'radar',
            name: 'Radar Chart',
            description: 'Compare multiple variables across different categories.',
            category: 'comparison',
            component: <RadarChart series={sampleData.radarData} config={{ width: 500, height: 450, title: 'Product Comparison' }} maxValue={100} />,
            useCases: ['Product comparisons', 'Skill assessments', 'Multi-criteria evaluation']
        },
        {
            id: 'funnel',
            name: 'Funnel Chart',
            description: 'Show progressive reduction through stages.',
            category: 'flow',
            component: <FunnelChart data={sampleData.funnelData} config={{ width: 500, height: 400, title: 'Conversion Funnel' }} showPercentages showConversion />,
            useCases: ['Sales funnels', 'Conversion analysis', 'Drop-off visualization']
        }
    ];

    const filteredCharts = activeCategory === 'all'
        ? charts
        : charts.filter(c => c.category === activeCategory);

    const selectedChartData = selectedChart ? charts.find(c => c.id === selectedChart) : null;

    return (
        <div className="chart-gallery">
            <header className="gallery-header">
                <div className="header-content">
                    <Link href="/admin" className="back-link">← Back to Admin</Link>
                    <h1>Chart Gallery</h1>
                    <p className="subtitle">
                        Explore our comprehensive visualization library. Each chart is designed for
                        survey analytics and data storytelling.
                    </p>
                </div>
            </header>

            <nav className="category-nav">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        <span className="cat-label">{cat.label}</span>
                        <span className="cat-count">
                            {cat.id === 'all' ? charts.length : charts.filter(c => c.category === cat.id).length}
                        </span>
                    </button>
                ))}
            </nav>

            <div className="gallery-grid">
                {filteredCharts.map(chart => (
                    <div
                        key={chart.id}
                        className={`chart-card ${selectedChart === chart.id ? 'selected' : ''}`}
                        onClick={() => setSelectedChart(selectedChart === chart.id ? null : chart.id)}
                    >
                        <div className="chart-preview">
                            {chart.component}
                        </div>
                        <div className="chart-info">
                            <h3>{chart.name}</h3>
                            <p>{chart.description}</p>
                            <div className="use-cases">
                                {chart.useCases.map((uc, i) => (
                                    <span key={i} className="use-case-tag">{uc}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedChartData && (
                <div className="chart-detail-modal" onClick={() => setSelectedChart(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedChart(null)}>×</button>
                        <h2>{selectedChartData.name}</h2>
                        <p className="modal-description">{selectedChartData.description}</p>

                        <div className="modal-chart">
                            {selectedChartData.component}
                        </div>

                        <div className="modal-section">
                            <h4>Best Used For</h4>
                            <ul>
                                {selectedChartData.useCases.map((uc, i) => (
                                    <li key={i}>{uc}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="modal-actions">
                            <Link href="/admin/surveys" className="btn-primary">
                                Use in Survey Analytics
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .chart-gallery {
                    min-height: 100vh;
                    background: #f5f3ef;
                }

                .gallery-header {
                    background: linear-gradient(135deg, #1a1d24 0%, #2d3748 100%);
                    color: white;
                    padding: 3rem 2rem;
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .back-link {
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    font-size: 0.875rem;
                    display: inline-block;
                    margin-bottom: 1rem;
                    transition: color 0.15s;
                }

                .back-link:hover {
                    color: white;
                }

                .gallery-header h1 {
                    font-size: 2.5rem;
                    font-family: 'Libre Baskerville', serif;
                    margin: 0 0 0.75rem 0;
                }

                .subtitle {
                    font-size: 1.1rem;
                    opacity: 0.85;
                    max-width: 600px;
                    line-height: 1.6;
                    margin: 0;
                }

                .category-nav {
                    display: flex;
                    gap: 0.5rem;
                    padding: 1.5rem 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .category-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: white;
                    border: 1px solid #e0ddd8;
                    border-radius: 24px;
                    cursor: pointer;
                    transition: all 0.15s;
                    white-space: nowrap;
                }

                .category-btn:hover {
                    border-color: #c94a4a;
                }

                .category-btn.active {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                .cat-label {
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .cat-count {
                    background: rgba(0,0,0,0.1);
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }

                .category-btn.active .cat-count {
                    background: rgba(255,255,255,0.2);
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
                    gap: 2rem;
                    padding: 1rem 2rem 3rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .chart-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .chart-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                    transform: translateY(-2px);
                }

                .chart-card.selected {
                    box-shadow: 0 0 0 3px #c94a4a;
                }

                .chart-preview {
                    padding: 1.5rem;
                    background: #fafaf8;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 350px;
                    overflow: hidden;
                }

                .chart-info {
                    padding: 1.5rem;
                }

                .chart-info h3 {
                    font-size: 1.25rem;
                    margin: 0 0 0.5rem 0;
                    color: #1a1d24;
                }

                .chart-info p {
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin: 0 0 1rem 0;
                }

                .use-cases {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .use-case-tag {
                    background: #f0ede8;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: #555;
                }

                .chart-detail-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 2rem;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    padding: 2rem;
                    position: relative;
                }

                .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: #f0ede8;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    transition: all 0.15s;
                }

                .close-btn:hover {
                    background: #e0ddd8;
                    color: #333;
                }

                .modal-content h2 {
                    font-size: 1.75rem;
                    margin: 0 0 0.5rem 0;
                    color: #1a1d24;
                    font-family: 'Libre Baskerville', serif;
                }

                .modal-description {
                    color: #666;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin: 0 0 2rem 0;
                }

                .modal-chart {
                    background: #fafaf8;
                    border-radius: 8px;
                    padding: 2rem;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }

                .modal-section {
                    margin-bottom: 1.5rem;
                }

                .modal-section h4 {
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #999;
                    margin: 0 0 0.75rem 0;
                }

                .modal-section ul {
                    margin: 0;
                    padding-left: 1.25rem;
                }

                .modal-section li {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0ddd8;
                }

                .btn-primary {
                    display: inline-block;
                    padding: 0.75rem 1.5rem;
                    background: #c94a4a;
                    color: white;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background 0.15s;
                }

                .btn-primary:hover {
                    background: #b03a3a;
                }

                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: 1fr;
                    }

                    .gallery-header h1 {
                        font-size: 1.75rem;
                    }
                }
            `}</style>
        </div>
    );
}
