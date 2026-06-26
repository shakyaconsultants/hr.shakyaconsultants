import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';
import { getEnv } from '@config/env.js';
import { ExternalServiceError } from '@shared/errors/app.error.js';
import { UploadResourceType } from '@shared/enums/index.js';
import type { UploadMetadata } from '@shared/types/api.types.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { queueLogger } from '@logging/winston.logger.js';

let configured = false;

export function initializeCloudinary(): void {
  if (configured) return;
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  queueLogger.info('Cloudinary initialized');
}

function resolveFolder(folder: string): string {
  const prefix = getEnv().CLOUDINARY_FOLDER_PREFIX;
  return `${prefix}/${folder}`.replace(/\/+/g, '/');
}

function mapUploadResult(result: UploadApiResponse, originalFilename: string, mimeType: string): UploadMetadata {
  const folder = typeof result.folder === 'string' ? result.folder : '';
  const metadata: UploadMetadata = {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    resourceType: result.resource_type,
    format: result.format || '',
    bytes: typeof result.bytes === 'number' ? result.bytes : 0,
    folder,
    originalFilename,
    mimeType,
  };
  return metadata;
}

export interface UploadFileInput {
  buffer: Buffer;
  folder: string;
  filename: string;
  mimeType: string;
  resourceType?: UploadResourceType;
}

export const UploadService = {
  async uploadImage(input: UploadFileInput): Promise<UploadMetadata> {
    return this.upload({ ...input, resourceType: UploadResourceType.Image });
  },

  async uploadPdf(input: UploadFileInput): Promise<UploadMetadata> {
    return this.upload({ ...input, resourceType: UploadResourceType.Raw });
  },

  async uploadDocument(input: UploadFileInput): Promise<UploadMetadata> {
    return this.upload({ ...input, resourceType: UploadResourceType.Auto });
  },

  async upload(input: UploadFileInput): Promise<UploadMetadata> {
    initializeCloudinary();
    const options: UploadApiOptions = {
      folder: resolveFolder(input.folder),
      resource_type: input.resourceType ?? UploadResourceType.Auto,
      public_id: input.filename.replace(/\.[^.]+$/, ''),
    };

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
          if (error) {
            const message = error instanceof Error ? error.message : 'Cloudinary upload failed';
            reject(new Error(message));
            return;
          }
          if (uploadResult) {
            resolve(uploadResult);
            return;
          }
          reject(new Error('Upload returned no result'));
        });
        stream.end(input.buffer);
      });
      return mapUploadResult(result, input.filename, input.mimeType);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cloudinary upload failed';
      throw new ExternalServiceError(message, { service: 'cloudinary' }, getCorrelationId());
    }
  },

  async delete(publicId: string, resourceType: UploadResourceType = UploadResourceType.Auto): Promise<void> {
    initializeCloudinary();
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cloudinary delete failed';
      throw new ExternalServiceError(message, { service: 'cloudinary', publicId }, getCorrelationId());
    }
  },

  async replace(input: UploadFileInput & { existingPublicId: string }): Promise<UploadMetadata> {
    await this.delete(input.existingPublicId, input.resourceType ?? UploadResourceType.Auto);
    return this.upload(input);
  },

  createSignedUploadParams(folder: string): {
    timestamp: number;
    signature: string;
    apiKey: string;
    cloudName: string;
    folder: string;
  } {
    initializeCloudinary();
    const env = getEnv();
    const resolvedFolder = resolveFolder(folder);
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: resolvedFolder },
      env.CLOUDINARY_API_SECRET,
    );
    return {
      timestamp,
      signature,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder: resolvedFolder,
    };
  },

  getTransformationUrl(publicId: string, transformation: Record<string, unknown>): string {
    initializeCloudinary();
    return cloudinary.url(publicId, { transformation: [transformation], secure: true });
  },
};
