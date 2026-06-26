export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString() === '%PDF';
}

export function getPdfPageCountPlaceholder(): number {
  return 0;
}

export interface PdfMetadata {
  isValid: boolean;
  sizeBytes: number;
}

export function extractPdfMetadata(buffer: Buffer): PdfMetadata {
  return { isValid: isPdfBuffer(buffer), sizeBytes: buffer.length };
}
