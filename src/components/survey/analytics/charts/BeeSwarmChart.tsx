'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, ChartDataPoint, COLOR_PALETTES } from './types';
import { getColor, beeSwarmPositions, niceAxisTicks, formatNumber } from './utils';

interface BeeSwarmChartProps {
    data: ChartDataPoint[];
    config?: Partial<ChartConfig>;
    onPointClick?: (point: ChartDataPoint) => void;
}

export default function BeeSwarmChart({ data, config, onPointClick }: BeeSwarmChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'bee_swarm',
        width: 700,
        height: 400,
        margin: { top: 40, right: 40, bottom: 60, left: 60 },
        showGrid: true,
        animate: true,
        colorScheme: 'editorial',
        xAxisLabel: 'Value',
        yAxisLabel: ''
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    // Calculate layout
    const layout = useMemo(() => {
        if (data.length === 0) return null;

        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        // Scale values to pixel positions
        const scale = (v: number) => margin!.left + ((v - min) / range) * innerWidth;

        // Get groups
        const groups = [...new Set(data.map(d => d.group || 'default'))];
        const groupHeight = innerHeight / groups.length;

        // Calculate positions for each group
        const positioned: { point: ChartDataPoint; x: number; y: number; r: number }[] = [];

        for (let gi = 0; gi < groups.length; gi++) {
            const group = groups[gi];
            const groupPoints = data.filter(d => (d.group || 'default') === group);
            const groupCenterY = margin!.top + gi * groupHeight + groupHeight / 2;

            // Calculate bee swarm positions
            const points = groupPoints.map(p => ({ value: scale(p.value), group: p.group }));
            const swarmPos = beeSwarmPositions(points, 5, groupHeight * 0.8);

            for (let i = 0; i < groupPoints.length; i++) {
                positioned.push({
                    point: groupPoints[i],
                    x: swarmPos[i].x,
                    y: groupCenterY + swarmPos[i].y,
                    r: 5
                });
            }
        }

        return {
            positions: positioned,
            groups,
            min,
            max,
            ticks: niceAxisTicks(min, max, 6),
            scale,
            groupHeight
        };
    }, [data, innerWidth, innerHeight, margin]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    const colors = COLOR_PALETTES[cfg.colorScheme as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.editorial;

    const handleMouseMove = (e: React.MouseEvent, point: ChartDataPoint) => {
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
                className="bee-swarm-chart"
            >
                {/* Grid lines */}
                {cfg.showGrid && (
                    <g className="grid">
                        {layout.ticks.map((tick, i) => (
                            <line
                                key={`grid-${i}`}
                                x1={layout.scale(tick)}
                                y1={margin!.top}
                                x2={layout.scale(tick)}
                                y2={height! - margin!.bottom}
                                stroke="#e5e5e5"
                                strokeDasharray="3,3"
                            />
                        ))}
                    </g>
                )}

                {/* X-axis */}
                <g className="x-axis">
                    <line
                        x1={margin!.left}
                        y1={height! - margin!.bottom}
                        x2={width! - margin!.right}
                        y2={height! - margin!.bottom}
                        stroke="#333"
                    />
                    {layout.ticks.map((tick, i) => (
                        <g key={`tick-${i}`} transform={`translate(${layout.scale(tick)}, ${height! - margin!.bottom})`}>
                            <line y2={6} stroke="#333" />
                            <text
                                y={20}
                                textAnchor="middle"
                                fill="#666"
                                fontSize={11}
                            >
                                {formatNumber(tick, 0)}
                            </text>
                        </g>
                    ))}
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
                </g>

                {/* Group labels (Y-axis) */}
                {layout.groups.length > 1 && (
                    <g className="y-axis">
                        {layout.groups.map((group, i) => (
                            <text
                                key={`group-${i}`}
                                x={margin!.left - 10}
                                y={margin!.top + i * layout.groupHeight + layout.groupHeight / 2}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fill="#333"
                                fontSize={12}
                            >
                                {group}
                            </text>
                        ))}
                    </g>
                )}

                {/* Group separators */}
                {layout.groups.length > 1 && (
                    <g className="group-separators">
                        {layout.groups.slice(1).map((_, i) => (
                            <line
                                key={`sep-${i}`}
                                x1={margin!.left}
                                y1={margin!.top + (i + 1) * layout.groupHeight}
                                x2={width! - margin!.right}
                                y2={margin!.top + (i + 1) * layout.groupHeight}
                                stroke="#e0e0e0"
                                strokeDasharray="5,5"
                            />
                        ))}
                    </g>
                )}

                {/* Points */}
                <g className="points">
                    {layout.positions.map((pos, i) => {
                        const groupIndex = layout.groups.indexOf(pos.point.group || 'default');
                        const color = pos.point.color || getColor(groupIndex, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const isHovered = hoveredPoint === pos.point;

                        return (
                            <circle
                                key={`point-${i}`}
                                cx={pos.x}
                                cy={pos.y}
                                r={isHovered ? pos.r * 1.5 : pos.r}
                                fill={color}
                                fillOpacity={isHovered ? 1 : 0.7}
                                stroke={isHovered ? '#333' : 'white'}
                                strokeWidth={isHovered ? 2 : 1}
                                style={{
                                    cursor: onPointClick ? 'pointer' : 'default',
                                    transition: 'r 0.15s, fill-opacity 0.15s'
                                }}
                                onMouseEnter={(e) => handleMouseMove(e, pos.point)}
                                onMouseMove={(e) => handleMouseMove(e, pos.point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                onClick={() => onPointClick?.(pos.point)}
                            />
                        );
                    })}
                </g>

                {/* Title */}
                {cfg.title && (
                    <text
                        x={width! / 2}
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
                    .bee-swarm-chart {
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
                    <div style={{ fontWeight: 600 }}>{hoveredPoint.label}</div>
                    <div>Value: {hoveredPoint.value}</div>
                    {hoveredPoint.group && <div>Group: {hoveredPoint.group}</div>}
                </div>
            )}
        </div>
    );
}
