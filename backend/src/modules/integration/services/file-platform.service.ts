import { UploadService, type UploadFileInput } from '@infrastructure/storage/cloudinary.service.js';
import type { UploadMetadata } from '@shared/types/api.types.js';
import { UploadResourceType } from '@shared/enums/index.js';

export const FilePlatformService = {
  uploadImage(input: UploadFileInput): Promise<UploadMetadata> {
    return UploadService.uploadImage(input);
  },

  uploadPdf(input: UploadFileInput): Promise<UploadMetadata> {
    return UploadService.uploadPdf(input);
  },

  uploadDocument(input: UploadFileInput): Promise<UploadMetadata> {
    return UploadService.uploadDocument(input);
  },

  upload(input: UploadFileInput): Promise<UploadMetadata> {
    return UploadService.upload(input);
  },

  delete(publicId: string, resourceType?: UploadResourceType): Promise<void> {
    return UploadService.delete(publicId, resourceType);
  },

  createSignedUploadParams(folder: string) {
    return UploadService.createSignedUploadParams(folder);
  },

  getTransformationUrl(publicId: string, transformation: Record<string, unknown>): string {
    return UploadService.getTransformationUrl(publicId, transformation);
  },
};
