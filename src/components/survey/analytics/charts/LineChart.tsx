'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, ChartSeries, COLOR_PALETTES } from './types';
import { getColor, generateSmoothPath, niceAxisTicks, formatNumber } from './utils';

interface LineChartProps {
    series: ChartSeries[];
    config?: Partial<ChartConfig>;
    onPointClick?: (seriesName: string, index: number, value: number) => void;
    showArea?: boolean;
}

export default function LineChart({ series, config, onPointClick, showArea = false }: LineChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ series: string; index: number; x: number; y: number; value: number; label: string } | null>(null);

    const defaultConfig: ChartConfig = {
        type: 'line',
        width: 700,
        height: 400,
        margin: { top: 40, right: 100, bottom: 60, left: 60 },
        showGrid: true,
        showLegend: true,
        legendPosition: 'right',
        animate: true,
        colorScheme: 'editorial',
        xAxisLabel: '',
        yAxisLabel: '',
        interpolation: 'monotone',
        strokeWidth: 2
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin, interpolation, strokeWidth } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    // Calculate scales
    const scales = useMemo(() => {
        if (series.length === 0 || series.every(s => s.data.length === 0)) return null;

        const allData = series.flatMap(s => s.data);
        const labels = [...new Set(series.flatMap(s => s.data.map(d => d.label)))];

        const values = allData.map(d => d.value);
        const minY = Math.min(0, ...values);
        const maxY = Math.max(...values);

        const xScale = (index: number) => margin!.left + (index / Math.max(1, labels.length - 1)) * innerWidth;
        const yScale = (value: number) => {
            const range = maxY - minY || 1;
            return height! - margin!.bottom - ((value - minY) / range) * innerHeight;
        };

        return {
            x: xScale,
            y: yScale,
            labels,
            minY,
            maxY,
            yTicks: niceAxisTicks(minY, maxY, 6)
        };
    }, [series, innerWidth, innerHeight, height, margin]);

    if (!scales || series.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    const colors = COLOR_PALETTES[cfg.colorScheme as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.editorial;

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="line-chart"
            >
                <defs>
                    {/* Area gradients */}
                    {series.map((s, i) => {
                        const color = s.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        return (
                            <linearGradient
                                key={`area-gradient-${i}`}
                                id={`area-gradient-${i}`}
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        );
                    })}
                </defs>

                {/* Grid lines */}
                {cfg.showGrid && (
                    <g className="grid">
                        {/* Horizontal grid */}
                        {scales.yTicks.map((tick, i) => (
                            <line
                                key={`h-grid-${i}`}
                                x1={margin!.left}
                                y1={scales.y(tick)}
                                x2={width! - margin!.right}
                                y2={scales.y(tick)}
                                stroke="#e5e5e5"
                                strokeDasharray="3,3"
                            />
                        ))}
                        {/* Vertical grid */}
                        {scales.labels.map((_, i) => (
                            <line
                                key={`v-grid-${i}`}
                                x1={scales.x(i)}
                                y1={margin!.top}
                                x2={scales.x(i)}
                                y2={height! - margin!.bottom}
                                stroke="#e5e5e5"
                                strokeDasharray="3,3"
                            />
                        ))}
                    </g>
                )}

                {/* Zero line if applicable */}
                {scales.minY < 0 && scales.maxY > 0 && (
                    <line
                        x1={margin!.left}
                        y1={scales.y(0)}
                        x2={width! - margin!.right}
                        y2={scales.y(0)}
                        stroke="#333"
                        strokeWidth={1}
                    />
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
                    {scales.labels.map((label, i) => {
                        // Show fewer labels if too many
                        const showLabel = scales.labels.length <= 12 || i % Math.ceil(scales.labels.length / 12) === 0;
                        return showLabel ? (
                            <g key={`x-tick-${i}`} transform={`translate(${scales.x(i)}, ${height! - margin!.bottom})`}>
                                <line y2={6} stroke="#333" />
                                <text
                                    y={20}
                                    textAnchor="middle"
                                    fill="#666"
                                    fontSize={10}
                                    transform={scales.labels.length > 8 ? 'rotate(-45)' : ''}
                                    style={{ transformOrigin: 'top' }}
                                >
                                    {label.length > 10 ? label.slice(0, 10) + '...' : label}
                                </text>
                            </g>
                        ) : null;
                    })}

                    {/* Y-axis */}
                    <line
                        x1={margin!.left}
                        y1={margin!.top}
                        x2={margin!.left}
                        y2={height! - margin!.bottom}
                        stroke="#333"
                    />
                    {scales.yTicks.map((tick, i) => (
                        <g key={`y-tick-${i}`} transform={`translate(${margin!.left}, ${scales.y(tick)})`}>
                            <line x2={-6} stroke="#333" />
                            <text
                                x={-10}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fill="#666"
                                fontSize={11}
                            >
                                {formatNumber(tick, 0)}
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

                {/* Lines and areas */}
                {series.map((s, si) => {
                    const color = s.color || getColor(si, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                    const points = s.data.map((d, di) => {
                        const labelIndex = scales.labels.indexOf(d.label);
                        return { x: scales.x(labelIndex >= 0 ? labelIndex : di), y: scales.y(d.value) };
                    });

                    const linePath = generateSmoothPath(points, interpolation as any);

                    // Area path (if area chart mode)
                    const areaPath = cfg.type === 'area' && points.length > 0 ?
                        `${linePath} L${points[points.length - 1].x},${height! - margin!.bottom} L${points[0].x},${height! - margin!.bottom} Z` :
                        '';

                    return (
                        <g key={`series-${si}`}>
                            {/* Area fill */}
                            {cfg.type === 'area' && areaPath && (
                                <path
                                    d={areaPath}
                                    fill={`url(#area-gradient-${si})`}
                                />
                            )}

                            {/* Line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Points */}
                            {points.map((p, pi) => (
                                <circle
                                    key={`point-${pi}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r={hoveredPoint?.series === s.name && hoveredPoint?.index === pi ? 6 : 4}
                                    fill="white"
                                    stroke={color}
                                    strokeWidth={2}
                                    style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                                    onMouseEnter={() => setHoveredPoint({
                                        series: s.name,
                                        index: pi,
                                        x: p.x,
                                        y: p.y,
                                        value: s.data[pi].value,
                                        label: s.data[pi].label
                                    })}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                    onClick={() => onPointClick?.(s.name, pi, s.data[pi].value)}
                                />
                            ))}
                        </g>
                    );
                })}

                {/* Legend */}
                {cfg.showLegend && series.length > 1 && (
                    <g className="legend" transform={`translate(${width! - margin!.right + 15}, ${margin!.top})`}>
                        {series.map((s, i) => {
                            const color = s.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                            return (
                                <g key={`legend-${i}`} transform={`translate(0, ${i * 24})`}>
                                    <line x1={0} y1={0} x2={20} y2={0} stroke={color} strokeWidth={2} />
                                    <circle cx={10} cy={0} r={4} fill="white" stroke={color} strokeWidth={2} />
                                    <text x={28} y={0} dominantBaseline="middle" fill="#333" fontSize={11}>
                                        {s.name}
                                    </text>
                                </g>
                            );
                        })}
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
                    .line-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
                <div
                    style={{
                        position: 'absolute',
                        left: hoveredPoint.x,
                        top: hoveredPoint.y - 10,
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
                    <div style={{ fontWeight: 600 }}>{hoveredPoint.series}</div>
                    <div>{hoveredPoint.label}: {formatNumber(hoveredPoint.value, 1)}</div>
                </div>
            )}
        </div>
    );
}
