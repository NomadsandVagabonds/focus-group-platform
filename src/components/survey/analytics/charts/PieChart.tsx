'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartDataPoint, ChartConfig, COLOR_PALETTES } from './types';
import { getColor, formatNumber } from './utils';

interface PieChartProps {
    data: ChartDataPoint[];
    config?: Partial<ChartConfig>;
    onSliceClick?: (point: ChartDataPoint) => void;
    donut?: boolean;
    innerRadiusRatio?: number;
    showLabels?: boolean;
    showPercentages?: boolean;
    showLegend?: boolean;
}

export default function PieChart({
    data,
    config,
    onSliceClick,
    donut = false,
    innerRadiusRatio = 0.5,
    showLabels = true,
    showPercentages = true,
    showLegend = true
}: PieChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: donut ? 'donut' : 'pie',
        width: 500,
        height: 400,
        margin: { top: 40, right: showLegend ? 150 : 40, bottom: 40, left: 40 },
        animate: true,
        colorScheme: 'editorial'
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    const layout = useMemo(() => {
        if (data.length === 0) return null;

        const total = data.reduce((sum, d) => sum + d.value, 0);
        const centerX = margin!.left + innerWidth / 2;
        const centerY = margin!.top + innerHeight / 2;
        const radius = Math.min(innerWidth, innerHeight) / 2 - 10;
        const innerRadius = donut ? radius * innerRadiusRatio : 0;

        // Calculate angles for each slice
        let currentAngle = -Math.PI / 2; // Start from top
        const slices = data.map((point, i) => {
            const angle = (point.value / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const midAngle = (startAngle + endAngle) / 2;

            return {
                ...point,
                startAngle,
                endAngle,
                midAngle,
                percentage: (point.value / total) * 100
            };
        });

        return {
            centerX,
            centerY,
            radius,
            innerRadius,
            total,
            slices
        };
    }, [data, innerWidth, innerHeight, margin, donut, innerRadiusRatio]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    // Generate arc path
    const arcPath = (
        startAngle: number,
        endAngle: number,
        outerRadius: number,
        innerRadius: number
    ): string => {
        const startOuter = {
            x: layout.centerX + Math.cos(startAngle) * outerRadius,
            y: layout.centerY + Math.sin(startAngle) * outerRadius
        };
        const endOuter = {
            x: layout.centerX + Math.cos(endAngle) * outerRadius,
            y: layout.centerY + Math.sin(endAngle) * outerRadius
        };
        const startInner = {
            x: layout.centerX + Math.cos(endAngle) * innerRadius,
            y: layout.centerY + Math.sin(endAngle) * innerRadius
        };
        const endInner = {
            x: layout.centerX + Math.cos(startAngle) * innerRadius,
            y: layout.centerY + Math.sin(startAngle) * innerRadius
        };

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        if (innerRadius === 0) {
            // Pie slice
            return `
                M ${layout.centerX} ${layout.centerY}
                L ${startOuter.x} ${startOuter.y}
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
                Z
            `;
        } else {
            // Donut arc
            return `
                M ${startOuter.x} ${startOuter.y}
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
                L ${startInner.x} ${startInner.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}
                Z
            `;
        }
    };

    const handleMouseMove = (e: React.MouseEvent, index: number) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredSlice(index);
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="pie-chart"
            >
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

                {/* Slices */}
                <g className="slices">
                    {layout.slices.map((slice, i) => {
                        const color = slice.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const isHovered = hoveredSlice === i;
                        const hoverOffset = isHovered ? 8 : 0;

                        // Calculate offset for hover effect
                        const offsetX = Math.cos(slice.midAngle) * hoverOffset;
                        const offsetY = Math.sin(slice.midAngle) * hoverOffset;

                        return (
                            <g
                                key={`slice-${i}`}
                                transform={`translate(${offsetX}, ${offsetY})`}
                                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                                onMouseEnter={(e) => handleMouseMove(e, i)}
                                onMouseMove={(e) => handleMouseMove(e, i)}
                                onMouseLeave={() => setHoveredSlice(null)}
                                onClick={() => onSliceClick?.(slice)}
                            >
                                <path
                                    d={arcPath(slice.startAngle, slice.endAngle, layout.radius, layout.innerRadius)}
                                    fill={color}
                                    fillOpacity={isHovered ? 1 : 0.9}
                                    stroke="white"
                                    strokeWidth={2}
                                />
                            </g>
                        );
                    })}
                </g>

                {/* Labels */}
                {showLabels && layout.slices.map((slice, i) => {
                    if (slice.percentage < 5) return null; // Skip small slices

                    const labelRadius = layout.radius + 25;
                    const x = layout.centerX + Math.cos(slice.midAngle) * labelRadius;
                    const y = layout.centerY + Math.sin(slice.midAngle) * labelRadius;
                    const textAnchor = Math.cos(slice.midAngle) > 0 ? 'start' : 'end';

                    return (
                        <g key={`label-${i}`}>
                            {/* Leader line */}
                            <line
                                x1={layout.centerX + Math.cos(slice.midAngle) * (layout.radius + 5)}
                                y1={layout.centerY + Math.sin(slice.midAngle) * (layout.radius + 5)}
                                x2={layout.centerX + Math.cos(slice.midAngle) * (labelRadius - 5)}
                                y2={layout.centerY + Math.sin(slice.midAngle) * (labelRadius - 5)}
                                stroke="#999"
                                strokeWidth={1}
                            />
                            <text
                                x={x}
                                y={y}
                                textAnchor={textAnchor}
                                dominantBaseline="middle"
                                fill="#333"
                                fontSize={11}
                            >
                                {slice.label.length > 15 ? slice.label.substring(0, 13) + '...' : slice.label}
                            </text>
                            {showPercentages && (
                                <text
                                    x={x}
                                    y={y + 14}
                                    textAnchor={textAnchor}
                                    dominantBaseline="middle"
                                    fill="#666"
                                    fontSize={10}
                                >
                                    {formatNumber(slice.percentage, 1)}%
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Center label for donut */}
                {donut && (
                    <g className="center-label">
                        <text
                            x={layout.centerX}
                            y={layout.centerY - 5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#333"
                            fontSize={20}
                            fontWeight={600}
                        >
                            {formatNumber(layout.total, 0)}
                        </text>
                        <text
                            x={layout.centerX}
                            y={layout.centerY + 15}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#666"
                            fontSize={11}
                        >
                            Total
                        </text>
                    </g>
                )}

                {/* Legend */}
                {showLegend && (
                    <g className="legend" transform={`translate(${width! - margin!.right + 20}, ${margin!.top})`}>
                        {layout.slices.map((slice, i) => {
                            const color = slice.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                            return (
                                <g
                                    key={`legend-${i}`}
                                    transform={`translate(0, ${i * 22})`}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => handleMouseMove(e, i)}
                                    onMouseLeave={() => setHoveredSlice(null)}
                                >
                                    <rect
                                        x={0}
                                        y={0}
                                        width={14}
                                        height={14}
                                        fill={color}
                                        rx={2}
                                        fillOpacity={hoveredSlice === i ? 1 : 0.9}
                                    />
                                    <text
                                        x={20}
                                        y={7}
                                        dominantBaseline="middle"
                                        fill="#333"
                                        fontSize={11}
                                        fontWeight={hoveredSlice === i ? 600 : 400}
                                    >
                                        {slice.label.length > 12 ? slice.label.substring(0, 10) + '...' : slice.label}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                <style>{`
                    .pie-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                    .slices path {
                        transition: transform 0.15s;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredSlice !== null && (
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
                    <div style={{ fontWeight: 600 }}>{layout.slices[hoveredSlice].label}</div>
                    <div>Value: {formatNumber(layout.slices[hoveredSlice].value, 2)}</div>
                    <div>Percentage: {formatNumber(layout.slices[hoveredSlice].percentage, 1)}%</div>
                </div>
            )}
        </div>
    );
}
