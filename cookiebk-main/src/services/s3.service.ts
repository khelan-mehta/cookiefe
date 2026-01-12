import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_FOLDERS } from '../config/s3';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  private bucket = env.AWS_S3_BUCKET;

  async uploadFile(
    file: Buffer,
    folder: keyof typeof S3_FOLDERS,
    mimeType: string
  ): Promise<string> {
    const extension = mimeType.split('/')[1] || 'jpg';
    const key = `${S3_FOLDERS[folder]}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    return `https://${this.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async deleteFile(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  async getSignedUploadUrl(
    folder: keyof typeof S3_FOLDERS,
    fileName: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const extension = fileName.split('.').pop() || 'jpg';
    const key = `${S3_FOLDERS[folder]}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${this.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
  }

  async getSignedDownloadUrl(url: string): Promise<string | null> {
    const key = this.extractKeyFromUrl(url);
    if (!key) return null;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}

export const s3Service = new S3Service();
