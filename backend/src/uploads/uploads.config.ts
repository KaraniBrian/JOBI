import 'dotenv/config';
import { resolve } from 'path';

/** Where uploaded files are stored. On Render, point this at a persistent disk (e.g. /var/data/uploads). */
export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? 'uploads');

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/** Allowed uploads: MIME type -> the extension we store the file under. */
export const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Content type to serve for each stored extension (never taken from the client). */
export const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

export const STORED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx|png|jpg|webp)$/;
