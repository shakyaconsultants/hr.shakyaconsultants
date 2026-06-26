export const UPLOAD_FOLDERS = {
  EMPLOYEES: 'employees',
  DOCUMENTS: 'documents',
  PAYROLL: 'payroll',
  RESUMES: 'resumes',
  AVATARS: 'avatars',
  REPORTS: 'reports',
} as const;

export const FILE_SIZE_LIMITS = {
  IMAGE_BYTES: 5 * 1024 * 1024,
  PDF_BYTES: 10 * 1024 * 1024,
  DOCUMENT_BYTES: 15 * 1024 * 1024,
  RESUME_BYTES: 5 * 1024 * 1024,
  DEFAULT_BYTES: 10 * 1024 * 1024,
} as const;

export const MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export const MIME_GROUPS = {
  IMAGE: [MIME_TYPES.JPEG, MIME_TYPES.PNG, MIME_TYPES.WEBP],
  PDF: [MIME_TYPES.PDF],
  OFFICE: [MIME_TYPES.DOC, MIME_TYPES.DOCX, MIME_TYPES.XLS, MIME_TYPES.XLSX],
  RESUME: [MIME_TYPES.PDF, MIME_TYPES.DOC, MIME_TYPES.DOCX],
  DOCUMENT: [MIME_TYPES.PDF, MIME_TYPES.DOC, MIME_TYPES.DOCX, MIME_TYPES.XLS, MIME_TYPES.XLSX],
} as const;
