// Survey Export Library
// Supports SPSS, R, Stata, and Excel formats for statistical analysis

export { generateSPSSSyntax, generateSPSSData } from './spss';
export type { SPSSVariable, SPSSExportOptions } from './spss';

export { generateRScript, generateRData } from './r-export';
export type { RVariable, RExportOptions } from './r-export';

export { generateStataDoFile, generateStataData } from './stata';
export type { StataVariable, StataExportOptions } from './stata';

export { generateExcelWorkbook, generateExcelBuffer, generateExcelBase64 } from './excel';
export type { ExcelVariable, ExcelExportOptions } from './excel';

// Common export format type
export type ExportFormat = 'spss' | 'r' | 'stata' | 'csv' | 'json' | 'excel';

// Export metadata
export interface ExportMetadata {
    format: ExportFormat;
    surveyTitle: string;
    responseCount: number;
    generatedAt: string;
    files: {
        name: string;
        type: string;
        description: string;
    }[];
}
