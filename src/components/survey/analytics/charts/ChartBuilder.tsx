'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChartType, ChartConfig, CHART_METADATA, COLOR_PALETTES, ChartDataPoint } from './types';
import { chartToSVG, svgToPNG, downloadFile, chartDataToCSV } from './utils';

// Import all chart components
import SankeyChart from './SankeyChart';
import BeeSwarmChart from './BeeSwarmChart';
import LineChart from './LineChart';
import ScatterChart from './ScatterChart';
import HeatmapChart from './HeatmapChart';
import BoxPlotChart from './BoxPlotChart';
import ViolinChart from './ViolinChart';
import HistogramChart from './HistogramChart';
import BarChart from './BarChart';
import PieChart from './PieChart';
import RadarChart from './RadarChart';
import FunnelChart from './FunnelChart';

interface Question {
    id: string;
    question_code: string;
    question_text: string;
    question_type: string;
    answer_options?: { id: string; option_text: string; option_value: string }[];
    subquestions?: { id: string; subquestion_text: string; subquestion_code: string }[];
}

interface QuestionGroup {
    id: string;
    title: string;
    questions: Question[];
}

interface ResponseData {
    question_id: string;
    answer_value: string;
    answer_text?: string;
}

interface ChartBuilderProps {
    surveyId: string;
    questionGroups: QuestionGroup[];
    responseData: ResponseData[];
    onSaveChart?: (chartConfig: SavedChartConfig) => void;
}

interface SavedChartConfig {
    chartType: ChartType;
    config: Partial<ChartConfig>;
    dataSelections: DataSelection[];
    title: string;
}

interface DataSelection {
    questionId: string;
    field: 'primary' | 'secondary' | 'tertiary' | 'size' | 'color';
    aggregation?: 'count' | 'sum' | 'average' | 'min' | 'max';
    filterValues?: string[];
}

export default function ChartBuilder({
    surveyId,
    questionGroups,
    responseData,
    onSaveChart
}: ChartBuilderProps) {
    const chartRef = useRef<HTMLDivElement>(null);

    // State
    const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');
    const [dataSelections, setDataSelections] = useState<DataSelection[]>([]);
    const [chartConfig, setChartConfig] = useState<Partial<ChartConfig>>({
        width: 700,
        height: 450,
        colorScheme: 'editorial',
        showGrid: true,
        animate: true
    });
    const [chartTitle, setChartTitle] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // Get flat list of all questions
    const allQuestions = useMemo(() => {
        return questionGroups.flatMap(group => group.questions);
    }, [questionGroups]);

    // Get chart metadata
    const chartMeta = CHART_METADATA[selectedChartType];

    // Process data based on selections
    const processedData = useMemo(() => {
        if (dataSelections.length === 0) return null;

        const primarySelection = dataSelections.find(s => s.field === 'primary');
        const secondarySelection = dataSelections.find(s => s.field === 'secondary');
        const tertiarySelection = dataSelections.find(s => s.field === 'tertiary');

        if (!primarySelection) return null;

        const primaryQuestion = allQuestions.find(q => q.id === primarySelection.questionId);
        if (!primaryQuestion) return null;

        // Get responses for primary question
        const primaryResponses = responseData.filter(r => r.question_id === primarySelection.questionId);

        // Apply filters
        const filteredResponses = primarySelection.filterValues?.length
            ? primaryResponses.filter(r => primarySelection.filterValues!.includes(r.answer_value))
            : primaryResponses;

        // Process based on chart type
        switch (selectedChartType) {
            case 'bar':
            case 'horizontal_bar':
            case 'pie':
            case 'donut':
            case 'funnel': {
                // Count responses by answer value
                const counts: Record<string, number> = {};
                for (const response of filteredResponses) {
                    const value = response.answer_text || response.answer_value;
                    counts[value] = (counts[value] || 0) + 1;
                }

                return Object.entries(counts).map(([label, value]) => ({
                    label,
                    value
                }));
            }

            case 'stacked_bar':
            case 'grouped_bar': {
                if (!secondarySelection) return null;

                // Cross-tabulate two questions
                const secondaryResponses = responseData.filter(r => r.question_id === secondarySelection.questionId);
                const counts: Record<string, Record<string, number>> = {};

                // Match responses by their position (assuming same respondent order)
                // In a real app, you'd match by response_id
                const primaryByIdx = new Map<number, string>();
                const secondaryByIdx = new Map<number, string>();

                filteredResponses.forEach((r, i) => primaryByIdx.set(i, r.answer_text || r.answer_value));
                secondaryResponses.forEach((r, i) => secondaryByIdx.set(i, r.answer_text || r.answer_value));

                for (let i = 0; i < Math.min(filteredResponses.length, secondaryResponses.length); i++) {
                    const pVal = primaryByIdx.get(i);
                    const sVal = secondaryByIdx.get(i);
                    if (pVal && sVal) {
                        if (!counts[pVal]) counts[pVal] = {};
                        counts[pVal][sVal] = (counts[pVal][sVal] || 0) + 1;
                    }
                }

                const result: ChartDataPoint[] = [];
                for (const [label, groupCounts] of Object.entries(counts)) {
                    for (const [group, value] of Object.entries(groupCounts)) {
                        result.push({ label, value, group });
                    }
                }
                return result;
            }

            case 'histogram':
            case 'box_plot':
            case 'violin':
            case 'bee_swarm': {
                // Numeric data
                const values = filteredResponses
                    .map(r => parseFloat(r.answer_value))
                    .filter(v => !isNaN(v));

                if (selectedChartType === 'histogram') {
                    return values;
                }

                if (secondarySelection) {
                    // Group by secondary question
                    const secondaryResponses = responseData.filter(r => r.question_id === secondarySelection.questionId);
                    const groups: Record<string, number[]> = {};

                    for (let i = 0; i < Math.min(filteredResponses.length, secondaryResponses.length); i++) {
                        const value = parseFloat(filteredResponses[i].answer_value);
                        const group = secondaryResponses[i]?.answer_text || secondaryResponses[i]?.answer_value || 'Unknown';

                        if (!isNaN(value)) {
                            if (!groups[group]) groups[group] = [];
                            groups[group].push(value);
                        }
                    }

                    return Object.entries(groups).map(([label, values]) => ({ label, values }));
                }

                return [{ label: primaryQuestion.question_text, values }];
            }

            case 'scatter':
            case 'bubble': {
                if (!secondarySelection) return null;

                const secondaryResponses = responseData.filter(r => r.question_id === secondarySelection.questionId);
                const sizeSelection = dataSelections.find(s => s.field === 'size');
                const sizeResponses = sizeSelection
                    ? responseData.filter(r => r.question_id === sizeSelection.questionId)
                    : [];

                const points: { x: number; y: number; size?: number; label?: string }[] = [];

                for (let i = 0; i < Math.min(filteredResponses.length, secondaryResponses.length); i++) {
                    const x = parseFloat(filteredResponses[i].answer_value);
                    const y = parseFloat(secondaryResponses[i].answer_value);
                    const size = sizeResponses[i] ? parseFloat(sizeResponses[i].answer_value) : undefined;

                    if (!isNaN(x) && !isNaN(y)) {
                        points.push({ x, y, size: isNaN(size!) ? undefined : size, label: `Point ${i + 1}` });
                    }
                }

                return points;
            }

            case 'line':
            case 'area': {
                // Time series or sequential data
                const values = filteredResponses.map(r => parseFloat(r.answer_value)).filter(v => !isNaN(v));
                return [{
                    label: primaryQuestion.question_text,
                    data: values.map((v, i) => ({ x: i, y: v }))
                }];
            }

            case 'sankey':
            case 'sankey_2x':
            case 'sankey_3x': {
                if (!secondarySelection) return null;

                const secondaryResponses = responseData.filter(r => r.question_id === secondarySelection.questionId);

                // Build flow data
                const flows: Record<string, Record<string, number>> = {};

                for (let i = 0; i < Math.min(filteredResponses.length, secondaryResponses.length); i++) {
                    const source = filteredResponses[i].answer_text || filteredResponses[i].answer_value;
                    const target = secondaryResponses[i].answer_text || secondaryResponses[i].answer_value;

                    if (!flows[source]) flows[source] = {};
                    flows[source][target] = (flows[source][target] || 0) + 1;
                }

                // Build nodes and links
                const sourceNodes = Object.keys(flows);
                const targetNodes = [...new Set(Object.values(flows).flatMap(t => Object.keys(t)))];

                const nodes = [
                    ...sourceNodes.map(id => ({ id: `src-${id}`, label: id, column: 0 })),
                    ...targetNodes.map(id => ({ id: `tgt-${id}`, label: id, column: 1 }))
                ];

                const links = [];
                for (const [source, targets] of Object.entries(flows)) {
                    for (const [target, value] of Object.entries(targets)) {
                        links.push({
                            source: `src-${source}`,
                            target: `tgt-${target}`,
                            value
                        });
                    }
                }

                // Handle 3-stage Sankey
                if (selectedChartType === 'sankey_3x' && tertiarySelection) {
                    const tertiaryResponses = responseData.filter(r => r.question_id === tertiarySelection.questionId);
                    const flows2: Record<string, Record<string, number>> = {};

                    for (let i = 0; i < Math.min(secondaryResponses.length, tertiaryResponses.length); i++) {
                        const source = secondaryResponses[i].answer_text || secondaryResponses[i].answer_value;
                        const target = tertiaryResponses[i].answer_text || tertiaryResponses[i].answer_value;

                        if (!flows2[source]) flows2[source] = {};
                        flows2[source][target] = (flows2[source][target] || 0) + 1;
                    }

                    const tertiaryNodes = [...new Set(Object.values(flows2).flatMap(t => Object.keys(t)))];
                    nodes.push(...tertiaryNodes.map(id => ({ id: `trt-${id}`, label: id, column: 2 })));

                    for (const [source, targets] of Object.entries(flows2)) {
                        for (const [target, value] of Object.entries(targets)) {
                            links.push({
                                source: `tgt-${source}`,
                                target: `trt-${target}`,
                                value
                            });
                        }
                    }
                }

                return { nodes, links };
            }

            case 'heatmap':
            case 'correlation_matrix': {
                if (!secondarySelection) return null;

                const secondaryResponses = responseData.filter(r => r.question_id === secondarySelection.questionId);

                // Cross-tabulate
                const matrix: { row: string; col: string; value: number }[] = [];
                const counts: Record<string, Record<string, number>> = {};

                for (let i = 0; i < Math.min(filteredResponses.length, secondaryResponses.length); i++) {
                    const row = filteredResponses[i].answer_text || filteredResponses[i].answer_value;
                    const col = secondaryResponses[i].answer_text || secondaryResponses[i].answer_value;

                    if (!counts[row]) counts[row] = {};
                    counts[row][col] = (counts[row][col] || 0) + 1;
                }

                for (const [row, cols] of Object.entries(counts)) {
                    for (const [col, value] of Object.entries(cols)) {
                        matrix.push({ row, col, value });
                    }
                }

                return matrix;
            }

            case 'radar': {
                // Multi-dimensional comparison
                const categories = primaryQuestion.answer_options?.map(o => o.option_text) ||
                    [...new Set(filteredResponses.map(r => r.answer_text || r.answer_value))];

                const counts: Record<string, number> = {};
                for (const response of filteredResponses) {
                    const value = response.answer_text || response.answer_value;
                    counts[value] = (counts[value] || 0) + 1;
                }

                return [{
                    label: primaryQuestion.question_text,
                    data: categories.map(axis => ({
                        axis,
                        value: counts[axis] || 0
                    }))
                }];
            }

            default:
                return null;
        }
    }, [selectedChartType, dataSelections, responseData, allQuestions]);

    // Add data selection
    const addDataSelection = (field: DataSelection['field']) => {
        setDataSelections(prev => [...prev, {
            questionId: '',
            field,
            aggregation: 'count'
        }]);
    };

    // Update data selection
    const updateDataSelection = (index: number, updates: Partial<DataSelection>) => {
        setDataSelections(prev => prev.map((sel, i) =>
            i === index ? { ...sel, ...updates } : sel
        ));
    };

    // Remove data selection
    const removeDataSelection = (index: number) => {
        setDataSelections(prev => prev.filter((_, i) => i !== index));
    };

    // Export functions
    const handleExportSVG = useCallback(async () => {
        if (!chartRef.current) return;
        setIsExporting(true);
        try {
            const svg = chartRef.current.querySelector('svg');
            if (svg) {
                const svgString = chartToSVG(svg);
                downloadFile(svgString, `${chartTitle || 'chart'}.svg`, 'image/svg+xml');
            }
        } finally {
            setIsExporting(false);
        }
    }, [chartTitle]);

    const handleExportPNG = useCallback(async () => {
        if (!chartRef.current) return;
        setIsExporting(true);
        try {
            const svg = chartRef.current.querySelector('svg');
            if (svg) {
                const pngDataUrl = await svgToPNG(svg, 2);
                const a = document.createElement('a');
                a.href = pngDataUrl;
                a.download = `${chartTitle || 'chart'}.png`;
                a.click();
            }
        } finally {
            setIsExporting(false);
        }
    }, [chartTitle]);

    const handleExportCSV = useCallback(() => {
        if (!processedData) return;
        // Type assertion since processedData can be various shapes but chartDataToCSV handles them
        const csv = chartDataToCSV(processedData as ChartDataPoint[], selectedChartType);
        downloadFile(csv, `${chartTitle || 'chart'}-data.csv`, 'text/csv');
    }, [processedData, chartTitle, selectedChartType]);

    const handleSaveChart = () => {
        if (onSaveChart) {
            onSaveChart({
                chartType: selectedChartType,
                config: chartConfig,
                dataSelections,
                title: chartTitle
            });
        }
    };

    // Render the selected chart
    const renderChart = () => {
        if (!processedData) {
            return (
                <div className="no-data">
                    <p>Select data to visualize</p>
                </div>
            );
        }

        const fullConfig: Partial<ChartConfig> = {
            ...chartConfig,
            title: chartTitle
        };

        switch (selectedChartType) {
            case 'bar':
                return <BarChart data={processedData as ChartDataPoint[]} config={fullConfig} />;
            case 'horizontal_bar':
                return <BarChart data={processedData as ChartDataPoint[]} config={fullConfig} horizontal />;
            case 'stacked_bar':
                return <BarChart data={processedData as ChartDataPoint[]} config={fullConfig} stacked />;
            case 'grouped_bar':
                return <BarChart data={processedData as ChartDataPoint[]} config={fullConfig} grouped />;
            case 'pie':
                return <PieChart data={processedData as ChartDataPoint[]} config={fullConfig} />;
            case 'donut':
                return <PieChart data={processedData as ChartDataPoint[]} config={fullConfig} donut />;
            case 'line':
                return <LineChart series={processedData as any} config={fullConfig} />;
            case 'area':
                // TODO: Add showArea prop to LineChart component
                return <LineChart series={processedData as any} config={fullConfig} />;
            case 'scatter':
                return <ScatterChart data={processedData as any} config={fullConfig} />;
            case 'bubble':
                return <ScatterChart data={processedData as any} config={fullConfig} />;
            case 'sankey':
            case 'sankey_2x':
            case 'sankey_3x':
                return <SankeyChart data={processedData as any} config={fullConfig} />;
            case 'bee_swarm':
                return <BeeSwarmChart data={processedData as any} config={fullConfig} />;
            case 'heatmap':
            case 'correlation_matrix':
                return <HeatmapChart data={processedData as any} config={fullConfig} />;
            case 'box_plot':
                return <BoxPlotChart data={processedData as any} config={fullConfig} />;
            case 'violin':
                return <ViolinChart data={processedData as any} config={fullConfig} />;
            case 'histogram':
                return <HistogramChart data={processedData as number[]} config={fullConfig} />;
            case 'radar':
                return <RadarChart series={processedData as any} config={fullConfig} />;
            case 'funnel':
                return <FunnelChart data={processedData as ChartDataPoint[]} config={fullConfig} />;
            default:
                return <div>Chart type not supported yet</div>;
        }
    };

    // Group charts by category
    const chartCategories = {
        'Basic': ['bar', 'horizontal_bar', 'pie', 'donut', 'line', 'area'],
        'Comparison': ['grouped_bar', 'stacked_bar', 'radar', 'funnel'],
        'Distribution': ['histogram', 'box_plot', 'violin', 'bee_swarm'],
        'Correlation': ['scatter', 'bubble', 'heatmap', 'correlation_matrix'],
        'Flow': ['sankey', 'sankey_2x', 'sankey_3x']
    };

    return (
        <div className="chart-builder">
            <div className="builder-sidebar">
                <div className="sidebar-section">
                    <h3>Chart Type</h3>
                    <div className="chart-type-grid">
                        {Object.entries(chartCategories).map(([category, types]) => (
                            <div key={category} className="chart-category">
                                <h4>{category}</h4>
                                <div className="chart-type-buttons">
                                    {types.map(type => (
                                        <button
                                            key={type}
                                            className={`chart-type-btn ${selectedChartType === type ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedChartType(type as ChartType);
                                                setDataSelections([]);
                                            }}
                                        >
                                            {CHART_METADATA[type as ChartType]?.name || type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-section">
                    <h3>Data Selection</h3>
                    {chartMeta?.requiredSelections?.map(field => (
                        <div key={field} className="data-field">
                            <label>
                                {field.charAt(0).toUpperCase() + field.slice(1)} Data
                                <span className="required">*</span>
                            </label>
                            {dataSelections.find(s => s.field === field) ? (
                                <div className="selection-row">
                                    <select
                                        value={dataSelections.find(s => s.field === field)?.questionId || ''}
                                        onChange={(e) => {
                                            const idx = dataSelections.findIndex(s => s.field === field);
                                            updateDataSelection(idx, { questionId: e.target.value });
                                        }}
                                    >
                                        <option value="">Select question...</option>
                                        {questionGroups.map(group => (
                                            <optgroup key={group.id} label={group.title}>
                                                {group.questions.map(q => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.question_code}: {q.question_text.substring(0, 40)}...
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <button
                                        className="btn-remove"
                                        onClick={() => removeDataSelection(dataSelections.findIndex(s => s.field === field))}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn-add-field"
                                    onClick={() => addDataSelection(field as DataSelection['field'])}
                                >
                                    + Add {field} data
                                </button>
                            )}
                        </div>
                    ))}

                    {chartMeta?.optionalSelections?.map(field => (
                        <div key={field} className="data-field optional">
                            <label>
                                {field.charAt(0).toUpperCase() + field.slice(1)} Data
                                <span className="optional-tag">optional</span>
                            </label>
                            {dataSelections.find(s => s.field === field) ? (
                                <div className="selection-row">
                                    <select
                                        value={dataSelections.find(s => s.field === field)?.questionId || ''}
                                        onChange={(e) => {
                                            const idx = dataSelections.findIndex(s => s.field === field);
                                            updateDataSelection(idx, { questionId: e.target.value });
                                        }}
                                    >
                                        <option value="">Select question...</option>
                                        {questionGroups.map(group => (
                                            <optgroup key={group.id} label={group.title}>
                                                {group.questions.map(q => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.question_code}: {q.question_text.substring(0, 40)}...
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <button
                                        className="btn-remove"
                                        onClick={() => removeDataSelection(dataSelections.findIndex(s => s.field === field))}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn-add-field"
                                    onClick={() => addDataSelection(field as DataSelection['field'])}
                                >
                                    + Add {field} data
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="sidebar-section">
                    <h3>Chart Options</h3>
                    <div className="option-row">
                        <label>Title</label>
                        <input
                            type="text"
                            value={chartTitle}
                            onChange={(e) => setChartTitle(e.target.value)}
                            placeholder="Enter chart title..."
                        />
                    </div>
                    <div className="option-row">
                        <label>Color Scheme</label>
                        <select
                            value={chartConfig.colorScheme || 'editorial'}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, colorScheme: e.target.value as any }))}
                        >
                            {Object.keys(COLOR_PALETTES).map(scheme => (
                                <option key={scheme} value={scheme}>
                                    {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="option-row">
                        <label>Width</label>
                        <input
                            type="number"
                            value={chartConfig.width || 700}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                            min={300}
                            max={1200}
                        />
                    </div>
                    <div className="option-row">
                        <label>Height</label>
                        <input
                            type="number"
                            value={chartConfig.height || 450}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                            min={200}
                            max={800}
                        />
                    </div>
                    <div className="option-row checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={chartConfig.showGrid !== false}
                                onChange={(e) => setChartConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                            />
                            Show Grid
                        </label>
                    </div>
                </div>
            </div>

            <div className="builder-main">
                <div className="chart-preview" ref={chartRef}>
                    {renderChart()}
                </div>

                <div className="chart-actions">
                    <div className="export-buttons">
                        <button onClick={handleExportPNG} disabled={!processedData || isExporting}>
                            Export PNG
                        </button>
                        <button onClick={handleExportSVG} disabled={!processedData || isExporting}>
                            Export SVG
                        </button>
                        <button onClick={handleExportCSV} disabled={!processedData}>
                            Export CSV
                        </button>
                    </div>
                    {onSaveChart && (
                        <button className="btn-save" onClick={handleSaveChart} disabled={!processedData}>
                            Save Chart
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .chart-builder {
                    display: flex;
                    gap: 2rem;
                    min-height: 600px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .builder-sidebar {
                    width: 320px;
                    flex-shrink: 0;
                    background: #f8f7f5;
                    border-radius: 8px;
                    padding: 1.5rem;
                    overflow-y: auto;
                    max-height: 800px;
                }

                .sidebar-section {
                    margin-bottom: 2rem;
                }

                .sidebar-section h3 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #1a1d24;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .chart-category {
                    margin-bottom: 1rem;
                }

                .chart-category h4 {
                    font-size: 0.8rem;
                    color: #666;
                    margin-bottom: 0.5rem;
                }

                .chart-type-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .chart-type-btn {
                    padding: 0.4rem 0.75rem;
                    font-size: 0.8rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .chart-type-btn:hover {
                    border-color: #c94a4a;
                    color: #c94a4a;
                }

                .chart-type-btn.active {
                    background: #c94a4a;
                    color: white;
                    border-color: #c94a4a;
                }

                .data-field {
                    margin-bottom: 1rem;
                }

                .data-field label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: #333;
                }

                .data-field .required {
                    color: #c94a4a;
                    margin-left: 0.25rem;
                }

                .data-field .optional-tag {
                    font-size: 0.7rem;
                    color: #999;
                    font-weight: 400;
                    margin-left: 0.5rem;
                }

                .selection-row {
                    display: flex;
                    gap: 0.5rem;
                }

                .selection-row select {
                    flex: 1;
                    padding: 0.5rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }

                .btn-remove {
                    padding: 0.5rem 0.75rem;
                    background: #f8d7da;
                    color: #c94a4a;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .btn-add-field {
                    width: 100%;
                    padding: 0.5rem;
                    background: white;
                    border: 1px dashed #ccc;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #666;
                    font-size: 0.85rem;
                    transition: all 0.15s;
                }

                .btn-add-field:hover {
                    border-color: #c94a4a;
                    color: #c94a4a;
                }

                .option-row {
                    margin-bottom: 1rem;
                }

                .option-row label {
                    display: block;
                    font-size: 0.85rem;
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .option-row input[type="text"],
                .option-row input[type="number"],
                .option-row select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }

                .option-row.checkbox label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .builder-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .chart-preview {
                    flex: 1;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 500px;
                    overflow: auto;
                }

                .no-data {
                    text-align: center;
                    color: #999;
                    padding: 2rem;
                }

                .no-data p {
                    font-size: 1.1rem;
                }

                .chart-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #f8f7f5;
                    border-radius: 8px;
                }

                .export-buttons {
                    display: flex;
                    gap: 0.75rem;
                }

                .export-buttons button,
                .btn-save {
                    padding: 0.625rem 1.25rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.15s;
                }

                .export-buttons button:hover:not(:disabled) {
                    border-color: #333;
                }

                .export-buttons button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-save {
                    background: #c94a4a;
                    color: white;
                    border-color: #c94a4a;
                }

                .btn-save:hover:not(:disabled) {
                    background: #b03a3a;
                }

                .btn-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
