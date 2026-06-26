import multer from 'multer';
import { getEnv } from '@config/env.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { isMimeTypeAllowed, normalizeMimeType } from '@shared/utils/mime.util.js';
import type { FileCategory } from '@shared/services/file-validation.service.js';

export function createUploadMiddleware(_category: FileCategory = 'document') {
  const env = getEnv();
  const allowedMimeTypes = env.UPLOAD_ALLOWED_MIME_TYPES.split(',').map((t) => normalizeMimeType(t));

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: env.UPLOAD_MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
      const mimeType = normalizeMimeType(file.mimetype);
      if (isMimeTypeAllowed(mimeType, allowedMimeTypes)) {
        cb(null, true);
        return;
      }
      cb(new ValidationError('File type not allowed', [{ mimeType }], { code: ERROR_CODES.FILE_INVALID_TYPE }));
    },
  });
}

export const uploadMiddleware = createUploadMiddleware();
