import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { promises as fs } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { Express } from 'express';

@Injectable()
export class StorageService {
  private driver = process.env.STORAGE_DRIVER ?? 'local';
  private s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-3' });

  async saveAvatar(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ url: string; key: string }> {
    const ext = (extname(file.originalname) || '.jpg').toLowerCase();
    const key = `avatars/${userId}/${randomUUID()}${ext}`;

    if (this.driver === 's3') {
      const bucket = process.env.S3_BUCKET_AVATARS!;
      try {
        await this.s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // ou private si tu passes par CloudFront/signé
          })
        );
        const base =
          process.env.CDN_BASE_URL ||
          `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        return { url: `${base}/${key}`, key };
      } catch {
        throw new InternalServerErrorException('S3 upload failed');
      }
    }

    // LOCAL
    const root = process.env.UPLOADS_DIR ?? '/app/uploads';
    const full = `${root}/${key}`;
    try {
      await fs.mkdir(full.substring(0, full.lastIndexOf('/')), {
        recursive: true,
      });
      await fs.writeFile(full, file.buffer);
      const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001';
      return { url: `${base}/static/${key}`, key };
    } catch (e) {
      console.error('Local upload failed', e);
      throw new InternalServerErrorException('Local upload failed');
    }
  }

  async deleteByKey(key: string): Promise<void> {
    if (!key) return;
    if (this.driver === 's3') {
      const bucket = process.env.S3_BUCKET_AVATARS!;
      await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    }
    // LOCAL
    const root = process.env.UPLOADS_DIR ?? '/app/uploads';
    try {
      await fs.unlink(`${root}/${key}`);
    } catch {
      /* ignore if not exists */
    }
  }
}
