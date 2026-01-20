'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, ChartDataPoint, COLOR_PALETTES } from './types';
import { getColor, niceAxisTicks, formatNumber, calculateCorrelation } from './utils';

interface ScatterPoint extends ChartDataPoint {
    x: number;
    y: number;
    size?: number;
}

interface ScatterChartProps {
    data: ScatterPoint[];
    config?: Partial<ChartConfig>;
    onPointClick?: (point: ScatterPoint) => void;
    showTrendLine?: boolean;
    showCorrelation?: boolean;
}

export default function ScatterChart({ data, config, onPointClick, showTrendLine = false, showCorrelation = true }: ScatterChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<ScatterPoint | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'scatter',
        width: 600,
        height: 500,
        margin: { top: 40, right: 40, bottom: 60, left: 70 },
        showGrid: true,
        animate: true,
        colorScheme: 'editorial',
        xAxisLabel: 'X',
        yAxisLabel: 'Y',
        opacity: 0.7
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    // Calculate scales and stats
    const layout = useMemo(() => {
        if (data.length === 0) return null;

        const xValues = data.map(d => d.x);
        const yValues = data.map(d => d.y);
        const sizeValues = data.filter(d => d.size !== undefined).map(d => d.size!);

        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const minSize = sizeValues.length > 0 ? Math.min(...sizeValues) : 1;
        const maxSize = sizeValues.length > 0 ? Math.max(...sizeValues) : 1;

        const xRange = maxX - minX || 1;
        const yRange = maxY - minY || 1;
        const sizeRange = maxSize - minSize || 1;

        const xScale = (v: number) => margin!.left + ((v - minX) / xRange) * innerWidth;
        const yScale = (v: number) => height! - margin!.bottom - ((v - minY) / yRange) * innerHeight;
        const sizeScale = (v: number | undefined) => {
            if (v === undefined) return 6;
            return 4 + ((v - minSize) / sizeRange) * 20;
        };

        // Calculate correlation
        const correlation = calculateCorrelation(xValues, yValues);

        // Calculate trend line (linear regression)
        const n = data.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
        const sumXX = xValues.reduce((acc, x) => acc + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return {
            xScale,
            yScale,
            sizeScale,
            xTicks: niceAxisTicks(minX, maxX, 6),
            yTicks: niceAxisTicks(minY, maxY, 6),
            correlation,
            trendLine: { slope, intercept, minX, maxX }
        };
    }, [data, innerWidth, innerHeight, height, margin]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    // Get unique groups for coloring
    const groups = [...new Set(data.map(d => d.group || 'default'))];

    const handleMouseMove = (e: React.MouseEvent, point: ScatterPoint) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredPoint(point);
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="scatter-chart"
            >
                {/* Grid */}
                {cfg.showGrid && (
                    <g className="grid">
                        {layout.xTicks.map((tick, i) => (
                            <line
                                key={`x-grid-${i}`}
                                x1={layout.xScale(tick)}
                                y1={margin!.top}
                                x2={layout.xScale(tick)}
                                y2={height! - margin!.bottom}
                                stroke="#e5e5e5"
                                strokeDasharray="3,3"
                            />
                        ))}
                        {layout.yTicks.map((tick, i) => (
                            <line
                                key={`y-grid-${i}`}
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
                                {formatNumber(tick, 1)}
                            </text>
                        </g>
                    ))}
                </g>

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

                {/* Trend line */}
                {showTrendLine && (
                    <line
                        x1={layout.xScale(layout.trendLine.minX)}
                        y1={layout.yScale(layout.trendLine.slope * layout.trendLine.minX + layout.trendLine.intercept)}
                        x2={layout.xScale(layout.trendLine.maxX)}
                        y2={layout.yScale(layout.trendLine.slope * layout.trendLine.maxX + layout.trendLine.intercept)}
                        stroke="#c94a4a"
                        strokeWidth={2}
                        strokeDasharray="8,4"
                        opacity={0.7}
                    />
                )}

                {/* Points */}
                <g className="points">
                    {data.map((point, i) => {
                        const groupIndex = groups.indexOf(point.group || 'default');
                        const color = point.color || getColor(groupIndex, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const r = layout.sizeScale(point.size);
                        const cx = layout.xScale(point.x);
                        const cy = layout.yScale(point.y);
                        const isHovered = hoveredPoint === point;

                        return (
                            <circle
                                key={`point-${i}`}
                                cx={cx}
                                cy={cy}
                                r={isHovered ? r * 1.3 : r}
                                fill={color}
                                fillOpacity={isHovered ? 1 : cfg.opacity}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                style={{
                                    cursor: onPointClick ? 'pointer' : 'default',
                                    transition: 'r 0.15s, fill-opacity 0.15s'
                                }}
                                onMouseEnter={(e) => handleMouseMove(e, point)}
                                onMouseMove={(e) => handleMouseMove(e, point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                onClick={() => onPointClick?.(point)}
                            />
                        );
                    })}
                </g>

                {/* Legend for groups */}
                {groups.length > 1 && (
                    <g className="legend" transform={`translate(${margin!.left + 10}, ${margin!.top + 10})`}>
                        <rect
                            x={-5}
                            y={-5}
                            width={100}
                            height={groups.length * 20 + 10}
                            fill="white"
                            fillOpacity={0.9}
                            stroke="#e0e0e0"
                            rx={4}
                        />
                        {groups.map((group, i) => {
                            const color = getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                            return (
                                <g key={`legend-${i}`} transform={`translate(0, ${i * 20})`}>
                                    <circle cx={8} cy={8} r={5} fill={color} />
                                    <text x={20} y={8} dominantBaseline="middle" fill="#333" fontSize={11}>
                                        {group}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* Correlation badge */}
                {showCorrelation && (
                    <g transform={`translate(${width! - margin!.right - 10}, ${margin!.top + 10})`}>
                        <rect
                            x={-75}
                            y={-5}
                            width={80}
                            height={24}
                            fill="white"
                            fillOpacity={0.9}
                            stroke="#e0e0e0"
                            rx={4}
                        />
                        <text
                            x={-35}
                            y={8}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#333"
                            fontSize={11}
                            fontWeight={500}
                        >
                            r = {layout.correlation.toFixed(3)}
                        </text>
                    </g>
                )}

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

                <style>{`
                    .scatter-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
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
                    {hoveredPoint.label && <div style={{ fontWeight: 600 }}>{hoveredPoint.label}</div>}
                    <div>X: {formatNumber(hoveredPoint.x, 2)}</div>
                    <div>Y: {formatNumber(hoveredPoint.y, 2)}</div>
                    {hoveredPoint.size !== undefined && <div>Size: {formatNumber(hoveredPoint.size, 1)}</div>}
                    {hoveredPoint.group && <div>Group: {hoveredPoint.group}</div>}
                </div>
            )}
        </div>
    );
}
