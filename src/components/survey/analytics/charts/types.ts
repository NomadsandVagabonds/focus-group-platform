// Chart Types and Interfaces for Advanced Visualization System

export type ChartType =
    | 'bar'
    | 'horizontal_bar'
    | 'stacked_bar'
    | 'grouped_bar'
    | 'pie'
    | 'donut'
    | 'line'
    | 'area'
    | 'scatter'
    | 'bubble'
    | 'sankey'
    | 'sankey_2x'
    | 'sankey_3x'
    | 'bee_swarm'
    | 'strip'
    | 'dot_plot'
    | 'lollipop'
    | 'heatmap'
    | 'correlation_matrix'
    | 'box_plot'
    | 'violin'
    | 'histogram'
    | 'density'
    | 'radar'
    | 'treemap'
    | 'sunburst'
    | 'funnel'
    | 'waterfall'
    | 'diverging_bar'
    | 'parallel_coordinates'
    | 'alluvial';

export interface ChartDataPoint {
    label: string;
    value: number;
    code?: string;
    color?: string;
    group?: string;
    subgroup?: string;
    meta?: Record<string, any>;
}

export interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
}

export interface SankeyNode {
    id: string;
    label: string;
    value?: number;
    color?: string;
    column?: number;
}

export interface SankeyLink {
    source: string;
    target: string;
    value: number;
    color?: string;
}

export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

export interface HeatmapCell {
    x: string;
    y: string;
    value: number;
    percentage?: number;
}

export interface BoxPlotData {
    label: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers?: number[];
    mean?: number;
}

export interface CorrelationPair {
    var1: string;
    var2: string;
    correlation: number;
    pValue?: number;
    n?: number;
}

export interface ChartConfig {
    type: ChartType;
    title?: string;
    subtitle?: string;
    width?: number;
    height?: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    showLegend?: boolean;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    showGrid?: boolean;
    showValues?: boolean;
    showPercentages?: boolean;
    animate?: boolean;
    colorScheme?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    sortOrder?: 'asc' | 'desc' | 'none';
    maxCategories?: number;
    interpolation?: 'linear' | 'monotone' | 'step' | 'basis' | 'cardinal';
    opacity?: number;
    strokeWidth?: number;
}

export interface DataSelection {
    questionId: string;
    questionCode: string;
    questionText: string;
    questionType: string;
    role: 'x' | 'y' | 'color' | 'size' | 'source' | 'target' | 'group' | 'value';
    subquestionId?: string;
    subquestionCode?: string;
    filterValues?: string[];
}

export interface ChartBuilderState {
    selections: DataSelection[];
    config: ChartConfig;
    data?: any;
    loading: boolean;
    error?: string;
}

// Color palettes
export const COLOR_PALETTES = {
    editorial: [
        '#c94a4a', '#4a7c9b', '#6b8e5e', '#b8860b', '#8b5a7c',
        '#cc7a3e', '#5a8b8b', '#9b6b4a', '#7c7c8b', '#4a6b8b'
    ],
    vibrant: [
        '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
        '#264653', '#a8dadc', '#1d3557', '#f1faee', '#588157'
    ],
    pastel: [
        '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff',
        '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#d8e2dc'
    ],
    monochrome: [
        '#1a1d24', '#2d3139', '#404550', '#535966', '#66707d',
        '#7a8494', '#8d97a8', '#a1aabb', '#b4bdcf', '#c8d0e2'
    ],
    diverging: [
        '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7',
        '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'
    ],
    sequential: [
        '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
        '#4292c6', '#2171b5', '#08519c', '#08306b'
    ]
};

// Chart type metadata for UI
export const CHART_TYPE_INFO: Record<ChartType, {
    name: string;
    description: string;
    icon: string;
    category: 'distribution' | 'comparison' | 'relationship' | 'flow' | 'composition' | 'trend';
    requiredSelections: string[];
    optionalSelections: string[];
}> = {
    bar: {
        name: 'Bar Chart',
        description: 'Compare values across categories',
        icon: '📊',
        category: 'comparison',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color', 'group']
    },
    horizontal_bar: {
        name: 'Horizontal Bar',
        description: 'Bar chart with horizontal orientation',
        icon: '📊',
        category: 'comparison',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color']
    },
    stacked_bar: {
        name: 'Stacked Bar',
        description: 'Show composition within categories',
        icon: '📊',
        category: 'composition',
        requiredSelections: ['x', 'y', 'group'],
        optionalSelections: ['color']
    },
    grouped_bar: {
        name: 'Grouped Bar',
        description: 'Compare multiple series side by side',
        icon: '📊',
        category: 'comparison',
        requiredSelections: ['x', 'y', 'group'],
        optionalSelections: ['color']
    },
    pie: {
        name: 'Pie Chart',
        description: 'Show proportions of a whole',
        icon: '🥧',
        category: 'composition',
        requiredSelections: ['value'],
        optionalSelections: ['color']
    },
    donut: {
        name: 'Donut Chart',
        description: 'Pie chart with center cutout',
        icon: '🍩',
        category: 'composition',
        requiredSelections: ['value'],
        optionalSelections: ['color']
    },
    line: {
        name: 'Line Chart',
        description: 'Show trends over time or sequence',
        icon: '📈',
        category: 'trend',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color', 'group']
    },
    area: {
        name: 'Area Chart',
        description: 'Line chart with filled area',
        icon: '📈',
        category: 'trend',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color', 'group']
    },
    scatter: {
        name: 'Scatter Plot',
        description: 'Show relationship between two variables',
        icon: '⚬',
        category: 'relationship',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color', 'size']
    },
    bubble: {
        name: 'Bubble Chart',
        description: 'Scatter with size dimension',
        icon: '🫧',
        category: 'relationship',
        requiredSelections: ['x', 'y', 'size'],
        optionalSelections: ['color']
    },
    sankey: {
        name: 'Sankey Diagram',
        description: 'Show flow between two stages',
        icon: '🌊',
        category: 'flow',
        requiredSelections: ['source', 'target'],
        optionalSelections: ['value', 'color']
    },
    sankey_2x: {
        name: 'Sankey 2x',
        description: 'Flow through two transitions',
        icon: '🌊',
        category: 'flow',
        requiredSelections: ['source', 'target', 'group'],
        optionalSelections: ['value', 'color']
    },
    sankey_3x: {
        name: 'Sankey 3x',
        description: 'Flow through three stages',
        icon: '🌊',
        category: 'flow',
        requiredSelections: ['source', 'target', 'group', 'value'],
        optionalSelections: ['color']
    },
    bee_swarm: {
        name: 'Bee Swarm',
        description: 'Distribution with individual points',
        icon: '🐝',
        category: 'distribution',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color', 'group']
    },
    strip: {
        name: 'Strip Plot',
        description: 'Points along a single axis',
        icon: '|',
        category: 'distribution',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color', 'group']
    },
    dot_plot: {
        name: 'Dot Plot',
        description: 'Cleveland dot plot for comparison',
        icon: '•',
        category: 'comparison',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color']
    },
    lollipop: {
        name: 'Lollipop Chart',
        description: 'Dots with connecting lines',
        icon: '🍭',
        category: 'comparison',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color']
    },
    heatmap: {
        name: 'Heatmap',
        description: 'Color-coded matrix of values',
        icon: '🔥',
        category: 'relationship',
        requiredSelections: ['x', 'y', 'value'],
        optionalSelections: []
    },
    correlation_matrix: {
        name: 'Correlation Matrix',
        description: 'Correlations between multiple variables',
        icon: '🔗',
        category: 'relationship',
        requiredSelections: ['value'],
        optionalSelections: []
    },
    box_plot: {
        name: 'Box Plot',
        description: 'Show distribution quartiles',
        icon: '📦',
        category: 'distribution',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['group']
    },
    violin: {
        name: 'Violin Plot',
        description: 'Distribution density + box plot',
        icon: '🎻',
        category: 'distribution',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['group']
    },
    histogram: {
        name: 'Histogram',
        description: 'Frequency distribution',
        icon: '📊',
        category: 'distribution',
        requiredSelections: ['value'],
        optionalSelections: ['group']
    },
    density: {
        name: 'Density Plot',
        description: 'Smooth distribution curve',
        icon: '〰️',
        category: 'distribution',
        requiredSelections: ['value'],
        optionalSelections: ['group']
    },
    radar: {
        name: 'Radar Chart',
        description: 'Multi-dimensional comparison',
        icon: '🕸️',
        category: 'comparison',
        requiredSelections: ['value'],
        optionalSelections: ['group']
    },
    treemap: {
        name: 'Treemap',
        description: 'Hierarchical proportions',
        icon: '🗺️',
        category: 'composition',
        requiredSelections: ['value'],
        optionalSelections: ['group', 'color']
    },
    sunburst: {
        name: 'Sunburst',
        description: 'Hierarchical radial chart',
        icon: '☀️',
        category: 'composition',
        requiredSelections: ['value'],
        optionalSelections: ['group']
    },
    funnel: {
        name: 'Funnel Chart',
        description: 'Show progressive reduction',
        icon: '⏬',
        category: 'flow',
        requiredSelections: ['value'],
        optionalSelections: ['color']
    },
    waterfall: {
        name: 'Waterfall Chart',
        description: 'Show cumulative effect',
        icon: '🏞️',
        category: 'flow',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color']
    },
    diverging_bar: {
        name: 'Diverging Bar',
        description: 'Show positive/negative deviation',
        icon: '↔️',
        category: 'comparison',
        requiredSelections: ['x', 'y'],
        optionalSelections: ['color']
    },
    parallel_coordinates: {
        name: 'Parallel Coordinates',
        description: 'Multi-dimensional data exploration',
        icon: '|||',
        category: 'relationship',
        requiredSelections: ['value'],
        optionalSelections: ['color']
    },
    alluvial: {
        name: 'Alluvial Diagram',
        description: 'Flow changes over multiple stages',
        icon: '〰️',
        category: 'flow',
        requiredSelections: ['source', 'target', 'value'],
        optionalSelections: ['color']
    }
};

// Export formats
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'csv';

export interface ExportOptions {
    format: ExportFormat;
    filename?: string;
    width?: number;
    height?: number;
    scale?: number;
    backgroundColor?: string;
    includeTitle?: boolean;
    includeLegend?: boolean;
}

// Alias for backward compatibility
export const CHART_METADATA = CHART_TYPE_INFO;
