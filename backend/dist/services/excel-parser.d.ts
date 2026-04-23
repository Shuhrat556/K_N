export interface ParsedSpecialtyRow {
    externalId: number | null;
    code: string;
    name: string;
    university: string;
    location: string | null;
    studyForm: string | null;
    studyType: "paid" | "free";
    price: number;
    language: string | null;
    quota: number | null;
    degree: string | null;
}
export declare function parseExcelBuffer(buffer: Buffer): ParsedSpecialtyRow[];
export declare function previewExcel(buffer: Buffer, maxRows?: number): {
    headers: string[];
    rows: unknown[][];
};
//# sourceMappingURL=excel-parser.d.ts.map