// services/flows-pieces/pieces/alecia-storage/src/actions/upload-file.ts
// Upload file to Minio S3

import { createAction, Property } from '@activepieces/pieces-framework';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const uploadFile = createAction({
  name: 'upload-file',
  displayName: 'Upload File to S3',
  description: 'Upload file to Minio S3 storage',
  props: {
    bucket: Property.ShortText({
      displayName: 'Bucket Name',
      defaultValue: 'alecia-deals',
      required: false,
    }),
    key: Property.ShortText({
      displayName: 'File Key (path)',
      description: 'S3 object key (e.g., deals/123/document.pdf)',
      required: true,
    }),
    fileContent: Property.LongText({
      displayName: 'File Content (Base64)',
      description: 'Base64-encoded file content',
      required: true,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      defaultValue: 'application/octet-stream',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata for the file',
      required: false,
    }),
  },
  async run(context) {
    const s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://alecia-minio:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || 'alecia',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || '',
      },
      forcePathStyle: true,
    });

    const fileBuffer = Buffer.from(context.propsValue.fileContent, 'base64');

    const command = new PutObjectCommand({
      Bucket: context.propsValue.bucket,
      Key: context.propsValue.key,
      Body: fileBuffer,
      ContentType: context.propsValue.contentType,
      Metadata: (context.propsValue.metadata as Record<string, string>) || {},
    });

    await s3Client.send(command);

    return {
      success: true,
      bucket: context.propsValue.bucket,
      key: context.propsValue.key,
      size: fileBuffer.length,
      url: `https://storage.alecia.fr/${context.propsValue.bucket}/${context.propsValue.key}`,
      contentType: context.propsValue.contentType,
    };
  },
});
