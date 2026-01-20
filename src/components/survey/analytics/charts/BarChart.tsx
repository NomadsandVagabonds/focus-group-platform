'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartDataPoint, ChartConfig, COLOR_PALETTES } from './types';
import { getColor, niceAxisTicks, formatNumber } from './utils';

interface BarChartProps {
    data: ChartDataPoint[];
    config?: Partial<ChartConfig>;
    onBarClick?: (point: ChartDataPoint) => void;
    horizontal?: boolean;
    stacked?: boolean;
    grouped?: boolean;
    showValues?: boolean;
}

export default function BarChart({
    data,
    config,
    onBarClick,
    horizontal = false,
    stacked = false,
    grouped = false,
    showValues = false
}: BarChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredBar, setHoveredBar] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [tooltipData, setTooltipData] = useState<ChartDataPoint | null>(null);

    const defaultConfig: ChartConfig = {
        type: 'bar',
        width: 700,
        height: 400,
        margin: { top: 40, right: 40, bottom: 80, left: 70 },
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

        // Get unique categories and groups
        const categories = [...new Set(data.map(d => d.label))];
        const groups = [...new Set(data.map(d => d.group || 'default'))];

        // Calculate max value
        let maxValue = 0;
        if (stacked) {
            // For stacked, sum values per category
            for (const cat of categories) {
                const sum = data
                    .filter(d => d.label === cat)
                    .reduce((acc, d) => acc + d.value, 0);
                maxValue = Math.max(maxValue, sum);
            }
        } else {
            maxValue = Math.max(...data.map(d => d.value));
        }

        // Add some padding
        maxValue *= 1.1;

        const ticks = niceAxisTicks(0, maxValue, 6);
        const actualMax = ticks[ticks.length - 1];

        const barWidth = horizontal
            ? innerHeight / categories.length * 0.7
            : innerWidth / categories.length * 0.7;

        const groupBarWidth = grouped && groups.length > 1
            ? barWidth / groups.length
            : barWidth;

        return {
            categories,
            groups,
            maxValue: actualMax,
            ticks,
            barWidth,
            groupBarWidth,
            categoryScale: (cat: string) => {
                const idx = categories.indexOf(cat);
                const spacing = horizontal ? innerHeight : innerWidth;
                const step = spacing / categories.length;
                return (horizontal ? margin!.top : margin!.left) + step * idx + step / 2;
            },
            valueScale: (v: number) => {
                const t = v / actualMax;
                return horizontal
                    ? margin!.left + t * innerWidth
                    : height! - margin!.bottom - t * innerHeight;
            }
        };
    }, [data, innerWidth, innerHeight, height, margin, stacked, grouped, horizontal]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    const handleMouseMove = (e: React.MouseEvent, point: ChartDataPoint, barKey: string) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredBar(barKey);
        setTooltipData(point);
    };

    // Render bars based on mode
    const renderBars = () => {
        if (stacked) {
            return layout.categories.map((cat, catIdx) => {
                const categoryData = data.filter(d => d.label === cat);
                let stackOffset = 0;

                return categoryData.map((point, stackIdx) => {
                    const barKey = `${cat}-${stackIdx}`;
                    const isHovered = hoveredBar === barKey;
                    const color = point.color || getColor(stackIdx, cfg.colorScheme as keyof typeof COLOR_PALETTES);

                    const barStart = stackOffset;
                    stackOffset += point.value;

                    if (horizontal) {
                        const x = layout.valueScale(barStart);
                        const barLength = layout.valueScale(barStart + point.value) - layout.valueScale(barStart);
                        const y = layout.categoryScale(cat) - layout.barWidth / 2;

                        return (
                            <rect
                                key={barKey}
                                x={x}
                                y={y}
                                width={barLength}
                                height={layout.barWidth}
                                fill={color}
                                fillOpacity={isHovered ? 1 : 0.85}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                rx={2}
                                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                onMouseEnter={(e) => handleMouseMove(e, point, barKey)}
                                onMouseMove={(e) => handleMouseMove(e, point, barKey)}
                                onMouseLeave={() => setHoveredBar(null)}
                                onClick={() => onBarClick?.(point)}
                            />
                        );
                    } else {
                        const x = layout.categoryScale(cat) - layout.barWidth / 2;
                        const y = layout.valueScale(barStart + point.value);
                        const barHeight = layout.valueScale(barStart) - y;

                        return (
                            <rect
                                key={barKey}
                                x={x}
                                y={y}
                                width={layout.barWidth}
                                height={barHeight}
                                fill={color}
                                fillOpacity={isHovered ? 1 : 0.85}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                rx={2}
                                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                onMouseEnter={(e) => handleMouseMove(e, point, barKey)}
                                onMouseMove={(e) => handleMouseMove(e, point, barKey)}
                                onMouseLeave={() => setHoveredBar(null)}
                                onClick={() => onBarClick?.(point)}
                            />
                        );
                    }
                });
            });
        } else if (grouped && layout.groups.length > 1) {
            return layout.categories.map(cat => {
                return layout.groups.map((group, groupIdx) => {
                    const point = data.find(d => d.label === cat && d.group === group);
                    if (!point) return null;

                    const barKey = `${cat}-${group}`;
                    const isHovered = hoveredBar === barKey;
                    const color = point.color || getColor(groupIdx, cfg.colorScheme as keyof typeof COLOR_PALETTES);

                    const groupOffset = (groupIdx - (layout.groups.length - 1) / 2) * layout.groupBarWidth;

                    if (horizontal) {
                        const x = margin!.left;
                        const barLength = layout.valueScale(point.value) - margin!.left;
                        const y = layout.categoryScale(cat) + groupOffset - layout.groupBarWidth / 2;

                        return (
                            <g key={barKey}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barLength}
                                    height={layout.groupBarWidth - 2}
                                    fill={color}
                                    fillOpacity={isHovered ? 1 : 0.85}
                                    stroke={isHovered ? '#333' : 'white'}
                                    strokeWidth={isHovered ? 2 : 1}
                                    rx={2}
                                    style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                    onMouseEnter={(e) => handleMouseMove(e, point, barKey)}
                                    onMouseMove={(e) => handleMouseMove(e, point, barKey)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                    onClick={() => onBarClick?.(point)}
                                />
                                {showValues && barLength > 30 && (
                                    <text
                                        x={x + barLength - 5}
                                        y={y + layout.groupBarWidth / 2}
                                        textAnchor="end"
                                        dominantBaseline="middle"
                                        fill="white"
                                        fontSize={10}
                                        fontWeight={500}
                                    >
                                        {formatNumber(point.value, 1)}
                                    </text>
                                )}
                            </g>
                        );
                    } else {
                        const x = layout.categoryScale(cat) + groupOffset - layout.groupBarWidth / 2;
                        const y = layout.valueScale(point.value);
                        const barHeight = height! - margin!.bottom - y;

                        return (
                            <g key={barKey}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={layout.groupBarWidth - 2}
                                    height={barHeight}
                                    fill={color}
                                    fillOpacity={isHovered ? 1 : 0.85}
                                    stroke={isHovered ? '#333' : 'white'}
                                    strokeWidth={isHovered ? 2 : 1}
                                    rx={2}
                                    style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                    onMouseEnter={(e) => handleMouseMove(e, point, barKey)}
                                    onMouseMove={(e) => handleMouseMove(e, point, barKey)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                    onClick={() => onBarClick?.(point)}
                                />
                                {showValues && barHeight > 20 && (
                                    <text
                                        x={x + layout.groupBarWidth / 2}
                                        y={y + 15}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize={10}
                                        fontWeight={500}
                                    >
                                        {formatNumber(point.value, 1)}
                                    </text>
                                )}
                            </g>
                        );
                    }
                });
            });
        } else {
            // Simple bars
            return data.map((point, i) => {
                const barKey = `bar-${i}`;
                const isHovered = hoveredBar === barKey;
                const color = point.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);

                if (horizontal) {
                    const x = margin!.left;
                    const barLength = layout.valueScale(point.value) - margin!.left;
                    const y = layout.categoryScale(point.label) - layout.barWidth / 2;

                    return (
                        <g key={barKey}>
                            <rect
                                x={x}
                                y={y}
                                width={barLength}
                                height={layout.barWidth}
                                fill={color}
                                fillOpacity={isHovered ? 1 : 0.85}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                rx={2}
                                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                onMouseEnter={(e) => handleMouseMove(e, point, barKey)}
                                onMouseMove={(e) => handleMouseMove(e, point, barKey)}
                                onMouseLeave={() => setHoveredBar(null)}
                                onClick={() => onBarClick?.(point)}
                            />
                            {showValues && barLength > 30 && (
                                <text
                                    x={x + barLength - 5}
                                    y={y + layout.barWidth / 2}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize={10}
                                    fontWeight={500}
                                >
                                    {formatNumber(point.value, 1)}
                                </text>
                            )}
                        </g>
                    );
                } else {
                    const x = layout.categoryScale(point.label) - layout.barWidth / 2;
                    const y = layout.valueScale(point.value);
                    const barHeight = height! - margin!.bottom - y;

                    return (
                        <g key={barKey}>
                            <rect
                                x={x}
                                y={y}
                                width={layout.barWidth}
                                height={barHeight}
                                fill={color}
                                fillOpacity={isHovered ? 1 : 0.85}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                rx={2}
                                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                onMouseEnter={(e) => handleMouseMove(e, point, barKey)}
                                onMouseMove={(e) => handleMouseMove(e, point, barKey)}
                                onMouseLeave={() => setHoveredBar(null)}
                                onClick={() => onBarClick?.(point)}
                            />
                            {showValues && barHeight > 20 && (
                                <text
                                    x={x + layout.barWidth / 2}
                                    y={y + 15}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize={10}
                                    fontWeight={500}
                                >
                                    {formatNumber(point.value, 1)}
                                </text>
                            )}
                        </g>
                    );
                }
            });
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="bar-chart"
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

                {/* Bars */}
                <g className="bars">{renderBars()}</g>

                {/* Axes */}
                <g className="axes">
                    {horizontal ? (
                        <>
                            {/* X-axis (values) */}
                            <line
                                x1={margin!.left}
                                y1={height! - margin!.bottom}
                                x2={width! - margin!.right}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.ticks.map((tick, i) => (
                                <g key={`x-tick-${i}`} transform={`translate(${layout.valueScale(tick)}, ${height! - margin!.bottom})`}>
                                    <line y2={6} stroke="#333" />
                                    <text y={20} textAnchor="middle" fill="#666" fontSize={11}>
                                        {formatNumber(tick, 1)}
                                    </text>
                                </g>
                            ))}

                            {/* Y-axis (categories) */}
                            <line
                                x1={margin!.left}
                                y1={margin!.top}
                                x2={margin!.left}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.categories.map((cat, i) => (
                                <text
                                    key={`cat-${i}`}
                                    x={margin!.left - 10}
                                    y={layout.categoryScale(cat)}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fill="#333"
                                    fontSize={11}
                                >
                                    {cat.length > 15 ? cat.substring(0, 13) + '...' : cat}
                                </text>
                            ))}
                        </>
                    ) : (
                        <>
                            {/* X-axis (categories) */}
                            <line
                                x1={margin!.left}
                                y1={height! - margin!.bottom}
                                x2={width! - margin!.right}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.categories.map((cat, i) => (
                                <text
                                    key={`cat-${i}`}
                                    x={layout.categoryScale(cat)}
                                    y={height! - margin!.bottom + 15}
                                    textAnchor="middle"
                                    fill="#333"
                                    fontSize={11}
                                    transform={cat.length > 8 ? `rotate(-45, ${layout.categoryScale(cat)}, ${height! - margin!.bottom + 15})` : undefined}
                                    style={{ textAnchor: cat.length > 8 ? 'end' : 'middle' }}
                                >
                                    {cat.length > 12 ? cat.substring(0, 10) + '...' : cat}
                                </text>
                            ))}

                            {/* Y-axis (values) */}
                            <line
                                x1={margin!.left}
                                y1={margin!.top}
                                x2={margin!.left}
                                y2={height! - margin!.bottom}
                                stroke="#333"
                            />
                            {layout.ticks.map((tick, i) => (
                                <g key={`y-tick-${i}`} transform={`translate(${margin!.left}, ${layout.valueScale(tick)})`}>
                                    <line x2={-6} stroke="#333" />
                                    <text x={-10} textAnchor="end" dominantBaseline="middle" fill="#666" fontSize={11}>
                                        {formatNumber(tick, 1)}
                                    </text>
                                </g>
                            ))}
                        </>
                    )}
                </g>

                {/* Legend for grouped/stacked */}
                {(grouped || stacked) && layout.groups.length > 1 && (
                    <g className="legend" transform={`translate(${width! - margin!.right - 100}, ${margin!.top})`}>
                        <rect
                            x={-5}
                            y={-5}
                            width={100}
                            height={layout.groups.length * 20 + 10}
                            fill="white"
                            fillOpacity={0.9}
                            stroke="#e0e0e0"
                            rx={4}
                        />
                        {layout.groups.map((group, i) => {
                            const color = getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                            return (
                                <g key={`legend-${i}`} transform={`translate(0, ${i * 20})`}>
                                    <rect x={0} y={2} width={14} height={14} fill={color} rx={2} />
                                    <text x={20} y={10} dominantBaseline="middle" fill="#333" fontSize={11}>
                                        {group}
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
                    .bar-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredBar && tooltipData && (
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
                    <div style={{ fontWeight: 600 }}>{tooltipData.label}</div>
                    {tooltipData.group && <div>Group: {tooltipData.group}</div>}
                    <div>Value: {formatNumber(tooltipData.value, 2)}</div>
                </div>
            )}
        </div>
    );
}
