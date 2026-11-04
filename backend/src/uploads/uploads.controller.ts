import {
  BadRequestException, Controller, Get, NotFoundException, Param, Post, Req, Res,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ALLOWED_TYPES, CONTENT_TYPE_BY_EXT, MAX_UPLOAD_BYTES, STORED_NAME, UPLOAD_DIR,
} from './uploads.config';

mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('uploads')
export class UploadsController {
  /**
   * Accepts one file in the multipart field "file" and returns a URL to store
   * in a *_url column (resume_file_url, company document file_url, logo_url...).
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      storage: diskStorage({
        destination: UPLOAD_DIR,
        // The stored name is random and its extension comes from our own allow-list,
        // never from the client's file name.
        filename: (_req, file, cb) => cb(null, `${randomUUID()}.${ALLOWED_TYPES[file.mimetype]}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES[file.mimetype]) {
          return cb(new BadRequestException('Unsupported file type. Upload a PDF, Word document, PNG, JPG or WebP file.'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file received. Send it in the "file" field.');

    const proto = (req.get('x-forwarded-proto') ?? req.protocol).split(',')[0].trim();
    const base = process.env.PUBLIC_API_URL?.replace(/\/$/, '') ?? `${proto}://${req.get('host')}/api/v1`;

    return {
      url: `${base}/uploads/files/${file.filename}`,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Files are served by their unguessable name so employers can open a candidate's
   * CV from a plain link. Names are random UUIDs; anything else is rejected.
   */
  @Get('files/:name')
  serve(@Param('name') name: string, @Res() res: Response) {
    if (!STORED_NAME.test(name)) throw new NotFoundException('File not found.');
    const path = join(UPLOAD_DIR, name);
    if (!existsSync(path)) throw new NotFoundException('File not found.');

    const ext = name.split('.').pop() as string;
    res.setHeader('Content-Type', CONTENT_TYPE_BY_EXT[ext]);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(path, { dotfiles: 'deny' });
  }
}
