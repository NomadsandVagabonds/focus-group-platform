'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, COLOR_PALETTES } from './types';
import { getColor, niceAxisTicks, formatNumber, calculateBoxPlot, kernelDensityEstimation } from './utils';

interface ViolinGroup {
    label: string;
    values: number[];
    color?: string;
}

interface ViolinChartProps {
    data: ViolinGroup[];
    config?: Partial<ChartConfig>;
    onGroupClick?: (group: ViolinGroup) => void;
    showBoxPlot?: boolean;
    showMedian?: boolean;
    bandwidth?: number;
}

export default function ViolinChart({
    data,
    config,
    onGroupClick,
    showBoxPlot = true,
    showMedian = true,
    bandwidth = 0.5
}: ViolinChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredGroup, setHoveredGroup] = useState<ViolinGroup | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'violin',
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

        // Find global min/max
        let globalMin = Infinity;
        let globalMax = -Infinity;

        for (const group of data) {
            globalMin = Math.min(globalMin, Math.min(...group.values));
            globalMax = Math.max(globalMax, Math.max(...group.values));
        }

        const range = globalMax - globalMin || 1;
        globalMin -= range * 0.05;
        globalMax += range * 0.05;

        // Calculate KDE for each group
        const violins = data.map(group => {
            const kde = kernelDensityEstimation(group.values, bandwidth, 50, globalMin, globalMax);
            const maxDensity = Math.max(...kde.map(d => d.y));
            return {
                ...group,
                kde,
                maxDensity,
                boxPlot: calculateBoxPlot(group.values, group.label)
            };
        });

        // Find global max density for scaling
        const globalMaxDensity = Math.max(...violins.map(v => v.maxDensity));

        const ticks = niceAxisTicks(globalMin, globalMax, 8);
        const violinWidth = innerWidth / data.length * 0.8;

        return {
            violins,
            globalMin,
            globalMax,
            globalMaxDensity,
            ticks,
            violinWidth,
            valueScale: (v: number) => {
                const t = (v - globalMin) / (globalMax - globalMin);
                return height! - margin!.bottom - t * innerHeight;
            },
            categoryScale: (i: number) => {
                const step = innerWidth / data.length;
                return margin!.left + step * i + step / 2;
            },
            densityScale: (d: number) => {
                return (d / globalMaxDensity) * (violinWidth / 2);
            }
        };
    }, [data, innerWidth, innerHeight, height, margin, bandwidth]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    // Generate violin path
    const violinPath = (kde: { x: number; y: number }[], center: number): string => {
        if (kde.length === 0) return '';

        // Left side (negative x direction from center)
        let path = `M ${center} ${layout.valueScale(kde[0].x)}`;

        for (const point of kde) {
            const xPos = center - layout.densityScale(point.y);
            const yPos = layout.valueScale(point.x);
            path += ` L ${xPos} ${yPos}`;
        }

        // Right side (positive x direction, going back up)
        for (let i = kde.length - 1; i >= 0; i--) {
            const point = kde[i];
            const xPos = center + layout.densityScale(point.y);
            const yPos = layout.valueScale(point.x);
            path += ` L ${xPos} ${yPos}`;
        }

        path += ' Z';
        return path;
    };

    const handleMouseMove = (e: React.MouseEvent, group: ViolinGroup) => {
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
                className="violin-chart"
            >
                {/* Grid */}
                {cfg.showGrid && (
                    <g className="grid">
                        {layout.ticks.map((tick, i) => (
                            <line
                                key={`grid-${i}`}
                                x1={margin!.left}
                                y1={layout.valueScale(tick)}
                                x2={width! - margin!.right}
                                y2={layout.valueScale(tick)}
                                stroke="#e5e5e5"
                                strokeDasharray="3,3"
                            />
                        ))}
                    </g>
                )}

                {/* Axes */}
                <g className="axes">
                    {/* Y-axis (values) */}
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

                    {/* X-axis (categories) */}
                    <line
                        x1={margin!.left}
                        y1={height! - margin!.bottom}
                        x2={width! - margin!.right}
                        y2={height! - margin!.bottom}
                        stroke="#333"
                    />
                    {layout.violins.map((v, i) => (
                        <text
                            key={`cat-${i}`}
                            x={layout.categoryScale(i)}
                            y={height! - margin!.bottom + 15}
                            textAnchor="middle"
                            fill="#333"
                            fontSize={11}
                            transform={v.label.length > 10 ? `rotate(-30, ${layout.categoryScale(i)}, ${height! - margin!.bottom + 15})` : undefined}
                        >
                            {v.label.length > 12 ? v.label.substring(0, 10) + '...' : v.label}
                        </text>
                    ))}
                </g>

                {/* Violins */}
                <g className="violins">
                    {layout.violins.map((violin, i) => {
                        const color = violin.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const center = layout.categoryScale(i);
                        const isHovered = hoveredGroup === data[i];
                        const boxWidth = layout.violinWidth * 0.15;

                        return (
                            <g
                                key={`violin-${i}`}
                                style={{ cursor: onGroupClick ? 'pointer' : 'default' }}
                                onMouseEnter={(e) => handleMouseMove(e, data[i])}
                                onMouseMove={(e) => handleMouseMove(e, data[i])}
                                onMouseLeave={() => setHoveredGroup(null)}
                                onClick={() => onGroupClick?.(data[i])}
                            >
                                {/* Violin shape */}
                                <path
                                    d={violinPath(violin.kde, center)}
                                    fill={color}
                                    fillOpacity={isHovered ? 0.7 : 0.5}
                                    stroke={isHovered ? '#333' : color}
                                    strokeWidth={isHovered ? 2 : 1}
                                />

                                {/* Inner box plot */}
                                {showBoxPlot && (
                                    <>
                                        {/* Whisker line */}
                                        <line
                                            x1={center}
                                            y1={layout.valueScale(violin.boxPlot.min)}
                                            x2={center}
                                            y2={layout.valueScale(violin.boxPlot.max)}
                                            stroke="white"
                                            strokeWidth={1}
                                        />
                                        {/* Box (Q1 to Q3) */}
                                        <rect
                                            x={center - boxWidth / 2}
                                            y={layout.valueScale(violin.boxPlot.q3)}
                                            width={boxWidth}
                                            height={layout.valueScale(violin.boxPlot.q1) - layout.valueScale(violin.boxPlot.q3)}
                                            fill="white"
                                            fillOpacity={0.9}
                                            stroke="#333"
                                            strokeWidth={1}
                                            rx={1}
                                        />
                                    </>
                                )}

                                {/* Median line/dot */}
                                {showMedian && (
                                    <circle
                                        cx={center}
                                        cy={layout.valueScale(violin.boxPlot.median)}
                                        r={3}
                                        fill="#333"
                                    />
                                )}
                            </g>
                        );
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
                    .violin-chart {
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
                                {stats.mean !== undefined && <div>Mean: {formatNumber(stats.mean, 2)}</div>}
                                <div>Q3: {formatNumber(stats.q3, 2)}</div>
                                <div>Max: {formatNumber(stats.max, 2)}</div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
