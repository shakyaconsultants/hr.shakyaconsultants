import { FILE_SIZE_LIMITS, MIME_GROUPS } from '@shared/constants/upload.constants.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { isMimeTypeAllowed, normalizeMimeType } from '@shared/utils/mime.util.js';
import { isWithinSizeLimit } from '@shared/utils/file-size.util.js';
import { isPdfBuffer } from '@shared/utils/pdf.util.js';
import { getCorrelationId } from '@shared/context/request.context.js';

export type FileCategory = 'image' | 'pdf' | 'office' | 'resume' | 'document';

export interface FileValidationOptions {
  category: FileCategory;
  maxBytes?: number;
  allowedMimeTypes?: readonly string[];
}

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  virusScanReady: boolean;
}

const CATEGORY_CONFIG: Record<FileCategory, { maxBytes: number; mimeTypes: readonly string[] }> = {
  image: { maxBytes: FILE_SIZE_LIMITS.IMAGE_BYTES, mimeTypes: MIME_GROUPS.IMAGE },
  pdf: { maxBytes: FILE_SIZE_LIMITS.PDF_BYTES, mimeTypes: MIME_GROUPS.PDF },
  office: { maxBytes: FILE_SIZE_LIMITS.DOCUMENT_BYTES, mimeTypes: MIME_GROUPS.OFFICE },
  resume: { maxBytes: FILE_SIZE_LIMITS.RESUME_BYTES, mimeTypes: MIME_GROUPS.RESUME },
  document: { maxBytes: FILE_SIZE_LIMITS.DOCUMENT_BYTES, mimeTypes: MIME_GROUPS.DOCUMENT },
};

export const FileValidationService = {
  validate(buffer: Buffer, mimeType: string, options: FileValidationOptions): FileValidationResult {
    const config = CATEGORY_CONFIG[options.category];
    const normalizedMime = normalizeMimeType(mimeType);
    const maxBytes = options.maxBytes ?? config.maxBytes;
    const allowedMimeTypes = options.allowedMimeTypes ?? config.mimeTypes;
    const correlationId = getCorrelationId();

    if (!isMimeTypeAllowed(normalizedMime, allowedMimeTypes)) {
      throw new ValidationError(
        'File type not allowed',
        [{ mimeType: normalizedMime, allowed: allowedMimeTypes }],
        { code: ERROR_CODES.FILE_INVALID_TYPE },
        correlationId,
      );
    }

    if (!isWithinSizeLimit(buffer.length, maxBytes)) {
      throw new ValidationError(
        'File exceeds maximum size',
        [{ sizeBytes: buffer.length, maxBytes }],
        { code: ERROR_CODES.FILE_TOO_LARGE },
        correlationId,
      );
    }

    if (options.category === 'pdf' && !isPdfBuffer(buffer)) {
      throw new ValidationError(
        'Invalid PDF file',
        [],
        { code: ERROR_CODES.FILE_INVALID_TYPE },
        correlationId,
      );
    }

    return {
      valid: true,
      mimeType: normalizedMime,
      sizeBytes: buffer.length,
      category: options.category,
      virusScanReady: true,
    };
  },

  validateImage(buffer: Buffer, mimeType: string): FileValidationResult {
    return this.validate(buffer, mimeType, { category: 'image' });
  },

  validatePdf(buffer: Buffer, mimeType: string): FileValidationResult {
    return this.validate(buffer, mimeType, { category: 'pdf' });
  },

  validateResume(buffer: Buffer, mimeType: string): FileValidationResult {
    return this.validate(buffer, mimeType, { category: 'resume' });
  },
};
