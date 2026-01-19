import React, { useState, useEffect } from 'react';

const DimensionalProblem = () => {
    const [animated, setAnimated] = useState(false);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [hoveredFlow, setHoveredFlow] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 300);
        return () => clearTimeout(timer);
    }, []);

    // Six Americas segments
    const climateSegments = [
        { name: 'Alarmed', pct: 26, color: '#1e3a2f', description: 'Convinced, worried, taking action' },
        { name: 'Concerned', pct: 27, color: '#2d5a47', description: 'Believe it\'s serious, less engaged' },
        { name: 'Cautious', pct: 17, color: '#5a7c6f', description: 'Uncertain about causes and timing' },
        { name: 'Disengaged', pct: 6, color: '#8b8b8b', description: 'Haven\'t given it much thought' },
        { name: 'Doubtful', pct: 12, color: '#a67c52', description: 'Don\'t think it\'s human-caused' },
        { name: 'Dismissive', pct: 12, color: '#8b3a3a', description: 'Convinced it\'s not happening' },
    ];

    // AI concern types - Pew data
    const aiContentTypes = [
        {
            id: 'human', name: 'Erodes Human Abilities', pct: 27, color: '#4a6fa5', isNet: true,
            subItems: [
                { text: 'Makes us too dependent on AI', pct: 22 },
                { text: 'Negative impact on education/art', pct: 4 },
                { text: 'Makes us less human', pct: 3 },
            ],
            flows: { alarmed: 22, concerned: 35, cautious: 28, disengaged: 9, doubtful: 4, dismissive: 2 }
        },
        {
            id: 'misinfo', name: 'Misinformation', pct: 18, color: '#7c6a9c', isNet: true,
            subItems: [
                { text: 'Hard to tell what is real', pct: 11 },
                { text: 'Promotes misinformation', pct: 6 },
            ],
            flows: { alarmed: 30, concerned: 38, cautious: 22, disengaged: 6, doubtful: 3, dismissive: 1 }
        },
        {
            id: 'control', name: 'Loss of Control', pct: 17, color: '#a63d40', isNet: true,
            subItems: [{ text: 'AI taking over', pct: 9 }, { text: 'No control over AI', pct: 8 }],
            flows: { alarmed: 48, concerned: 32, cautious: 14, disengaged: 3, doubtful: 2, dismissive: 1 }
        },
        {
            id: 'badactors', name: 'Scams & Hacking', pct: 11, color: '#5a8f7b', isNet: false,
            subItems: [{ text: 'People will use AI for bad', pct: 11 }],
            flows: { alarmed: 22, concerned: 35, cautious: 28, disengaged: 9, doubtful: 4, dismissive: 2 }
        },
        {
            id: 'jobs', name: 'Job Loss', pct: 9, color: '#b8860b', isNet: false,
            subItems: [{ text: 'Job loss and economic disruption', pct: 9 }],
            flows: { alarmed: 18, concerned: 30, cautious: 32, disengaged: 12, doubtful: 5, dismissive: 3 }
        },
        {
            id: 'trust', name: 'Distrust of Tech', pct: 9, color: '#8b6b61', isNet: true,
            subItems: [{ text: 'AI is unproven', pct: 6 }, { text: 'Don\'t trust tech companies', pct: 2 }],
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
        width: 700,
        height: 380,
        leftX: 130,
        rightX: 570,
        nodeWidth: 14,
        startY: 45,
        totalHeight: 300,
        minNodeHeight: 18,
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

        const flowTotals = {};
        intensitySegments.forEach(seg => flowTotals[seg.id] = 0);

        aiContentTypes.forEach(type => {
            Object.keys(type.flows).forEach(targetId => {
                flowTotals[targetId] += (type.pct * type.flows[targetId]) / 100;
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
    const hoveredData = hoveredFlow ? aiContentTypes.find(t => t.id === hoveredFlow) : null;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #faf9f6 0%, #f5f3ef 100%)',
            padding: '24px',
            fontFamily: '"Libre Baskerville", Georgia, serif',
            color: '#2c2c2c',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '16px',
        }}>
            {/* Compact Title */}
            <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                opacity: animated ? 1 : 0,
                transition: 'opacity 0.6s ease',
            }}>
                <h2 style={{
                    fontSize: '1.4rem',
                    fontWeight: '400',
                    margin: '0 0 4px 0',
                    color: '#1a1a1a',
                }}>
                    The Dimensional Problem
                </h2>
                <p style={{
                    fontSize: '0.85rem',
                    color: '#888',
                    fontStyle: 'italic',
                    margin: 0,
                }}>
                    Why AI concern requires a different segmentation approach
                </p>
            </div>

            {/* Sankey Container */}
            <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <svg
                    viewBox={`0 0 ${sankeyConfig.width} ${sankeyConfig.height}`}
                    style={{
                        width: '100%',
                        flex: 1,
                        minHeight: 0,
                    }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Column labels */}
                    <text x={sankeyConfig.leftX} y="25" fill="#999" fontSize="8" fontWeight="500" textAnchor="middle" letterSpacing="0.08em">
                        WHAT CONCERNS THEM
                    </text>
                    <text x={sankeyConfig.rightX} y="25" fill="#999" fontSize="8" fontWeight="500" textAnchor="middle" letterSpacing="0.08em">
                        HOW MUCH
                    </text>

                    {/* Flow paths */}
                    {(() => {
                        const paths = [];
                        const targetOffsets = {};
                        intensitySegments.forEach(seg => targetOffsets[seg.id] = 0);

                        leftNodes.forEach((sourceNode, sourceIdx) => {
                            let sourceOffset = 0;

                            intensitySegments.forEach(intensity => {
                                const targetNode = rightNodes.find(n => n.id === intensity.id);
                                const flowPct = sourceNode.flows[intensity.id];
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
                                        opacity={animated ? (isHovered ? 0.75 : 0.35) : 0}
                                        style={{
                                            transition: `opacity 0.3s ease ${0.3 + sourceIdx * 0.05}s`,
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
                                rx="2"
                                opacity={animated ? 1 : 0}
                                style={{
                                    transition: `opacity 0.4s ease ${0.2 + i * 0.04}s`,
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={() => setHoveredFlow(node.id)}
                                onMouseLeave={() => setHoveredFlow(null)}
                            />
                            <text
                                x={sankeyConfig.leftX - 8}
                                y={node.y + node.height / 2 + 3}
                                fill={hoveredFlow === node.id ? node.color : '#555'}
                                fontSize="8"
                                fontWeight="500"
                                textAnchor="end"
                                style={{ transition: 'fill 0.2s ease', cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredFlow(node.id)}
                                onMouseLeave={() => setHoveredFlow(null)}
                            >
                                {node.name} ({node.pct}%)
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
                                rx="2"
                                opacity={animated ? 1 : 0}
                                style={{ transition: `opacity 0.4s ease ${0.4 + i * 0.04}s` }}
                            />
                            <text
                                x={sankeyConfig.rightX + sankeyConfig.nodeWidth + 8}
                                y={node.y + node.height / 2 + 3}
                                fill="#555"
                                fontSize="8"
                                fontWeight="500"
                            >
                                {node.name} ({node.pct}%)
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Hover tooltip */}
                <div style={{
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '8px',
                    marginTop: '8px',
                }}>
                    {hoveredData ? (
                        <span style={{ fontSize: '0.8rem', color: '#555' }}>
                            <strong style={{ color: hoveredData.color }}>{hoveredData.name}:</strong>{' '}
                            {hoveredData.subItems.map(s => s.text).join(', ')}
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.75rem', color: '#aaa', fontStyle: 'italic' }}>
                            Hover to explore concern categories • Source: Pew Research, 2025
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DimensionalProblem;
