'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from './PerceptionOverlay.module.css';
import { AggregateData } from '@/lib/socket';

interface PerceptionOverlayProps {
    /** Real-time aggregate data */
    data: AggregateData[];
    /** Whether to show individual participant lines */
    showIndividuals?: boolean;
    /** Maximum time window in seconds */
    timeWindowSeconds?: number;
    /** Height of the chart */
    height?: number;
}

const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#22c55e', '#14b8a6'
];

export default function PerceptionOverlay({
    data,
    showIndividuals = true,
    timeWindowSeconds = 60,
    height = 200,
}: PerceptionOverlayProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height });

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height,
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    // Draw chart
    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        const margin = { top: 10, right: 60, bottom: 30, left: 40 };
        const innerWidth = dimensions.width - margin.left - margin.right;
        const innerHeight = dimensions.height - margin.top - margin.bottom;

        // Clear previous content
        svg.selectAll('*').remove();

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Time range
        const now = data[data.length - 1]?.timestamp || Date.now();
        const timeWindow = timeWindowSeconds * 1000;

        // Scales
        const xScale = d3.scaleTime()
            .domain([now - timeWindow, now])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([innerHeight, 0]);

        // Axes
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));

        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat((d) => `${d}`);

        g.append('g')
            .attr('class', styles.axis)
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis);

        g.append('g')
            .attr('class', styles.axis)
            .call(yAxis);

        // Grid lines
        g.append('g')
            .attr('class', styles.grid)
            .call(
                d3.axisLeft(yScale)
                    .ticks(5)
                    .tickSize(-innerWidth)
                    .tickFormat(() => '')
            );

        // Line generator
        const lineGenerator = d3.line<{ timestamp: number; value: number }>()
            .x((d) => xScale(d.timestamp))
            .y((d) => yScale(d.value))
            .curve(d3.curveMonotoneX);

        // Area for standard deviation band
        if (data.length > 1) {
            const areaGenerator = d3.area<AggregateData>()
                .x((d) => xScale(d.timestamp))
                .y0((d) => yScale(Math.max(0, d.mean - d.stdDev)))
                .y1((d) => yScale(Math.min(100, d.mean + d.stdDev)))
                .curve(d3.curveMonotoneX);

            g.append('path')
                .datum(data.filter(d => d.timestamp >= now - timeWindow))
                .attr('class', styles.stdDevBand)
                .attr('d', areaGenerator);
        }

        // Individual participant lines
        if (showIndividuals && data.length > 0) {
            const latestData = data[data.length - 1];
            const participantIds = Object.keys(latestData.participants || {});

            participantIds.forEach((participantId, index) => {
                const participantData = data
                    .filter(d => d.timestamp >= now - timeWindow && d.participants?.[participantId] !== undefined)
                    .map(d => ({
                        timestamp: d.timestamp,
                        value: d.participants[participantId],
                    }));

                if (participantData.length > 1) {
                    g.append('path')
                        .datum(participantData)
                        .attr('class', styles.individualLine)
                        .attr('d', lineGenerator)
                        .style('stroke', COLORS[index % COLORS.length])
                        .style('opacity', 0.3);
                }
            });
        }

        // Mean line (primary)
        const meanData = data
            .filter(d => d.timestamp >= now - timeWindow)
            .map(d => ({ timestamp: d.timestamp, value: d.mean }));

        if (meanData.length > 1) {
            g.append('path')
                .datum(meanData)
                .attr('class', styles.meanLine)
                .attr('d', lineGenerator);
        }

        // Current value indicator
        const latestValue = data[data.length - 1]?.mean;
        if (latestValue !== undefined) {
            g.append('circle')
                .attr('cx', xScale(now))
                .attr('cy', yScale(latestValue))
                .attr('r', 6)
                .attr('class', styles.currentValueDot);

            g.append('text')
                .attr('x', innerWidth + 10)
                .attr('y', yScale(latestValue))
                .attr('dy', '0.35em')
                .attr('class', styles.currentValueLabel)
                .text(`${Math.round(latestValue)}`);
        }

        // Labels
        g.append('text')
            .attr('x', -10)
            .attr('y', yScale(100) - 5)
            .attr('class', styles.scaleLabel)
            .text('Agree');

        g.append('text')
            .attr('x', -10)
            .attr('y', yScale(0) + 15)
            .attr('class', styles.scaleLabel)
            .text('Disagree');

    }, [data, dimensions, showIndividuals, timeWindowSeconds]);

    return (
        <div ref={containerRef} className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Live Perception</h3>
                <div className={styles.legend}>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: 'var(--color-accent-primary)' }} />
                        Average
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendBand} />
                        ±1 Std Dev
                    </span>
                </div>
            </div>
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className={styles.chart}
            />
        </div>
    );
}
