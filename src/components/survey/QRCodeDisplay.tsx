// QR Code Display Component
// Shows QR code for survey distribution with download options
'use client';

import { useState, useEffect, useRef } from 'react';
import { generateQRCode, type QRCodeOptions } from '@/lib/utils/qr-code';

interface QRCodeDisplayProps {
    surveyId: string;
    surveyTitle: string;
    token?: string; // Optional specific token
}

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export default function QRCodeDisplay({ surveyId, surveyTitle, token }: QRCodeDisplayProps) {
    const [qrSize, setQrSize] = useState(256);
    const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');
    const [includeToken, setIncludeToken] = useState(!!token);
    const [customToken, setCustomToken] = useState(token || '');
    const [darkColor, setDarkColor] = useState('#1a1d24');
    const [lightColor, setLightColor] = useState('#ffffff');
    const [qrSvg, setQrSvg] = useState<string>('');
    const [surveyUrl, setSurveyUrl] = useState<string>('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Generate the survey URL
    useEffect(() => {
        const baseUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/survey/${surveyId}`
            : `/survey/${surveyId}`;

        let url = baseUrl;
        if (includeToken && customToken) {
            url += `?token=${encodeURIComponent(customToken)}`;
        }
        setSurveyUrl(url);
    }, [surveyId, includeToken, customToken]);

    // Generate QR code when parameters change
    useEffect(() => {
        if (!surveyUrl) return;

        try {
            const options: QRCodeOptions = {
                errorCorrectionLevel: errorLevel,
                size: qrSize,
                margin: 4,
                darkColor,
                lightColor,
            };

            const result = generateQRCode(surveyUrl, options);
            setQrSvg(result.svg);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
        }
    }, [surveyUrl, qrSize, errorLevel, darkColor, lightColor]);

    // Download as SVG
    const downloadSVG = () => {
        const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${surveyTitle.replace(/[^a-z0-9]/gi, '-')}-qr.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Download as PNG
    const downloadPNG = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = qrSize;
            canvas.height = qrSize;
            ctx.fillStyle = lightColor;
            ctx.fillRect(0, 0, qrSize, qrSize);
            ctx.drawImage(img, 0, 0, qrSize, qrSize);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${surveyTitle.replace(/[^a-z0-9]/gi, '-')}-qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        img.src = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    };

    // Copy URL to clipboard
    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(surveyUrl);
            alert('URL copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="qr-code-display">
            <div className="qr-preview">
                <div
                    className="qr-image"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="qr-url">
                <label>Survey URL</label>
                <div className="url-row">
                    <input
                        type="text"
                        value={surveyUrl}
                        readOnly
                        className="url-input"
                    />
                    <button
                        type="button"
                        onClick={copyUrl}
                        className="btn-copy"
                        title="Copy URL"
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div className="qr-options">
                <div className="option-group">
                    <label>Include Token</label>
                    <div className="checkbox-row">
                        <input
                            type="checkbox"
                            id="include-token"
                            checked={includeToken}
                            onChange={(e) => setIncludeToken(e.target.checked)}
                        />
                        <label htmlFor="include-token">Add access token to URL</label>
                    </div>
                    {includeToken && (
                        <input
                            type="text"
                            value={customToken}
                            onChange={(e) => setCustomToken(e.target.value)}
                            placeholder="Enter token..."
                            className="token-input"
                        />
                    )}
                </div>

                <div className="option-row">
                    <div className="option-group">
                        <label htmlFor="qr-size">Size</label>
                        <select
                            id="qr-size"
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                        >
                            <option value={128}>Small (128px)</option>
                            <option value={256}>Medium (256px)</option>
                            <option value={512}>Large (512px)</option>
                            <option value={1024}>XL (1024px)</option>
                        </select>
                    </div>

                    <div className="option-group">
                        <label htmlFor="error-level">Error Correction</label>
                        <select
                            id="error-level"
                            value={errorLevel}
                            onChange={(e) => setErrorLevel(e.target.value as ErrorCorrectionLevel)}
                        >
                            <option value="L">Low (~7%)</option>
                            <option value="M">Medium (~15%)</option>
                            <option value="Q">Quartile (~25%)</option>
                            <option value="H">High (~30%)</option>
                        </select>
                    </div>
                </div>

                <div className="option-row">
                    <div className="option-group">
                        <label htmlFor="dark-color">Dark Color</label>
                        <div className="color-input-row">
                            <input
                                type="color"
                                id="dark-color"
                                value={darkColor}
                                onChange={(e) => setDarkColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={darkColor}
                                onChange={(e) => setDarkColor(e.target.value)}
                                className="color-text"
                            />
                        </div>
                    </div>

                    <div className="option-group">
                        <label htmlFor="light-color">Light Color</label>
                        <div className="color-input-row">
                            <input
                                type="color"
                                id="light-color"
                                value={lightColor}
                                onChange={(e) => setLightColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={lightColor}
                                onChange={(e) => setLightColor(e.target.value)}
                                className="color-text"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="download-buttons">
                <button
                    type="button"
                    onClick={downloadSVG}
                    className="btn-download"
                >
                    Download SVG
                </button>
                <button
                    type="button"
                    onClick={downloadPNG}
                    className="btn-download"
                >
                    Download PNG
                </button>
            </div>

            <div className="qr-tips">
                <h4>Tips for QR Code Usage</h4>
                <ul>
                    <li>Use <strong>High error correction</strong> if the QR will be printed on textured materials or may get damaged</li>
                    <li>Test the QR code with multiple devices before printing</li>
                    <li>Ensure adequate contrast between dark and light colors</li>
                    <li>Include a token for tracked, single-use survey access</li>
                </ul>
            </div>

            <style jsx>{`
                .qr-code-display {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                }

                .qr-preview {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                    padding: 1.5rem;
                    background: #f5f3ef;
                    border-radius: 8px;
                }

                .qr-image {
                    max-width: 280px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .qr-image :global(svg) {
                    display: block;
                    width: 100%;
                    height: auto;
                }

                .qr-url {
                    margin-bottom: 1.5rem;
                }

                .qr-url label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: #1a1d24;
                }

                .url-row {
                    display: flex;
                    gap: 0.5rem;
                }

                .url-input {
                    flex: 1;
                    padding: 0.625rem 0.875rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 0.8rem;
                    background: #fafaf9;
                }

                .btn-copy {
                    padding: 0.625rem 1rem;
                    background: #f5f3ef;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.15s;
                }

                .btn-copy:hover {
                    background: #e8e5df;
                }

                .qr-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: #fafaf9;
                    border-radius: 6px;
                }

                .option-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .option-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }

                .option-group label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #666;
                }

                .option-group select,
                .option-group input[type="text"] {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    background: white;
                }

                .checkbox-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .checkbox-row input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                }

                .checkbox-row label {
                    font-size: 0.875rem;
                    color: #1a1d24;
                    font-weight: normal;
                }

                .token-input {
                    margin-top: 0.5rem;
                }

                .color-input-row {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .color-input-row input[type="color"] {
                    width: 36px;
                    height: 36px;
                    padding: 0;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .color-text {
                    flex: 1;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 0.8rem;
                }

                .download-buttons {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .btn-download {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    background: #c94a4a;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .btn-download:hover {
                    background: #b43939;
                }

                .qr-tips {
                    padding: 1rem;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 6px;
                }

                .qr-tips h4 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #166534;
                    margin: 0 0 0.75rem;
                }

                .qr-tips ul {
                    margin: 0;
                    padding-left: 1.25rem;
                }

                .qr-tips li {
                    font-size: 0.8rem;
                    color: #166534;
                    margin-bottom: 0.375rem;
                }

                .qr-tips li:last-child {
                    margin-bottom: 0;
                }

                @media (max-width: 640px) {
                    .option-row {
                        grid-template-columns: 1fr;
                    }

                    .download-buttons {
                        flex-direction: column;
                    }

                    .url-row {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
