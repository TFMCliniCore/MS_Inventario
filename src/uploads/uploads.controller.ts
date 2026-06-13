import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller('uploads')
export class UploadsController {
  @Get(':subfolder/:filename')
  serveFile(
    @Param('subfolder') subfolder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Prevent path traversal
    if (
      subfolder.includes('..') ||
      subfolder.includes('/') ||
      filename.includes('..') ||
      filename.includes('/')
    ) {
      throw new NotFoundException('Recurso no encontrado.');
    }

    const filePath = join(process.cwd(), 'uploads', subfolder, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Imagen no encontrada.');
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }
}
