'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, COLOR_PALETTES } from './types';
import { getColor, niceAxisTicks, formatNumber, calculateBoxPlot } from './utils';

interface BoxPlotGroup {
    label: string;
    values: number[];
    color?: string;
}

interface BoxPlotChartProps {
    data: BoxPlotGroup[];
    config?: Partial<ChartConfig>;
    onGroupClick?: (group: BoxPlotGroup) => void;
    showOutliers?: boolean;
    showMean?: boolean;
    horizontal?: boolean;
}

export default function BoxPlotChart({
    data,
    config,
    onGroupClick,
    showOutliers = true,
    showMean = false,
    horizontal = false
}: BoxPlotChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredGroup, setHoveredGroup] = useState<BoxPlotGroup | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'box_plot',
        width: 700,
        height: 450,
        margin: { top: 40, right: 40, bottom: 70, left: 70 },
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

        // Calculate box plot statistics for each group
        const stats = data.map(group => ({
            ...group,
            stats: calculateBoxPlot(group.values, group.label)
        }));

        // Find global min/max for scale
        let globalMin = Infinity;
        let globalMax = -Infinity;

        for (const s of stats) {
            if (showOutliers && s.stats.outliers && s.stats.outliers.length > 0) {
                globalMin = Math.min(globalMin, Math.min(...s.stats.outliers));
                globalMax = Math.max(globalMax, Math.max(...s.stats.outliers));
            }
            globalMin = Math.min(globalMin, s.stats.min);
            globalMax = Math.max(globalMax, s.stats.max);
        }

        // Add some padding
        const range = globalMax - globalMin || 1;
        globalMin -= range * 0.05;
        globalMax += range * 0.05;

        const ticks = niceAxisTicks(globalMin, globalMax, 8);
        const boxWidth = horizontal
            ? innerHeight / data.length * 0.6
            : innerWidth / data.length * 0.6;

        return {
            stats,
            globalMin,
            globalMax,
            ticks,
            boxWidth,
            valueScale: (v: number) => {
                const t = (v - globalMin) / (globalMax - globalMin);
                return horizontal
                    ? margin!.left + t * innerWidth
                    : height! - margin!.bottom - t * innerHeight;
            },
            categoryScale: (i: number) => {
                const spacing = horizontal ? innerHeight : innerWidth;
                const step = spacing / data.length;
                return horizontal
                    ? margin!.top + step * i + step / 2
                    : margin!.left + step * i + step / 2;
            }
        };
    }, [data, innerWidth, innerHeight, height, margin, showOutliers, horizontal]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    const handleMouseMove = (e: React.MouseEvent, group: BoxPlotGroup) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredGroup(group);
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="boxplot-chart"
            >
                {/* Grid */}
                {cfg.showGrid && (
                    <g className="grid">
                        {layout.ticks.map((tick, i) => (
                            horizontal ? (
                                <line
                                    key={`grid-${i}`}
                                    x1={layout.valueScale(tick)}
                                    y1={margin!.top}
                                    x2={layout.valueScale(tick)}
                                    y2={height! - margin!.bottom}
                                    stroke="#e5e5e5"
                                    strokeDasharray="3,3"
                                />
                            ) : (
                                <line
                                    key={`grid-${i}`}
                                    x1={margin!.left}
                                    y1={layout.valueScale(tick)}
                                    x2={width! - margin!.right}
                                    y2={layout.valueScale(tick)}
                                    stroke="#e5e5e5"
                                    strokeDasharray="3,3"
                                />
                            )
                        ))}
                    </g>
                )}

                {/* Axes */}
                <g className="axes">
                    {/* Value axis */}
                    {horizontal ? (
                        <>
                            <line
                                x1={margin!.left}
                                y1={height! - margin!.bottom}
                                x2={width! - margin!.right}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.ticks.map((tick, i) => (
                                <g key={`tick-${i}`} transform={`translate(${layout.valueScale(tick)}, ${height! - margin!.bottom})`}>
                                    <line y2={6} stroke="#333" />
                                    <text y={20} textAnchor="middle" fill="#666" fontSize={11}>
                                        {formatNumber(tick, 1)}
                                    </text>
                                </g>
                            ))}
                        </>
                    ) : (
                        <>
                            <line
                                x1={margin!.left}
                                y1={margin!.top}
                                x2={margin!.left}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.ticks.map((tick, i) => (
                                <g key={`tick-${i}`} transform={`translate(${margin!.left}, ${layout.valueScale(tick)})`}>
                                    <line x2={-6} stroke="#333" />
                                    <text x={-10} textAnchor="end" dominantBaseline="middle" fill="#666" fontSize={11}>
                                        {formatNumber(tick, 1)}
                                    </text>
                                </g>
                            ))}
                        </>
                    )}

                    {/* Category axis */}
                    {horizontal ? (
                        <>
                            <line
                                x1={margin!.left}
                                y1={margin!.top}
                                x2={margin!.left}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.stats.map((s, i) => (
                                <text
                                    key={`cat-${i}`}
                                    x={margin!.left - 10}
                                    y={layout.categoryScale(i)}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fill="#333"
                                    fontSize={11}
                                >
                                    {s.label.length > 15 ? s.label.substring(0, 13) + '...' : s.label}
                                </text>
                            ))}
                        </>
                    ) : (
                        <>
                            <line
                                x1={margin!.left}
                                y1={height! - margin!.bottom}
                                x2={width! - margin!.right}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.stats.map((s, i) => (
                                <text
                                    key={`cat-${i}`}
                                    x={layout.categoryScale(i)}
                                    y={height! - margin!.bottom + 15}
                                    textAnchor="middle"
                                    fill="#333"
                                    fontSize={11}
                                    transform={s.label.length > 10 ? `rotate(-30, ${layout.categoryScale(i)}, ${height! - margin!.bottom + 15})` : undefined}
                                >
                                    {s.label.length > 12 ? s.label.substring(0, 10) + '...' : s.label}
                                </text>
                            ))}
                        </>
                    )}
                </g>

                {/* Box plots */}
                <g className="boxplots">
                    {layout.stats.map((group, i) => {
                        const color = group.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const { stats } = group;
                        const isHovered = hoveredGroup === data[i];
                        const center = layout.categoryScale(i);
                        const halfWidth = layout.boxWidth / 2;

                        if (horizontal) {
                            return (
                                <g
                                    key={`box-${i}`}
                                    style={{ cursor: onGroupClick ? 'pointer' : 'default' }}
                                    onMouseEnter={(e) => handleMouseMove(e, data[i])}
                                    onMouseMove={(e) => handleMouseMove(e, data[i])}
                                    onMouseLeave={() => setHoveredGroup(null)}
                                    onClick={() => onGroupClick?.(data[i])}
                                >
                                    {/* Whisker line */}
                                    <line
                                        x1={layout.valueScale(stats.min)}
                                        y1={center}
                                        x2={layout.valueScale(stats.max)}
                                        y2={center}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    {/* Whisker caps */}
                                    <line
                                        x1={layout.valueScale(stats.min)}
                                        y1={center - halfWidth * 0.5}
                                        x2={layout.valueScale(stats.min)}
                                        y2={center + halfWidth * 0.5}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    <line
                                        x1={layout.valueScale(stats.max)}
                                        y1={center - halfWidth * 0.5}
                                        x2={layout.valueScale(stats.max)}
                                        y2={center + halfWidth * 0.5}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    {/* Box (Q1 to Q3) */}
                                    <rect
                                        x={layout.valueScale(stats.q1)}
                                        y={center - halfWidth}
                                        width={layout.valueScale(stats.q3) - layout.valueScale(stats.q1)}
                                        height={layout.boxWidth}
                                        fill={color}
                                        fillOpacity={isHovered ? 0.8 : 0.6}
                                        stroke={isHovered ? '#333' : color}
                                        strokeWidth={isHovered ? 2 : 1}
                                        rx={2}
                                    />
                                    {/* Median line */}
                                    <line
                                        x1={layout.valueScale(stats.median)}
                                        y1={center - halfWidth}
                                        x2={layout.valueScale(stats.median)}
                                        y2={center + halfWidth}
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                    {/* Mean dot */}
                                    {showMean && stats.mean !== undefined && (
                                        <circle
                                            cx={layout.valueScale(stats.mean)}
                                            cy={center}
                                            r={4}
                                            fill="white"
                                            stroke={color}
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {/* Outliers */}
                                    {showOutliers && stats.outliers?.map((outlier, j) => (
                                        <circle
                                            key={`outlier-${j}`}
                                            cx={layout.valueScale(outlier)}
                                            cy={center}
                                            r={3}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </g>
                            );
                        } else {
                            return (
                                <g
                                    key={`box-${i}`}
                                    style={{ cursor: onGroupClick ? 'pointer' : 'default' }}
                                    onMouseEnter={(e) => handleMouseMove(e, data[i])}
                                    onMouseMove={(e) => handleMouseMove(e, data[i])}
                                    onMouseLeave={() => setHoveredGroup(null)}
                                    onClick={() => onGroupClick?.(data[i])}
                                >
                                    {/* Whisker line */}
                                    <line
                                        x1={center}
                                        y1={layout.valueScale(stats.min)}
                                        x2={center}
                                        y2={layout.valueScale(stats.max)}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    {/* Whisker caps */}
                                    <line
                                        x1={center - halfWidth * 0.5}
                                        y1={layout.valueScale(stats.min)}
                                        x2={center + halfWidth * 0.5}
                                        y2={layout.valueScale(stats.min)}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    <line
                                        x1={center - halfWidth * 0.5}
                                        y1={layout.valueScale(stats.max)}
                                        x2={center + halfWidth * 0.5}
                                        y2={layout.valueScale(stats.max)}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    {/* Box (Q1 to Q3) */}
                                    <rect
                                        x={center - halfWidth}
                                        y={layout.valueScale(stats.q3)}
                                        width={layout.boxWidth}
                                        height={layout.valueScale(stats.q1) - layout.valueScale(stats.q3)}
                                        fill={color}
                                        fillOpacity={isHovered ? 0.8 : 0.6}
                                        stroke={isHovered ? '#333' : color}
                                        strokeWidth={isHovered ? 2 : 1}
                                        rx={2}
                                    />
                                    {/* Median line */}
                                    <line
                                        x1={center - halfWidth}
                                        y1={layout.valueScale(stats.median)}
                                        x2={center + halfWidth}
                                        y2={layout.valueScale(stats.median)}
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                    {/* Mean dot */}
                                    {showMean && stats.mean !== undefined && (
                                        <circle
                                            cx={center}
                                            cy={layout.valueScale(stats.mean)}
                                            r={4}
                                            fill="white"
                                            stroke={color}
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {/* Outliers */}
                                    {showOutliers && stats.outliers?.map((outlier, j) => (
                                        <circle
                                            key={`outlier-${j}`}
                                            cx={center}
                                            cy={layout.valueScale(outlier)}
                                            r={3}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </g>
                            );
                        }
                    })}
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

                <style>{`
                    .boxplot-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredGroup && (
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
                    {(() => {
                        const stats = calculateBoxPlot(hoveredGroup.values, hoveredGroup.label);
                        return (
                            <>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoveredGroup.label}</div>
                                <div>n = {hoveredGroup.values.length}</div>
                                <div>Min: {formatNumber(stats.min, 2)}</div>
                                <div>Q1: {formatNumber(stats.q1, 2)}</div>
                                <div>Median: {formatNumber(stats.median, 2)}</div>
                                <div>Q3: {formatNumber(stats.q3, 2)}</div>
                                <div>Max: {formatNumber(stats.max, 2)}</div>
                                {showMean && stats.mean !== undefined && <div>Mean: {formatNumber(stats.mean, 2)}</div>}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
