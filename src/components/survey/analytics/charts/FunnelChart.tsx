'use client';

import { useMemo, useRef, useState } from 'react';
import { ChartDataPoint, ChartConfig, COLOR_PALETTES } from './types';
import { getColor, formatNumber } from './utils';

// Vertical stage type
interface VerticalStage extends ChartDataPoint {
    topWidth: number;
    bottomWidth: number;
    y: number;
    height: number;
    percentage: number;
    conversionRate: number;
}

// Horizontal stage type
interface HorizontalStage extends ChartDataPoint {
    leftHeight: number;
    rightHeight: number;
    x: number;
    width: number;
    percentage: number;
    conversionRate: number;
}

interface FunnelChartProps {
    data: ChartDataPoint[];
    config?: Partial<ChartConfig>;
    onStageClick?: (point: ChartDataPoint, index: number) => void;
    showPercentages?: boolean;
    showConversion?: boolean;
    orientation?: 'vertical' | 'horizontal';
}

export default function FunnelChart({
    data,
    config,
    onStageClick,
    showPercentages = true,
    showConversion = true,
    orientation = 'vertical'
}: FunnelChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredStage, setHoveredStage] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const defaultConfig: ChartConfig = {
        type: 'funnel',
        width: orientation === 'vertical' ? 500 : 700,
        height: orientation === 'vertical' ? 500 : 350,
        margin: { top: 40, right: 120, bottom: 40, left: 120 },
        animate: true,
        colorScheme: 'editorial'
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    const layout = useMemo(() => {
        if (data.length === 0) return null;

        const maxValue = Math.max(...data.map(d => d.value));
        const stageCount = data.length;

        // Calculate stage dimensions
        const stageHeight = orientation === 'vertical'
            ? innerHeight / stageCount
            : innerWidth / stageCount;

        const stages = data.map((point, i) => {
            const widthRatio = point.value / maxValue;
            const nextWidthRatio = i < data.length - 1 ? data[i + 1].value / maxValue : widthRatio * 0.5;

            if (orientation === 'vertical') {
                const topWidth = widthRatio * innerWidth;
                const bottomWidth = nextWidthRatio * innerWidth;
                const y = margin!.top + i * stageHeight;

                return {
                    ...point,
                    topWidth,
                    bottomWidth,
                    y,
                    height: stageHeight,
                    percentage: (point.value / maxValue) * 100,
                    conversionRate: i > 0 ? (point.value / data[i - 1].value) * 100 : 100
                };
            } else {
                const leftHeight = widthRatio * innerHeight;
                const rightHeight = nextWidthRatio * innerHeight;
                const x = margin!.left + i * stageHeight;

                return {
                    ...point,
                    leftHeight,
                    rightHeight,
                    x,
                    width: stageHeight,
                    percentage: (point.value / maxValue) * 100,
                    conversionRate: i > 0 ? (point.value / data[i - 1].value) * 100 : 100
                };
            }
        });

        return {
            stages,
            maxValue,
            stageHeight
        };
    }, [data, innerWidth, innerHeight, margin, orientation]);

    if (!layout || data.length === 0) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available</p>
            </div>
        );
    }

    // Generate trapezoid path for vertical funnel
    const verticalStagePath = (stage: any, centerX: number): string => {
        const topLeft = centerX - stage.topWidth / 2;
        const topRight = centerX + stage.topWidth / 2;
        const bottomLeft = centerX - stage.bottomWidth / 2;
        const bottomRight = centerX + stage.bottomWidth / 2;

        return `
            M ${topLeft} ${stage.y}
            L ${topRight} ${stage.y}
            L ${bottomRight} ${stage.y + stage.height - 2}
            L ${bottomLeft} ${stage.y + stage.height - 2}
            Z
        `;
    };

    // Generate trapezoid path for horizontal funnel
    const horizontalStagePath = (stage: any, centerY: number): string => {
        const topTop = centerY - stage.leftHeight / 2;
        const topBottom = centerY + stage.leftHeight / 2;
        const bottomTop = centerY - stage.rightHeight / 2;
        const bottomBottom = centerY + stage.rightHeight / 2;

        return `
            M ${stage.x} ${topTop}
            L ${stage.x + stage.width - 2} ${bottomTop}
            L ${stage.x + stage.width - 2} ${bottomBottom}
            L ${stage.x} ${topBottom}
            Z
        `;
    };

    const handleMouseMove = (e: React.MouseEvent, index: number) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10
            });
        }
        setHoveredStage(index);
    };

    const centerX = margin!.left + innerWidth / 2;
    const centerY = margin!.top + innerHeight / 2;

    return (
        <div style={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="funnel-chart"
            >
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

                {/* Funnel stages */}
                <g className="stages">
                    {layout.stages.map((stage, i) => {
                        const color = stage.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                        const isHovered = hoveredStage === i;

                        return (
                            <g key={`stage-${i}`}>
                                <path
                                    d={orientation === 'vertical'
                                        ? verticalStagePath(stage, centerX)
                                        : horizontalStagePath(stage, centerY)
                                    }
                                    fill={color}
                                    fillOpacity={isHovered ? 1 : 0.85}
                                    stroke={isHovered ? '#333' : 'white'}
                                    strokeWidth={isHovered ? 2 : 1}
                                    style={{
                                        cursor: onStageClick ? 'pointer' : 'default',
                                        transition: 'fill-opacity 0.15s'
                                    }}
                                    onMouseEnter={(e) => handleMouseMove(e, i)}
                                    onMouseMove={(e) => handleMouseMove(e, i)}
                                    onMouseLeave={() => setHoveredStage(null)}
                                    onClick={() => onStageClick?.(stage, i)}
                                />

                                {/* Stage label */}
                                {orientation === 'vertical' ? (
                                    <>
                                        <text
                                            x={margin!.left - 10}
                                            y={(stage as any).y + layout.stageHeight / 2}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                            fill="#333"
                                            fontSize={12}
                                            fontWeight={isHovered ? 600 : 500}
                                        >
                                            {stage.label.length > 15 ? stage.label.substring(0, 13) + '...' : stage.label}
                                        </text>
                                        <text
                                            x={width! - margin!.right + 10}
                                            y={(stage as any).y + layout.stageHeight / 2 - 8}
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                            fill="#333"
                                            fontSize={13}
                                            fontWeight={600}
                                        >
                                            {formatNumber(stage.value, 0)}
                                        </text>
                                        {showPercentages && (
                                            <text
                                                x={width! - margin!.right + 10}
                                                y={(stage as any).y + layout.stageHeight / 2 + 10}
                                                textAnchor="start"
                                                dominantBaseline="middle"
                                                fill="#666"
                                                fontSize={11}
                                            >
                                                {formatNumber(stage.percentage, 1)}%
                                            </text>
                                        )}
                                        {showConversion && i > 0 && (
                                            <text
                                                x={centerX}
                                                y={(stage as any).y - 5}
                                                textAnchor="middle"
                                                fill={stage.conversionRate >= 50 ? '#28a745' : '#c94a4a'}
                                                fontSize={10}
                                                fontWeight={500}
                                            >
                                                ↓ {formatNumber(stage.conversionRate, 1)}%
                                            </text>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <text
                                            x={(stage as any).x + layout.stageHeight / 2}
                                            y={centerY + (stage as any).leftHeight / 2 + 20}
                                            textAnchor="middle"
                                            fill="#333"
                                            fontSize={11}
                                            fontWeight={isHovered ? 600 : 500}
                                        >
                                            {stage.label.length > 10 ? stage.label.substring(0, 8) + '...' : stage.label}
                                        </text>
                                        <text
                                            x={(stage as any).x + layout.stageHeight / 2}
                                            y={centerY - (stage as any).leftHeight / 2 - 20}
                                            textAnchor="middle"
                                            fill="#333"
                                            fontSize={12}
                                            fontWeight={600}
                                        >
                                            {formatNumber(stage.value, 0)}
                                        </text>
                                        {showPercentages && (
                                            <text
                                                x={(stage as any).x + layout.stageHeight / 2}
                                                y={centerY - (stage as any).leftHeight / 2 - 6}
                                                textAnchor="middle"
                                                fill="#666"
                                                fontSize={10}
                                            >
                                                ({formatNumber(stage.percentage, 1)}%)
                                            </text>
                                        )}
                                    </>
                                )}
                            </g>
                        );
                    })}
                </g>

                <style>{`
                    .funnel-chart {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                `}</style>
            </svg>

            {/* Tooltip */}
            {hoveredStage !== null && (
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
                    <div style={{ fontWeight: 600 }}>{layout.stages[hoveredStage].label}</div>
                    <div>Value: {formatNumber(layout.stages[hoveredStage].value, 0)}</div>
                    <div>Of total: {formatNumber(layout.stages[hoveredStage].percentage, 1)}%</div>
                    {hoveredStage > 0 && (
                        <div>Conversion: {formatNumber(layout.stages[hoveredStage].conversionRate, 1)}%</div>
                    )}
                </div>
            )}
        </div>
    );
}
