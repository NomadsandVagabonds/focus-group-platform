'use client';

import { useMemo, useRef } from 'react';
import { SankeyData, SankeyNode, SankeyLink, ChartConfig, COLOR_PALETTES } from './types';
import { getColor } from './utils';

interface SankeyChartProps {
    data: SankeyData;
    config?: Partial<ChartConfig>;
    onNodeClick?: (node: SankeyNode) => void;
    onLinkClick?: (link: SankeyLink) => void;
}

interface LayoutNode extends SankeyNode {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceLinks: LayoutLink[];
    targetLinks: LayoutLink[];
}

interface LayoutLink extends SankeyLink {
    sourceNode: LayoutNode;
    targetNode: LayoutNode;
    sy: number;
    ty: number;
    width: number;
}

export default function SankeyChart({ data, config, onNodeClick, onLinkClick }: SankeyChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    const defaultConfig: ChartConfig = {
        type: 'sankey',
        width: 800,
        height: 500,
        margin: { top: 20, right: 120, bottom: 20, left: 120 },
        showValues: true,
        animate: true,
        colorScheme: 'editorial',
        opacity: 0.6
    };

    const cfg = { ...defaultConfig, ...config };
    const { width, height, margin } = cfg;
    const innerWidth = width! - margin!.left - margin!.right;
    const innerHeight = height! - margin!.top - margin!.bottom;

    // Calculate Sankey layout
    const layout = useMemo(() => {
        if (!data.nodes.length || !data.links.length) return null;

        // Identify columns (stages)
        const nodesByColumn: Map<number, SankeyNode[]> = new Map();
        for (const node of data.nodes) {
            const col = node.column ?? 0;
            if (!nodesByColumn.has(col)) {
                nodesByColumn.set(col, []);
            }
            nodesByColumn.get(col)!.push(node);
        }

        // If no columns specified, infer from links
        if (nodesByColumn.size === 0 || (nodesByColumn.size === 1 && nodesByColumn.has(0))) {
            const sourceNodes = new Set(data.links.map(l => l.source));
            const targetNodes = new Set(data.links.map(l => l.target));

            const onlySource = data.nodes.filter(n => sourceNodes.has(n.id) && !targetNodes.has(n.id));
            const onlyTarget = data.nodes.filter(n => targetNodes.has(n.id) && !sourceNodes.has(n.id));
            const middle = data.nodes.filter(n => sourceNodes.has(n.id) && targetNodes.has(n.id));

            nodesByColumn.clear();
            if (onlySource.length) nodesByColumn.set(0, onlySource);
            if (middle.length) nodesByColumn.set(1, middle);
            if (onlyTarget.length) nodesByColumn.set(nodesByColumn.size, onlyTarget);

            // Simple 2-column case
            if (nodesByColumn.size === 0) {
                nodesByColumn.set(0, data.nodes.filter(n => sourceNodes.has(n.id)));
                nodesByColumn.set(1, data.nodes.filter(n => targetNodes.has(n.id) && !sourceNodes.has(n.id)));
            }
        }

        const columns = Array.from(nodesByColumn.keys()).sort((a, b) => a - b);
        const numColumns = columns.length;
        const nodeWidth = 20;
        const nodePadding = 15;
        const columnSpacing = (innerWidth - nodeWidth) / Math.max(1, numColumns - 1);

        // Create layout nodes with initial positions
        const layoutNodes: Map<string, LayoutNode> = new Map();

        for (const [colIndex, col] of columns.entries()) {
            const colNodes = nodesByColumn.get(col) || [];
            const x = margin!.left + colIndex * columnSpacing;

            // Calculate total value for this column
            let totalValue = 0;
            for (const node of colNodes) {
                const nodeValue = data.links
                    .filter(l => l.source === node.id || l.target === node.id)
                    .reduce((sum, l) => sum + l.value, 0);
                totalValue += nodeValue;
            }

            // Position nodes
            let y = margin!.top;
            const availableHeight = innerHeight - (colNodes.length - 1) * nodePadding;

            for (let i = 0; i < colNodes.length; i++) {
                const node = colNodes[i];
                const nodeValue = data.links
                    .filter(l => l.source === node.id || l.target === node.id)
                    .reduce((sum, l) => sum + l.value, 0);

                const nodeHeight = Math.max(5, (nodeValue / Math.max(1, totalValue)) * availableHeight);

                layoutNodes.set(node.id, {
                    ...node,
                    x,
                    y,
                    width: nodeWidth,
                    height: nodeHeight,
                    sourceLinks: [],
                    targetLinks: []
                });

                y += nodeHeight + nodePadding;
            }
        }

        // Create layout links
        const layoutLinks: LayoutLink[] = [];

        for (const link of data.links) {
            const sourceNode = layoutNodes.get(link.source);
            const targetNode = layoutNodes.get(link.target);

            if (!sourceNode || !targetNode) continue;

            const layoutLink: LayoutLink = {
                ...link,
                sourceNode,
                targetNode,
                sy: 0,
                ty: 0,
                width: 0
            };

            sourceNode.sourceLinks.push(layoutLink);
            targetNode.targetLinks.push(layoutLink);
            layoutLinks.push(layoutLink);
        }

        // Calculate link positions within nodes
        for (const node of layoutNodes.values()) {
            // Sort links by target/source position
            node.sourceLinks.sort((a, b) => a.targetNode.y - b.targetNode.y);
            node.targetLinks.sort((a, b) => a.sourceNode.y - b.sourceNode.y);

            // Position source links
            let sy = 0;
            const sourceTotalValue = node.sourceLinks.reduce((sum, l) => sum + l.value, 0);
            for (const link of node.sourceLinks) {
                link.sy = node.y + sy * node.height / Math.max(1, sourceTotalValue);
                link.width = (link.value / Math.max(1, sourceTotalValue)) * node.height;
                sy += link.value;
            }

            // Position target links
            let ty = 0;
            const targetTotalValue = node.targetLinks.reduce((sum, l) => sum + l.value, 0);
            for (const link of node.targetLinks) {
                link.ty = node.y + ty * node.height / Math.max(1, targetTotalValue);
                ty += link.value;
            }
        }

        return {
            nodes: Array.from(layoutNodes.values()),
            links: layoutLinks
        };
    }, [data, innerWidth, innerHeight, margin]);

    if (!layout || layout.nodes.length === 0) {
        return (
            <div className="sankey-empty" style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>No data available for Sankey diagram</p>
            </div>
        );
    }

    // Generate link path
    const linkPath = (link: LayoutLink) => {
        const sourceX = link.sourceNode.x + link.sourceNode.width;
        const targetX = link.targetNode.x;
        const sy = link.sy + link.width / 2;
        const ty = link.ty + link.width / 2;

        const curvature = 0.5;
        const xi = (sourceX + targetX) * curvature;

        return `M${sourceX},${sy}
                C${xi},${sy} ${xi},${ty} ${targetX},${ty}`;
    };

    const colors = COLOR_PALETTES[cfg.colorScheme as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.editorial;

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="sankey-chart"
        >
            <defs>
                {layout.links.map((link, i) => {
                    const sourceColor = link.sourceNode.color || getColor(layout.nodes.indexOf(link.sourceNode), cfg.colorScheme as keyof typeof COLOR_PALETTES);
                    const targetColor = link.targetNode.color || getColor(layout.nodes.indexOf(link.targetNode), cfg.colorScheme as keyof typeof COLOR_PALETTES);
                    return (
                        <linearGradient
                            key={`gradient-${i}`}
                            id={`link-gradient-${i}`}
                            gradientUnits="userSpaceOnUse"
                            x1={link.sourceNode.x + link.sourceNode.width}
                            y1={link.sy}
                            x2={link.targetNode.x}
                            y2={link.ty}
                        >
                            <stop offset="0%" stopColor={sourceColor} />
                            <stop offset="100%" stopColor={targetColor} />
                        </linearGradient>
                    );
                })}
            </defs>

            {/* Links */}
            <g className="sankey-links">
                {layout.links.map((link, i) => (
                    <path
                        key={`link-${i}`}
                        d={linkPath(link)}
                        fill="none"
                        stroke={`url(#link-gradient-${i})`}
                        strokeWidth={Math.max(1, link.width)}
                        strokeOpacity={cfg.opacity}
                        style={{ cursor: onLinkClick ? 'pointer' : 'default' }}
                        onClick={() => onLinkClick?.(link)}
                    >
                        <title>{`${link.sourceNode.label} → ${link.targetNode.label}: ${link.value}`}</title>
                    </path>
                ))}
            </g>

            {/* Nodes */}
            <g className="sankey-nodes">
                {layout.nodes.map((node, i) => {
                    const color = node.color || getColor(i, cfg.colorScheme as keyof typeof COLOR_PALETTES);
                    return (
                        <g
                            key={node.id}
                            style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                            onClick={() => onNodeClick?.(node)}
                        >
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                fill={color}
                                stroke="#fff"
                                strokeWidth={1}
                                rx={2}
                            />
                            <text
                                x={node.x < innerWidth / 2 ? node.x - 6 : node.x + node.width + 6}
                                y={node.y + node.height / 2}
                                dy="0.35em"
                                textAnchor={node.x < innerWidth / 2 ? 'end' : 'start'}
                                fill="#333"
                                fontSize={12}
                                fontWeight={500}
                            >
                                {node.label}
                            </text>
                            {cfg.showValues && (
                                <text
                                    x={node.x < innerWidth / 2 ? node.x - 6 : node.x + node.width + 6}
                                    y={node.y + node.height / 2 + 14}
                                    dy="0.35em"
                                    textAnchor={node.x < innerWidth / 2 ? 'end' : 'start'}
                                    fill="#666"
                                    fontSize={10}
                                >
                                    {node.sourceLinks.reduce((sum, l) => sum + l.value, 0) ||
                                        node.targetLinks.reduce((sum, l) => sum + l.value, 0)}
                                </text>
                            )}
                            <title>{node.label}</title>
                        </g>
                    );
                })}
            </g>

            <style>{`
                .sankey-chart {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                .sankey-links path {
                    transition: stroke-opacity 0.2s;
                }
                .sankey-links path:hover {
                    stroke-opacity: 0.8;
                }
                .sankey-nodes rect {
                    transition: opacity 0.2s;
                }
                .sankey-nodes g:hover rect {
                    opacity: 0.8;
                }
            `}</style>
        </svg>
    );
}
