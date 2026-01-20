'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { exportToPng, exportToSvg, findSvgElement, generateFilename } from '@/lib/export/chart-export';

interface ChartExportButtonProps {
    chartRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>;
    title: string;
    className?: string;
}

type ExportFormat = 'png' | 'svg';

export default function ChartExportButton({ chartRef, title, className = '' }: ChartExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleExport = useCallback(async (format: ExportFormat) => {
        if (!chartRef.current) return;

        const svg = findSvgElement(chartRef.current);
        if (!svg) {
            console.error('No SVG element found in chart container');
            return;
        }

        setIsExporting(true);
        try {
            const filename = generateFilename(title);

            if (format === 'png') {
                await exportToPng(svg, filename, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    padding: 20
                });
            } else {
                exportToSvg(svg, filename, {
                    includeStyles: true,
                    backgroundColor: '#ffffff'
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
            setIsOpen(false);
        }
    }, [chartRef, title]);

    // Close menu when clicking outside
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    // Add/remove click listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    return (
        <div className={`chart-export-wrapper ${className}`} ref={menuRef}>
            <button
                className="export-btn"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                title="Export chart"
            >
                {isExporting ? (
                    <span className="spinner" />
                ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1v9M4 6l4 4 4-4M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="export-menu">
                    <button onClick={() => handleExport('png')} className="menu-item">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" fill="none"/>
                            <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
                            <path d="M14 10l-3-3-4 4-2-2-4 4" stroke="currentColor" fill="none" strokeWidth="1.5"/>
                        </svg>
                        Export as PNG
                    </button>
                    <button onClick={() => handleExport('svg')} className="menu-item">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" fill="none"/>
                            <text x="8" y="11" fontSize="7" textAnchor="middle" fill="currentColor">SVG</text>
                        </svg>
                        Export as SVG
                    </button>
                </div>
            )}

            <style jsx>{`
                .chart-export-wrapper {
                    position: relative;
                    display: inline-block;
                }

                .export-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    border: 1px solid #e0ddd8;
                    background: white;
                    border-radius: 4px;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .export-btn:hover {
                    border-color: #c94a4a;
                    color: #c94a4a;
                    background: #faf9f7;
                }

                .export-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid #e0ddd8;
                    border-top-color: #c94a4a;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .export-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 4px;
                    background: white;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                    min-width: 150px;
                    overflow: hidden;
                }

                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    border: none;
                    background: none;
                    color: #1a1d24;
                    font-size: 0.875rem;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.15s;
                    font-family: inherit;
                }

                .menu-item:hover {
                    background: #f5f3ef;
                }

                .menu-item:first-child {
                    border-bottom: 1px solid #f0ede8;
                }

                .menu-item svg {
                    color: #666;
                }
            `}</style>
        </div>
    );
}
