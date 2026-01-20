'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartConfig, COLOR_PALETTES } from './types';
import { formatNumber } from './utils';

interface HeatmapCell {
    row: string;
    col: string;
    value: number;
    label?: string;
}

interface HeatmapChartProps {
    data: HeatmapCell[];
    config?: Partial<ChartConfig>;
    onCellClick?: (cell: HeatmapCell) => void;
    showValues?: boolean;
    colorScale?: 'sequential' | 'diverging';
    minValue?: number;
    maxValue?: number;
}

export default function HeatmapChart({
    data,
    config,
    onCellClick,
    showValues = true,
    colorScale = 'sequential',
    minValue,
    maxValue
}: HeatmapChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'heatmap',
        width: 700,
        height: 500,
        margin: { top: 60, right: 80, bottom: 80, left: 120 },
        animate: true,
        colorScheme: 'sequential'
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    const layout = useMemo(() => {
        if (data.length === 0) return null;

        const rows = [...new Set(data.map(d => d.row))];
        const cols = [...new Set(data.map(d => d.col))];

        const values = data.map(d => d.value);
        const min = minValue ?? Math.min(...values);
        const max = maxValue ?? Math.max(...values);

        const cellWidth = innerWidth / cols.length;
        const cellHeight = innerHeight / rows.length;

        // Create a map for quick lookup
        const cellMap = new Map<string, HeatmapCell>();
        for (const cell of data) {
            cellMap.set(`${cell.row}-${cell.col}`, cell);
        }

        return {
            rows,
            cols,
            min,
            max,
            cellWidth,
            cellHeight,
            cellMap
        };
    }, [data, innerWidth, innerHeight, minValue, maxValue]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    // Color interpolation
    const getColor = (value: number): string => {
        const t = layout.max === layout.min ? 0.5 : (value - layout.min) / (layout.max - layout.min);

        if (colorScale === 'diverging') {
            // Blue -> White -> Red
            if (t < 0.5) {
                const s = t * 2;
                const r = Math.round(59 + (255 - 59) * s);
                const g = Math.round(130 + (255 - 130) * s);
                const b = Math.round(246 + (255 - 246) * s);
                return `rgb(${r},${g},${b})`;
            } else {
                const s = (t - 0.5) * 2;
                const r = Math.round(255 - (255 - 201) * s);
                const g = Math.round(255 - (255 - 74) * s);
                const b = Math.round(255 - (255 - 74) * s);
                return `rgb(${r},${g},${b})`;
            }
        } else {
            // Sequential: Light -> Dark (editorial theme)
            const r = Math.round(255 - (255 - 201) * t);
            const g = Math.round(245 - (245 - 74) * t);
            const b = Math.round(235 - (235 - 74) * t);
            return `rgb(${r},${g},${b})`;
        }
    };

    const getTextColor = (value: number): string => {
        const t = layout.max === layout.min ? 0.5 : (value - layout.min) / (layout.max - layout.min);
        return t > 0.6 ? '#fff' : '#333';
    };

    const handleMouseMove = (e: React.MouseEvent, cell: HeatmapCell) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredCell(cell);
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="heatmap-chart"
            >
                {/* Title */}
                {cfg.title && (
                    <text
                        x={margin!.left + innerWidth / 2}
                        y={25}
                        textAnchor="middle"
                        fill="#1a1d24"
                        fontSize={16}
                        fontWeight={600}
                    >
                        {cfg.title}
                    </text>
                )}

                {/* Column labels (top) */}
                <g className="col-labels">
                    {layout.cols.map((col, i) => (
                        <text
                            key={`col-${i}`}
                            x={margin!.left + i * layout.cellWidth + layout.cellWidth / 2}
                            y={margin!.top - 10}
                            textAnchor="middle"
                            fill="#333"
                            fontSize={11}
                            fontWeight={500}
                        >
                            {col.length > 12 ? col.substring(0, 10) + '...' : col}
                        </text>
                    ))}
                </g>

                {/* Row labels (left) */}
                <g className="row-labels">
                    {layout.rows.map((row, i) => (
                        <text
                            key={`row-${i}`}
                            x={margin!.left - 10}
                            y={margin!.top + i * layout.cellHeight + layout.cellHeight / 2}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fill="#333"
                            fontSize={11}
                            fontWeight={500}
                        >
                            {row.length > 15 ? row.substring(0, 13) + '...' : row}
                        </text>
                    ))}
                </g>

                {/* Cells */}
                <g className="cells">
                    {layout.rows.map((row, rowIndex) =>
                        layout.cols.map((col, colIndex) => {
                            const cell = layout.cellMap.get(`${row}-${col}`);
                            if (!cell) return null;

                            const x = margin!.left + colIndex * layout.cellWidth;
                            const y = margin!.top + rowIndex * layout.cellHeight;
                            const isHovered = hoveredCell === cell;

                            return (
                                <g key={`cell-${rowIndex}-${colIndex}`}>
                                    <rect
                                        x={x + 1}
                                        y={y + 1}
                                        width={layout.cellWidth - 2}
                                        height={layout.cellHeight - 2}
                                        fill={getColor(cell.value)}
                                        stroke={isHovered ? '#333' : '#fff'}
                                        strokeWidth={isHovered ? 2 : 1}
                                        rx={2}
                                        style={{
                                            cursor: onCellClick ? 'pointer' : 'default',
                                            transition: 'stroke 0.15s'
                                        }}
                                        onMouseEnter={(e) => handleMouseMove(e, cell)}
                                        onMouseMove={(e) => handleMouseMove(e, cell)}
                                        onMouseLeave={() => setHoveredCell(null)}
                                        onClick={() => onCellClick?.(cell)}
                                    />
                                    {showValues && layout.cellWidth > 30 && layout.cellHeight > 20 && (
                                        <text
                                            x={x + layout.cellWidth / 2}
                                            y={y + layout.cellHeight / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill={getTextColor(cell.value)}
                                            fontSize={10}
                                            fontWeight={500}
                                            pointerEvents="none"
                                        >
                                            {formatNumber(cell.value, 1)}
                                        </text>
                                    )}
                                </g>
                            );
                        })
                    )}
                </g>

                {/* Color legend */}
                <g className="legend" transform={`translate(${width! - margin!.right + 20}, ${margin!.top})`}>
                    <defs>
                        <linearGradient id="heatmap-gradient" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor={getColor(layout.min)} />
                            <stop offset="50%" stopColor={getColor((layout.min + layout.max) / 2)} />
                            <stop offset="100%" stopColor={getColor(layout.max)} />
                        </linearGradient>
                    </defs>
                    <rect
                        x={0}
                        y={0}
                        width={15}
                        height={innerHeight}
                        fill="url(#heatmap-gradient)"
                        stroke="#e0e0e0"
                        rx={2}
                    />
                    <text x={20} y={5} fill="#666" fontSize={10} dominantBaseline="hanging">
                        {formatNumber(layout.max, 1)}
                    </text>
                    <text x={20} y={innerHeight / 2} fill="#666" fontSize={10} dominantBaseline="middle">
                        {formatNumber((layout.min + layout.max) / 2, 1)}
                    </text>
                    <text x={20} y={innerHeight - 5} fill="#666" fontSize={10} dominantBaseline="auto">
                        {formatNumber(layout.min, 1)}
                    </text>
                </g>

                <style>{`
                    .heatmap-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredCell && (
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
                    <div style={{ fontWeight: 600 }}>{hoveredCell.row} × {hoveredCell.col}</div>
                    <div>Value: {formatNumber(hoveredCell.value, 2)}</div>
                    {hoveredCell.label && <div>{hoveredCell.label}</div>}
                </div>
            )}
        </div>
    );
}
