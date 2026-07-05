import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'; // 👈 Importaciones añadidas
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltrosProductoDto } from './dto/filtros-producto.dto';

const MIMETYPES_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MIMETYPES_PERMITIDOS = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
  'text/csv',                                                            // .csv
  'application/csv',
];

@ApiTags('Productos') // 👈 Agrupador para la UI de Swagger
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto en el catálogo e inicializar sus propiedades' })
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar y filtrar productos con soporte para paginación y stock bajo' })
  findAll(@Query() filters: FiltrosProductoDto) {
    return this.productosService.findAll(filters);
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar productos por coincidencia rápida en nombre, código o SKU (parámetro q)' })
  buscar(@Query('q') q: string) {
    if (!q?.trim())
      throw new BadRequestException('El parámetro "q" es requerido.');
    return this.productosService.buscar(q.trim());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener la ficha técnica e información detallada de un producto' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modificar parcialmente los atributos o precios de un producto' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Reemplazar por completo los datos de registro de un producto' })
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Retirar o eliminar físicamente un producto del inventario' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }

  // ── Subida de imagen ──────────────────────────────────────────────────

  @Post(':id/imagen')
  @ApiOperation({ summary: 'Subir o actualizar la imagen de portada de un producto' })
  @ApiConsumes('multipart/form-data') // 👈 Habilita la carga de archivos en Swagger
  @ApiBody({
    schema: {
      type: 'object',
      properties: { imagen: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'productos');
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        cb(null, MIMETYPES_IMAGEN.includes(file.mimetype));
      },
    }),
  )
  uploadImagen(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Imagen inválida. Usa jpeg, png, webp o gif (máx. 5 MB).',
      );
    }
    return this.productosService.uploadImagen(id, file.filename);
  }

  // ── Importación masiva ────────────────────────────────────────────────

  @Post('importar/preview')
  @ApiOperation({ summary: 'Previsualizar la estructura y validaciones de un archivo de importación masiva sin guardarlo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  previewImport(@UploadedFile() file: Express.Multer.File): any {
    this.validarArchivoImport(file);
    return this.productosService.previewImport(file.buffer);
  }

  @Post('importar')
  @ApiOperation({ summary: 'Procesar y guardar de forma masiva un lote de productos desde un archivo (.xlsx, .xls, .csv)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  bulkImport(@UploadedFile() file: Express.Multer.File): any {
    this.validarArchivoImport(file);
    return this.productosService.bulkImport(file.buffer);
  }

  // ── Helper privado ────────────────────────────────────────────────────

  private validarArchivoImport(file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException('Debes enviar un archivo (campo: file).');
    if (!MIMETYPES_PERMITIDOS.includes(file.mimetype))
      throw new BadRequestException(
        'Formato no permitido. Usa .xlsx, .xls o .csv',
      );
  }
}