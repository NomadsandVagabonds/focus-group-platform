'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, COLOR_PALETTES } from './types';
import { getColor, formatNumber } from './utils';

interface RadarDataPoint {
    axis: string;
    value: number;
}

interface RadarSeries {
    label: string;
    data: RadarDataPoint[];
    color?: string;
}

interface RadarChartProps {
    series: RadarSeries[];
    config?: Partial<ChartConfig>;
    onPointClick?: (series: RadarSeries, point: RadarDataPoint) => void;
    maxValue?: number;
    levels?: number;
    showValues?: boolean;
    fillOpacity?: number;
}

export default function RadarChart({
    series,
    config,
    onPointClick,
    maxValue,
    levels = 5,
    showValues = false,
    fillOpacity = 0.3
}: RadarChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredSeries, setHoveredSeries] = useState<number | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ seriesIdx: number; pointIdx: number } | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'radar',
        width: 500,
        height: 450,
        margin: { top: 60, right: 80, bottom: 60, left: 80 },
        animate: true,
        colorScheme: 'editorial'
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    const layout = useMemo(() => {
        if (series.length === 0 || series[0].data.length === 0) return null;

        const axes = series[0].data.map(d => d.axis);
        const numAxes = axes.length;

        // Find max value
        let max = maxValue || 0;
        if (!maxValue) {
            for (const s of series) {
                for (const d of s.data) {
                    max = Math.max(max, d.value);
                }
            }
            max = Math.ceil(max * 1.1); // Add 10% padding
        }

        const centerX = margin!.left + innerWidth / 2;
        const centerY = margin!.top + innerHeight / 2;
        const radius = Math.min(innerWidth, innerHeight) / 2 - 30;

        // Calculate angle for each axis
        const angleStep = (2 * Math.PI) / numAxes;

        // Level values
        const levelValues = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * max);

        return {
            axes,
            numAxes,
            max,
            centerX,
            centerY,
            radius,
            angleStep,
            levelValues,
            getPoint: (value: number, axisIndex: number) => {
                const angle = axisIndex * angleStep - Math.PI / 2;
                const r = (value / max) * radius;
                return {
                    x: centerX + Math.cos(angle) * r,
                    y: centerY + Math.sin(angle) * r
                };
            },
            getAxisEnd: (axisIndex: number) => {
                const angle = axisIndex * angleStep - Math.PI / 2;
                return {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    labelX: centerX + Math.cos(angle) * (radius + 20),
                    labelY: centerY + Math.sin(angle) * (radius + 20)
                };
            }
        };
    }, [series, innerWidth, innerHeight, margin, maxValue, levels]);

    if (!layout || series.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    // Generate polygon path for a series
    const seriesPath = (s: RadarSeries): string => {
        const points = s.data.map((d, i) => layout.getPoint(d.value, i));
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    };

    // Generate level polygon path
    const levelPath = (levelValue: number): string => {
        const points = Array.from({ length: layout.numAxes }, (_, i) => layout.getPoint(levelValue, i));
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    };

    const handleMouseMove = (e: React.MouseEvent, seriesIdx: number, pointIdx?: number) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredSeries(seriesIdx);
        if (pointIdx !== undefined) {
            setHoveredPoint({ seriesIdx, pointIdx });
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="radar-chart"
            >
                {/* Title */}
                {cfg.title && (
                    <text
                        x={width! / 2}
                        y={25}
                        textAnchor="middle"
                        fill="#1a1d24"
                        fontSize={16}
                        fontWeight={600}
                    >
                        {cfg.title}
                    </text>
                )}

                {/* Level polygons (web) */}
                <g className="levels">
                    {layout.levelValues.map((value, i) => (
                        <path
                            key={`level-${i}`}
                            d={levelPath(value)}
                            fill="none"
                            stroke="#e5e5e5"
                            strokeWidth={1}
                        />
                    ))}
                </g>

                {/* Axes */}
                <g className="axes">
                    {layout.axes.map((axis, i) => {
                        const end = layout.getAxisEnd(i);
                        const angle = i * layout.angleStep - Math.PI / 2;
                        const isRight = Math.cos(angle) > 0.1;
                        const isLeft = Math.cos(angle) < -0.1;

                        return (
                            <g key={`axis-${i}`}>
                                <line
                                    x1={layout.centerX}
                                    y1={layout.centerY}
                                    x2={end.x}
                                    y2={end.y}
                                    stroke="#ccc"
                                    strokeWidth={1}
                                />
                                <text
                                    x={end.labelX}
                                    y={end.labelY}
                                    textAnchor={isRight ? 'start' : isLeft ? 'end' : 'middle'}
                                    dominantBaseline={Math.sin(angle) > 0.5 ? 'hanging' : Math.sin(angle) < -0.5 ? 'auto' : 'middle'}
                                    fill="#333"
                                    fontSize={11}
                                    fontWeight={500}
                                >
                                    {axis.length > 12 ? axis.substring(0, 10) + '...' : axis}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* Level labels */}
                <g className="level-labels">
                    {layout.levelValues.map((value, i) => {
                        const point = layout.getPoint(value, 0);
                        return (
                            <text
                                key={`level-label-${i}`}
                                x={point.x + 5}
                                y={point.y}
                                fill="#999"
                                fontSize={9}
                                dominantBaseline="middle"
                            >
                                {formatNumber(value, 0)}
                            </text>
                        );
                    })}
                </g>

                {/* Series areas */}
                <g className="series">
                    {series.map((s, seriesIdx) => {
                        const color = s.color || getColor(seriesIdx, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const isHovered = hoveredSeries === seriesIdx;

                        return (
                            <g key={`series-${seriesIdx}`}>
                                {/* Fill */}
                                <path
                                    d={seriesPath(s)}
                                    fill={color}
                                    fillOpacity={isHovered ? fillOpacity + 0.1 : fillOpacity}
                                    stroke={color}
                                    strokeWidth={isHovered ? 3 : 2}
                                    style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
                                    onMouseEnter={(e) => handleMouseMove(e, seriesIdx)}
                                    onMouseLeave={() => { setHoveredSeries(null); setHoveredPoint(null); }}
                                />

                                {/* Points */}
                                {s.data.map((d, pointIdx) => {
                                    const point = layout.getPoint(d.value, pointIdx);
                                    const isPointHovered = hoveredPoint?.seriesIdx === seriesIdx && hoveredPoint?.pointIdx === pointIdx;

                                    return (
                                        <g key={`point-${seriesIdx}-${pointIdx}`}>
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r={isPointHovered ? 6 : 4}
                                                fill={color}
                                                stroke="white"
                                                strokeWidth={2}
                                                style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                                                onMouseEnter={(e) => handleMouseMove(e, seriesIdx, pointIdx)}
                                                onMouseMove={(e) => handleMouseMove(e, seriesIdx, pointIdx)}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                                onClick={() => onPointClick?.(s, d)}
                                            />
                                            {showValues && (
                                                <text
                                                    x={point.x}
                                                    y={point.y - 10}
                                                    textAnchor="middle"
                                                    fill="#333"
                                                    fontSize={9}
                                                >
                                                    {formatNumber(d.value, 1)}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </g>

                {/* Legend */}
                {series.length > 1 && (
                    <g className="legend" transform={`translate(${width! - margin!.right + 10}, ${margin!.top})`}>
                        <rect
                            x={-5}
                            y={-5}
                            width={75}
                            height={series.length * 22 + 10}
                            fill="white"
                            fillOpacity={0.9}
                            stroke="#e0e0e0"
                            rx={4}
                        />
                        {series.map((s, i) => {
                            const color = s.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                            return (
                                <g
                                    key={`legend-${i}`}
                                    transform={`translate(0, ${i * 22})`}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => handleMouseMove(e, i)}
                                    onMouseLeave={() => { setHoveredSeries(null); setHoveredPoint(null); }}
                                >
                                    <rect
                                        x={0}
                                        y={0}
                                        width={14}
                                        height={14}
                                        fill={color}
                                        fillOpacity={hoveredSeries === i ? 1 : 0.8}
                                        rx={2}
                                    />
                                    <text
                                        x={20}
                                        y={7}
                                        dominantBaseline="middle"
                                        fill="#333"
                                        fontSize={10}
                                        fontWeight={hoveredSeries === i ? 600 : 400}
                                    >
                                        {s.label.length > 8 ? s.label.substring(0, 6) + '...' : s.label}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                <style>{`
                    .radar-chart {
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
                    <div style={{ fontWeight: 600 }}>{series[hoveredPoint.seriesIdx].label}</div>
                    <div>{series[hoveredPoint.seriesIdx].data[hoveredPoint.pointIdx].axis}</div>
                    <div>Value: {formatNumber(series[hoveredPoint.seriesIdx].data[hoveredPoint.pointIdx].value, 2)}</div>
                </div>
            )}
        </div>
    );
}
