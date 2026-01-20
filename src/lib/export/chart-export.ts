// Chart Export Utilities
// Export SVG charts to PNG or SVG format

/**
 * Export an SVG element to PNG format
 * Uses canvas to render the SVG and convert to PNG
 */
export async function exportToPng(
    svgElement: SVGSVGElement,
    filename: string,
    options: {
        scale?: number;
        backgroundColor?: string;
        padding?: number;
    } = {}
): Promise<void> {
    const { scale = 2, backgroundColor = '#ffffff', padding = 20 } = options;

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const width = svgRect.width + padding * 2;
    const height = svgRect.height + padding * 2;

    // Clone SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Set explicit dimensions
    clonedSvg.setAttribute('width', String(width));
    clonedSvg.setAttribute('height', String(height));

    // Add viewBox if not present
    if (!clonedSvg.getAttribute('viewBox')) {
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    // Inline all styles for proper rendering
    inlineStyles(clonedSvg);

    // Serialize SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image and canvas
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not create canvas context');
    }

    // Set canvas size with scale for higher resolution
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
        img.onload = () => {
            // Fill background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scale and draw image
            ctx.scale(scale, scale);
            ctx.drawImage(img, padding, padding);

            // Clean up
            URL.revokeObjectURL(svgUrl);
            resolve();
        };
        img.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            reject(new Error('Failed to load SVG image'));
        };
        img.src = svgUrl;
    });

    // Convert to PNG and download
    const pngUrl = canvas.toDataURL('image/png');
    downloadFile(pngUrl, `${filename}.png`);
}

/**
 * Export an SVG element to SVG file format
 */
export function exportToSvg(
    svgElement: SVGSVGElement,
    filename: string,
    options: {
        includeStyles?: boolean;
        backgroundColor?: string;
    } = {}
): void {
    const { includeStyles = true, backgroundColor } = options;

    // Clone SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Add background rect if specified
    if (backgroundColor) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', backgroundColor);
        clonedSvg.insertBefore(rect, clonedSvg.firstChild);
    }

    // Inline styles if requested
    if (includeStyles) {
        inlineStyles(clonedSvg);
    }

    // Add XML declaration and doctype
    const serializer = new XMLSerializer();
    const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        serializer.serializeToString(clonedSvg);

    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
}

/**
 * Inline computed styles into SVG elements
 * This ensures proper rendering when exported
 */
function inlineStyles(element: SVGElement): void {
    const elements = element.querySelectorAll('*');

    // Style properties to inline for SVG
    const styleProps = [
        'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
        'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight',
        'text-anchor', 'dominant-baseline', 'transform'
    ];

    elements.forEach((el) => {
        if (el instanceof SVGElement) {
            const computed = window.getComputedStyle(el);
            styleProps.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value && value !== 'none' && value !== 'normal') {
                    el.style.setProperty(prop, value);
                }
            });
        }
    });
}

/**
 * Trigger file download
 */
function downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Find SVG element within a container
 */
export function findSvgElement(container: HTMLElement): SVGSVGElement | null {
    return container.querySelector('svg');
}

/**
 * Generate filename from chart title
 */
export function generateFilename(title: string, prefix: string = 'chart'): string {
    const safeName = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);

    const timestamp = new Date().toISOString().slice(0, 10);
    return `${prefix}_${safeName}_${timestamp}`;
}
