// Chart Utility Functions

import { COLOR_PALETTES, ChartDataPoint, BoxPlotData, SankeyData, SankeyNode, SankeyLink, HeatmapCell, CorrelationPair } from './types';

// Get color from palette
export function getColor(index: number, palette: keyof typeof COLOR_PALETTES = 'editorial'): string {
    const colors = COLOR_PALETTES[palette];
    return colors[index % colors.length];
}

// Generate color scale for sequential data
export function getSequentialColor(value: number, min: number, max: number, palette: string[] = COLOR_PALETTES.sequential): string {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const index = Math.floor(normalized * (palette.length - 1));
    return palette[index];
}

// Generate diverging color for positive/negative values
export function getDivergingColor(value: number, min: number, max: number, palette: string[] = COLOR_PALETTES.diverging): string {
    const center = (min + max) / 2;
    const normalized = value < center
        ? 0.5 - 0.5 * (center - value) / (center - min)
        : 0.5 + 0.5 * (value - center) / (max - center);
    const index = Math.floor(normalized * (palette.length - 1));
    return palette[Math.max(0, Math.min(palette.length - 1, index))];
}

// Calculate statistics for numerical data
export function calculateStats(values: number[]): {
    min: number;
    max: number;
    mean: number;
    median: number;
    q1: number;
    q3: number;
    std: number;
    count: number;
} {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    if (n === 0) {
        return { min: 0, max: 0, mean: 0, median: 0, q1: 0, q3: 0, std: 0, count: 0 };
    }

    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);

    const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return {
        min: sorted[0],
        max: sorted[n - 1],
        mean,
        median,
        q1: sorted[q1Index],
        q3: sorted[q3Index],
        std,
        count: n
    };
}

// Calculate box plot data
export function calculateBoxPlot(values: number[], label: string): BoxPlotData {
    const stats = calculateStats(values);
    const iqr = stats.q3 - stats.q1;
    const lowerFence = stats.q1 - 1.5 * iqr;
    const upperFence = stats.q3 + 1.5 * iqr;

    const outliers = values.filter(v => v < lowerFence || v > upperFence);
    const withinFence = values.filter(v => v >= lowerFence && v <= upperFence);

    return {
        label,
        min: withinFence.length > 0 ? Math.min(...withinFence) : stats.min,
        q1: stats.q1,
        median: stats.median,
        q3: stats.q3,
        max: withinFence.length > 0 ? Math.max(...withinFence) : stats.max,
        outliers,
        mean: stats.mean
    };
}

// Calculate Pearson correlation
export function calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const xMean = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const yMean = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let xDenom = 0;
    let yDenom = 0;

    for (let i = 0; i < n; i++) {
        const xDiff = x[i] - xMean;
        const yDiff = y[i] - yMean;
        numerator += xDiff * yDiff;
        xDenom += xDiff * xDiff;
        yDenom += yDiff * yDiff;
    }

    const denom = Math.sqrt(xDenom * yDenom);
    return denom === 0 ? 0 : numerator / denom;
}

// Build correlation matrix
export function buildCorrelationMatrix(variables: { name: string; values: number[] }[]): CorrelationPair[] {
    const pairs: CorrelationPair[] = [];

    for (let i = 0; i < variables.length; i++) {
        for (let j = i; j < variables.length; j++) {
            const correlation = calculateCorrelation(variables[i].values, variables[j].values);
            pairs.push({
                var1: variables[i].name,
                var2: variables[j].name,
                correlation,
                n: Math.min(variables[i].values.length, variables[j].values.length)
            });
        }
    }

    return pairs;
}

// Build Sankey data from response transitions
export function buildSankeyData(
    responses: any[],
    sourceQuestionId: string,
    targetQuestionId: string,
    thirdQuestionId?: string,
    questionLabels?: Map<string, Map<string, string>>
): SankeyData {
    const nodes: Map<string, SankeyNode> = new Map();
    const linkCounts: Map<string, number> = new Map();

    for (const response of responses) {
        const sourceValue = response.data?.[sourceQuestionId];
        const targetValue = response.data?.[targetQuestionId];
        const thirdValue = thirdQuestionId ? response.data?.[thirdQuestionId] : undefined;

        if (!sourceValue || !targetValue) continue;

        // Create node IDs with prefixes to distinguish stages
        const sourceNodeId = `source_${sourceValue}`;
        const targetNodeId = `target_${targetValue}`;

        // Add nodes
        if (!nodes.has(sourceNodeId)) {
            const label = questionLabels?.get(sourceQuestionId)?.get(sourceValue) || sourceValue;
            nodes.set(sourceNodeId, { id: sourceNodeId, label, column: 0 });
        }
        if (!nodes.has(targetNodeId)) {
            const label = questionLabels?.get(targetQuestionId)?.get(targetValue) || targetValue;
            nodes.set(targetNodeId, { id: targetNodeId, label, column: 1 });
        }

        // Count link
        const linkKey = `${sourceNodeId}|${targetNodeId}`;
        linkCounts.set(linkKey, (linkCounts.get(linkKey) || 0) + 1);

        // Handle third stage if provided
        if (thirdValue && thirdQuestionId) {
            const thirdNodeId = `third_${thirdValue}`;
            if (!nodes.has(thirdNodeId)) {
                const label = questionLabels?.get(thirdQuestionId)?.get(thirdValue) || thirdValue;
                nodes.set(thirdNodeId, { id: thirdNodeId, label, column: 2 });
            }
            const linkKey2 = `${targetNodeId}|${thirdNodeId}`;
            linkCounts.set(linkKey2, (linkCounts.get(linkKey2) || 0) + 1);
        }
    }

    // Convert to arrays
    const links: SankeyLink[] = [];
    for (const [key, value] of linkCounts.entries()) {
        const [source, target] = key.split('|');
        links.push({ source, target, value });
    }

    return {
        nodes: Array.from(nodes.values()),
        links
    };
}

// Build heatmap data from cross-tabulation
export function buildHeatmapData(
    responses: any[],
    xQuestionId: string,
    yQuestionId: string,
    xLabels?: Map<string, string>,
    yLabels?: Map<string, string>
): HeatmapCell[] {
    const counts: Map<string, Map<string, number>> = new Map();

    for (const response of responses) {
        const xValue = response.data?.[xQuestionId];
        const yValue = response.data?.[yQuestionId];

        if (!xValue || !yValue) continue;

        if (!counts.has(xValue)) {
            counts.set(xValue, new Map());
        }
        const row = counts.get(xValue)!;
        row.set(yValue, (row.get(yValue) || 0) + 1);
    }

    const cells: HeatmapCell[] = [];
    let total = 0;

    for (const [x, row] of counts.entries()) {
        for (const [y, count] of row.entries()) {
            total += count;
            cells.push({
                x: xLabels?.get(x) || x,
                y: yLabels?.get(y) || y,
                value: count
            });
        }
    }

    // Add percentages
    for (const cell of cells) {
        cell.percentage = total > 0 ? (cell.value / total) * 100 : 0;
    }

    return cells;
}

// Generate histogram bins
export function generateHistogramBins(values: number[], binCount: number = 10): ChartDataPoint[] {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;

    const bins: number[] = new Array(binCount).fill(0);

    for (const value of values) {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
        bins[binIndex]++;
    }

    return bins.map((count, i) => ({
        label: `${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`,
        value: count,
        meta: {
            binStart: min + i * binWidth,
            binEnd: min + (i + 1) * binWidth
        }
    }));
}

// Kernel density estimation
export function kernelDensityEstimation(
    values: number[],
    bandwidth?: number,
    points: number = 100,
    minVal?: number,
    maxVal?: number
): { x: number; y: number }[] {
    if (values.length === 0) return [];

    const min = minVal ?? Math.min(...values);
    const max = maxVal ?? Math.max(...values);
    const range = max - min || 1;

    // Silverman's rule of thumb for bandwidth
    const std = calculateStats(values).std;
    const h = bandwidth || 1.06 * std * Math.pow(values.length, -0.2);

    const result: { x: number; y: number }[] = [];

    for (let i = 0; i < points; i++) {
        const x = min - range * 0.1 + (range * 1.2 * i) / (points - 1);
        let density = 0;

        for (const value of values) {
            const u = (x - value) / h;
            // Gaussian kernel
            density += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
        }

        density /= values.length * h;
        result.push({ x, y: density });
    }

    return result;
}

// Force simulation for bee swarm positioning
export function beeSwarmPositions(
    points: { value: number; group?: string }[],
    radius: number = 4,
    width: number = 100
): { x: number; y: number; group?: string }[] {
    const result = points.map(p => ({
        x: p.value,
        y: 0,
        group: p.group,
        vx: 0,
        vy: 0
    }));

    // Simple collision avoidance simulation
    for (let iteration = 0; iteration < 100; iteration++) {
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const dx = result[j].x - result[i].x;
                const dy = result[j].y - result[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = radius * 2.2;

                if (dist < minDist && dist > 0) {
                    const force = (minDist - dist) / dist * 0.5;
                    const fx = dx * force;
                    const fy = dy * force;

                    result[i].y -= fy;
                    result[j].y += fy;
                }
            }

            // Keep within bounds
            result[i].y = Math.max(-width / 2, Math.min(width / 2, result[i].y));
        }
    }

    return result.map(p => ({ x: p.x, y: p.y, group: p.group }));
}

// Generate SVG path for smooth curves
export function generateSmoothPath(
    points: { x: number; y: number }[],
    interpolation: 'linear' | 'monotone' | 'basis' | 'cardinal' = 'monotone'
): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;

    if (interpolation === 'linear') {
        return points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
    }

    // Monotone cubic interpolation (good for line charts)
    if (interpolation === 'monotone') {
        const n = points.length;
        const dx: number[] = [];
        const dy: number[] = [];
        const m: number[] = [];
        const ms: number[] = [];

        for (let i = 0; i < n - 1; i++) {
            dx[i] = points[i + 1].x - points[i].x;
            dy[i] = points[i + 1].y - points[i].y;
            m[i] = dy[i] / dx[i];
        }

        ms[0] = m[0];
        ms[n - 1] = m[n - 2];

        for (let i = 1; i < n - 1; i++) {
            if (m[i - 1] * m[i] <= 0) {
                ms[i] = 0;
            } else {
                ms[i] = (m[i - 1] + m[i]) / 2;
            }
        }

        let path = `M${points[0].x},${points[0].y}`;

        for (let i = 0; i < n - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const c1x = p0.x + dx[i] / 3;
            const c1y = p0.y + ms[i] * dx[i] / 3;
            const c2x = p1.x - dx[i] / 3;
            const c2y = p1.y - ms[i + 1] * dx[i] / 3;
            path += ` C${c1x},${c1y} ${c2x},${c2y} ${p1.x},${p1.y}`;
        }

        return path;
    }

    // Catmull-Rom spline (cardinal)
    if (interpolation === 'cardinal') {
        const tension = 0.5;
        let path = `M${points[0].x},${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
            const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
            const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
            const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

            path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }

        return path;
    }

    // Basis spline
    if (interpolation === 'basis') {
        let path = `M${points[0].x},${points[0].y}`;

        for (let i = 1; i < points.length - 2; i++) {
            const x = (points[i].x + points[i + 1].x) / 2;
            const y = (points[i].y + points[i + 1].y) / 2;
            path += ` Q${points[i].x},${points[i].y} ${x},${y}`;
        }

        path += ` Q${points[points.length - 2].x},${points[points.length - 2].y} ${points[points.length - 1].x},${points[points.length - 1].y}`;

        return path;
    }

    return '';
}

// Format numbers for display
export function formatNumber(value: number, decimals: number = 1): string {
    if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(decimals) + 'M';
    }
    if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(decimals) + 'K';
    }
    return value.toFixed(decimals);
}

// Calculate nice axis ticks
export function niceAxisTicks(min: number, max: number, targetTicks: number = 5): number[] {
    const range = max - min;
    const roughStep = range / (targetTicks - 1);

    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;

    let niceStep: number;
    if (residual <= 1.5) niceStep = 1 * magnitude;
    else if (residual <= 3) niceStep = 2 * magnitude;
    else if (residual <= 7) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;

    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;

    const ticks: number[] = [];
    for (let tick = niceMin; tick <= niceMax + niceStep / 2; tick += niceStep) {
        ticks.push(tick);
    }

    return ticks;
}

// Convert chart to SVG string for export
export function chartToSVG(svgElement: SVGSVGElement): string {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    // Add XML declaration and namespaces
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;
}

// Convert SVG to PNG data URL
export async function svgToPNG(svgElement: SVGSVGElement, scale: number = 2): Promise<string> {
    return new Promise((resolve, reject) => {
        const svgString = chartToSVG(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        const img = new Image();

        img.onload = () => {
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.scale(scale, scale);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    });
}

// Download file utility
export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export chart data to CSV
export function chartDataToCSV(data: ChartDataPoint[], title?: string): string {
    const headers = ['Label', 'Value', 'Group', 'Color'];
    const rows = data.map(d => [
        d.label,
        d.value.toString(),
        d.group || '',
        d.color || ''
    ]);

    let csv = '';
    if (title) {
        csv += `# ${title}\n`;
    }
    csv += headers.join(',') + '\n';
    csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return csv;
}
