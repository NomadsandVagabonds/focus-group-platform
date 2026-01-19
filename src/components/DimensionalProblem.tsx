import React, { useState, useEffect } from 'react';

// Pure Sankey visualization - no titles, just the interactive chart
const DimensionalProblem = () => {
    const [animated, setAnimated] = useState(false);
    const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 200);
        return () => clearTimeout(timer);
    }, []);

    // AI concern types - Pew data
    const aiContentTypes = [
        {
            id: 'human', name: 'Erodes Human Abilities', pct: 27, color: '#4a6fa5',
            flows: { alarmed: 22, concerned: 35, cautious: 28, disengaged: 9, doubtful: 4, dismissive: 2 }
        },
        {
            id: 'misinfo', name: 'Misinformation', pct: 18, color: '#7c6a9c',
            flows: { alarmed: 30, concerned: 38, cautious: 22, disengaged: 6, doubtful: 3, dismissive: 1 }
        },
        {
            id: 'control', name: 'Loss of Control', pct: 17, color: '#a63d40',
            flows: { alarmed: 48, concerned: 32, cautious: 14, disengaged: 3, doubtful: 2, dismissive: 1 }
        },
        {
            id: 'badactors', name: 'Scams & Hacking', pct: 11, color: '#5a8f7b',
            flows: { alarmed: 22, concerned: 35, cautious: 28, disengaged: 9, doubtful: 4, dismissive: 2 }
        },
        {
            id: 'jobs', name: 'Job Loss', pct: 9, color: '#b8860b',
            flows: { alarmed: 18, concerned: 30, cautious: 32, disengaged: 12, doubtful: 5, dismissive: 3 }
        },
        {
            id: 'trust', name: 'Distrust of Tech', pct: 9, color: '#8b6b61',
            flows: { alarmed: 25, concerned: 30, cautious: 24, disengaged: 10, doubtful: 7, dismissive: 4 }
        },
    ];

    const intensitySegments = [
        { id: 'alarmed', name: 'Very High', pct: 25, color: '#1e3a2f' },
        { id: 'concerned', name: 'High', pct: 32, color: '#2d5a47' },
        { id: 'cautious', name: 'Medium', pct: 26, color: '#5a7c6f' },
        { id: 'disengaged', name: 'Not Sure', pct: 11, color: '#8b8b8b' },
        { id: 'doubtful', name: 'Low', pct: 4, color: '#a67c52' },
        { id: 'dismissive', name: 'Very Low', pct: 1, color: '#8b3a3a' },
    ];

    const sankeyConfig = {
        width: 600,
        height: 340,
        leftX: 120,
        rightX: 480,
        nodeWidth: 14,
        startY: 20,
        totalHeight: 300,
        minNodeHeight: 16,
    };

    const getNodePositions = () => {
        const { startY, totalHeight, minNodeHeight } = sankeyConfig;

        let leftY = startY;
        const leftNodes = aiContentTypes.map(type => {
            const height = Math.max((type.pct / 100) * totalHeight * 0.92, minNodeHeight);
            const node = { ...type, y: leftY, height };
            leftY += height + 2;
            return node;
        });

        const flowTotals: Record<string, number> = {};
        intensitySegments.forEach(seg => flowTotals[seg.id] = 0);

        aiContentTypes.forEach(type => {
            Object.keys(type.flows).forEach(targetId => {
                flowTotals[targetId] += (type.pct * type.flows[targetId as keyof typeof type.flows]) / 100;
            });
        });

        let rightY = startY;
        const rightNodes = intensitySegments.map(level => {
            const naturalHeight = (level.pct / 100) * totalHeight * 0.92;
            const height = Math.max(naturalHeight, minNodeHeight);
            const flowTotal = flowTotals[level.id];
            const flowNaturalHeight = (flowTotal / 100) * totalHeight * 0.92;
            const flowScale = flowNaturalHeight > 0 ? height / flowNaturalHeight : 1;

            const node = { ...level, y: rightY, height, flowScale };
            rightY += height + 4;
            return node;
        });

        return { leftNodes, rightNodes };
    };

    const { leftNodes, rightNodes } = getNodePositions();

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #faf9f6 0%, #f5f3ef 100%)',
            borderRadius: '16px',
        }}>
            <svg
                viewBox={`0 0 ${sankeyConfig.width} ${sankeyConfig.height}`}
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Flow paths */}
                {(() => {
                    const paths: JSX.Element[] = [];
                    const targetOffsets: Record<string, number> = {};
                    intensitySegments.forEach(seg => targetOffsets[seg.id] = 0);

                    leftNodes.forEach((sourceNode, sourceIdx) => {
                        let sourceOffset = 0;

                        intensitySegments.forEach(intensity => {
                            const targetNode = rightNodes.find(n => n.id === intensity.id);
                            if (!targetNode) return;
                            const flowPct = sourceNode.flows[intensity.id as keyof typeof sourceNode.flows];
                            if (!flowPct) return;

                            const sourceFlowHeight = (flowPct / 100) * sourceNode.height;
                            if (sourceFlowHeight < 0.5) return;

                            const targetFlowHeight = sourceFlowHeight * targetNode.flowScale;

                            const x1 = sankeyConfig.leftX + sankeyConfig.nodeWidth;
                            const y1Start = sourceNode.y + sourceOffset;
                            const y1End = y1Start + sourceFlowHeight;

                            const x2 = sankeyConfig.rightX;
                            const y2Start = targetNode.y + targetOffsets[intensity.id];
                            const y2End = y2Start + targetFlowHeight;

                            const midX = (x1 + x2) / 2;

                            const pathD = `
                M ${x1} ${y1Start}
                C ${midX} ${y1Start}, ${midX} ${y2Start}, ${x2} ${y2Start}
                L ${x2} ${y2End}
                C ${midX} ${y2End}, ${midX} ${y1End}, ${x1} ${y1End}
                Z
              `;

                            const isHovered = hoveredFlow === sourceNode.id;

                            paths.push(
                                <path
                                    key={`${sourceNode.id}-${intensity.id}`}
                                    d={pathD}
                                    fill={sourceNode.color}
                                    opacity={animated ? (isHovered ? 0.85 : 0.4) : 0}
                                    style={{
                                        transition: `opacity 0.3s ease ${0.2 + sourceIdx * 0.04}s`,
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={() => setHoveredFlow(sourceNode.id)}
                                    onMouseLeave={() => setHoveredFlow(null)}
                                />
                            );

                            sourceOffset += sourceFlowHeight;
                            targetOffsets[intensity.id] += targetFlowHeight;
                        });
                    });

                    return paths;
                })()}

                {/* Left nodes */}
                {leftNodes.map((node, i) => (
                    <g key={node.id}>
                        <rect
                            x={sankeyConfig.leftX}
                            y={node.y}
                            width={sankeyConfig.nodeWidth}
                            height={node.height}
                            fill={node.color}
                            rx="3"
                            opacity={animated ? 1 : 0}
                            style={{
                                transition: `opacity 0.4s ease ${0.15 + i * 0.03}s`,
                                cursor: 'pointer',
                            }}
                            onMouseEnter={() => setHoveredFlow(node.id)}
                            onMouseLeave={() => setHoveredFlow(null)}
                        />
                        <text
                            x={sankeyConfig.leftX - 8}
                            y={node.y + node.height / 2 + 3}
                            fill={hoveredFlow === node.id ? node.color : '#666'}
                            fontSize="9"
                            fontWeight={hoveredFlow === node.id ? "600" : "400"}
                            textAnchor="end"
                            fontFamily="Inter, sans-serif"
                            style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredFlow(node.id)}
                            onMouseLeave={() => setHoveredFlow(null)}
                        >
                            {node.name}
                        </text>
                    </g>
                ))}

                {/* Right nodes */}
                {rightNodes.map((node, i) => (
                    <g key={node.id}>
                        <rect
                            x={sankeyConfig.rightX}
                            y={node.y}
                            width={sankeyConfig.nodeWidth}
                            height={node.height}
                            fill={node.color}
                            rx="3"
                            opacity={animated ? 1 : 0}
                            style={{ transition: `opacity 0.4s ease ${0.35 + i * 0.03}s` }}
                        />
                        <text
                            x={sankeyConfig.rightX + sankeyConfig.nodeWidth + 8}
                            y={node.y + node.height / 2 + 3}
                            fill="#666"
                            fontSize="9"
                            fontFamily="Inter, sans-serif"
                        >
                            {node.name}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default DimensionalProblem;
