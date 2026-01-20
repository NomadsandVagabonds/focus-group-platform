'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, COLOR_PALETTES } from './types';
import { getColor, niceAxisTicks, formatNumber, generateHistogramBins } from './utils';

interface HistogramChartProps {
    data: number[];
    config?: Partial<ChartConfig>;
    binCount?: number;
    showDensityCurve?: boolean;
    showMean?: boolean;
    showMedian?: boolean;
    color?: string;
}

export default function HistogramChart({
    data,
    config,
    binCount = 20,
    showDensityCurve = false,
    showMean = true,
    showMedian = false,
    color
}: HistogramChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredBin, setHoveredBin] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'histogram',
        width: 700,
        height: 400,
        margin: { top: 40, right: 40, bottom: 60, left: 70 },
        showGrid: true,
        animate: true,
        colorScheme: 'editorial'
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    const layout = useMemo(() => {
        if (data.length === 0) return null;

        const bins = generateHistogramBins(data, binCount);
        const maxCount = Math.max(...bins.map(b => b.value));

        const min = Math.min(...data);
        const max = Math.max(...data);
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const sorted = [...data].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        const binWidth = innerWidth / bins.length;

        return {
            bins,
            maxCount,
            min,
            max,
            mean,
            median,
            binWidth,
            xTicks: niceAxisTicks(min, max, 8),
            yTicks: niceAxisTicks(0, maxCount, 6),
            xScale: (v: number) => margin!.left + ((v - min) / (max - min)) * innerWidth,
            yScale: (v: number) => height! - margin!.bottom - (v / maxCount) * innerHeight
        };
    }, [data, binCount, innerWidth, innerHeight, height, margin]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    const barColor = color || getColor(0, cfg.colorScheme as keyof typeof COLOR_PALETTES);

    const handleMouseMove = (e: React.MouseEvent, binIndex: number) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredBin(binIndex);
    };

    // Generate density curve path
    const densityPath = (): string => {
        if (!showDensityCurve) return '';

        const points = layout.bins.map((bin, i) => ({
            x: margin!.left + i * layout.binWidth + layout.binWidth / 2,
            y: layout.yScale(bin.value)
        }));

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            path += ` Q ${cpx} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`;
            path += ` Q ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        return path;
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="histogram-chart"
            >
                {/* Grid */}
                {cfg.showGrid && (
                    <g className="grid">
                        {layout.yTicks.map((tick, i) => (
                            <line
                                key={`grid-${i}`}
                                x1={margin!.left}
                                y1={layout.yScale(tick)}
                                x2={width! - margin!.right}
                                y2={layout.yScale(tick)}
                                stroke="#e5e5e5"
                                strokeDasharray="3,3"
                            />
                        ))}
                    </g>
                )}

                {/* Bars */}
                <g className="bars">
                    {layout.bins.map((bin, i) => {
                        const x = margin!.left + i * layout.binWidth;
                        const y = layout.yScale(bin.value);
                        const barHeight = height! - margin!.bottom - y;
                        const isHovered = hoveredBin === i;

                        return (
                            <rect
                                key={`bar-${i}`}
                                x={x + 1}
                                y={y}
                                width={layout.binWidth - 2}
                                height={barHeight}
                                fill={barColor}
                                fillOpacity={isHovered ? 0.9 : 0.7}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                style={{ transition: 'fill-opacity 0.15s' }}
                                onMouseEnter={(e) => handleMouseMove(e, i)}
                                onMouseMove={(e) => handleMouseMove(e, i)}
                                onMouseLeave={() => setHoveredBin(null)}
                            />
                        );
                    })}
                </g>

                {/* Density curve */}
                {showDensityCurve && (
                    <path
                        d={densityPath()}
                        fill="none"
                        stroke={barColor}
                        strokeWidth={2}
                        opacity={0.8}
                    />
                )}

                {/* Mean line */}
                {showMean && (
                    <g className="mean-line">
                        <line
                            x1={layout.xScale(layout.mean)}
                            y1={margin!.top}
                            x2={layout.xScale(layout.mean)}
                            y2={height! - margin!.bottom}
                            stroke="#c94a4a"
                            strokeWidth={2}
                            strokeDasharray="6,3"
                        />
                        <text
                            x={layout.xScale(layout.mean) + 5}
                            y={margin!.top + 15}
                            fill="#c94a4a"
                            fontSize={11}
                            fontWeight={500}
                        >
                            Mean: {formatNumber(layout.mean, 2)}
                        </text>
                    </g>
                )}

                {/* Median line */}
                {showMedian && (
                    <g className="median-line">
                        <line
                            x1={layout.xScale(layout.median)}
                            y1={margin!.top}
                            x2={layout.xScale(layout.median)}
                            y2={height! - margin!.bottom}
                            stroke="#2563eb"
                            strokeWidth={2}
                            strokeDasharray="6,3"
                        />
                        <text
                            x={layout.xScale(layout.median) + 5}
                            y={margin!.top + 30}
                            fill="#2563eb"
                            fontSize={11}
                            fontWeight={500}
                        >
                            Median: {formatNumber(layout.median, 2)}
                        </text>
                    </g>
                )}

                {/* Axes */}
                <g className="axes">
                    {/* X-axis */}
                    <line
                        x1={margin!.left}
                        y1={height! - margin!.bottom}
                        x2={width! - margin!.right}
                        y2={height! - margin!.bottom}
                        stroke="#333"
                    />
                    {layout.xTicks.map((tick, i) => (
                        <g key={`x-tick-${i}`} transform={`translate(${layout.xScale(tick)}, ${height! - margin!.bottom})`}>
                            <line y2={6} stroke="#333" />
                            <text y={20} textAnchor="middle" fill="#666" fontSize={11}>
                                {formatNumber(tick, 1)}
                            </text>
                        </g>
                    ))}

                    {/* Y-axis */}
                    <line
                        x1={margin!.left}
                        y1={margin!.top}
                        x2={margin!.left}
                        y2={height! - margin!.bottom}
                        stroke="#333"
                    />
                    {layout.yTicks.map((tick, i) => (
                        <g key={`y-tick-${i}`} transform={`translate(${margin!.left}, ${layout.yScale(tick)})`}>
                            <line x2={-6} stroke="#333" />
                            <text x={-10} textAnchor="end" dominantBaseline="middle" fill="#666" fontSize={11}>
                                {formatNumber(tick, 0)}
                            </text>
                        </g>
                    ))}
                </g>

                {/* Title */}
                {cfg.title && (
                    <text
                        x={margin!.left + innerWidth / 2}
                        y={20}
                        textAnchor="middle"
                        fill="#1a1d24"
                        fontSize={16}
                        fontWeight={600}
                    >
                        {cfg.title}
                    </text>
                )}

                {/* Axis labels */}
                {cfg.xAxisLabel && (
                    <text
                        x={margin!.left + innerWidth / 2}
                        y={height! - 10}
                        textAnchor="middle"
                        fill="#333"
                        fontSize={12}
                        fontWeight={500}
                    >
                        {cfg.xAxisLabel}
                    </text>
                )}
                {cfg.yAxisLabel && (
                    <text
                        transform={`translate(15, ${margin!.top + innerHeight / 2}) rotate(-90)`}
                        textAnchor="middle"
                        fill="#333"
                        fontSize={12}
                        fontWeight={500}
                    >
                        {cfg.yAxisLabel}
                    </text>
                )}

                {/* Stats box */}
                <g className="stats" transform={`translate(${width! - margin!.right - 100}, ${margin!.top + 10})`}>
                    <rect
                        x={0}
                        y={0}
                        width={95}
                        height={50}
                        fill="white"
                        fillOpacity={0.9}
                        stroke="#e0e0e0"
                        rx={4}
                    />
                    <text x={10} y={18} fill="#666" fontSize={10}>
                        n = {data.length}
                    </text>
                    <text x={10} y={32} fill="#666" fontSize={10}>
                        Range: {formatNumber(layout.min, 1)} - {formatNumber(layout.max, 1)}
                    </text>
                    <text x={10} y={46} fill="#666" fontSize={10}>
                        SD: {formatNumber(Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - layout.mean, 2), 0) / data.length), 2)}
                    </text>
                </g>

                <style>{`
                    .histogram-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredBin !== null && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        transform: 'translate(-50%, -100%)',
                        background: 'rgba(0, 0, 0, 0.85)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 100
                    }}
                >
                    <div style={{ fontWeight: 600 }}>
                        {formatNumber(layout.bins[hoveredBin].meta?.binStart ?? 0, 2)} - {formatNumber(layout.bins[hoveredBin].meta?.binEnd ?? 0, 2)}
                    </div>
                    <div>Count: {layout.bins[hoveredBin].value}</div>
                    <div>Percent: {formatNumber(layout.bins[hoveredBin].value / data.length * 100, 1)}%</div>
                </div>
            )}
        </div>
    );
}
