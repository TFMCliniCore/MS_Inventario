import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger'; // 👈 Importación de Swagger
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

@ApiTags('Almacenamiento y Archivos') // 👈 Agrupador para la UI de Swagger
@Controller('uploads')
export class UploadsController {
  @Get(':subfolder/:filename')
  @ApiOperation({ summary: 'Servir archivos multimedia e imágenes de productos de forma pública con optimización de caché' })
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