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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltrosProductoDto } from './dto/filtros-producto.dto';

const MIMETYPES_PERMITIDOS = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
  'text/csv',                                                            // .csv
  'application/csv',
];

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Get()
  findAll(@Query() filters: FiltrosProductoDto) {
    return this.productosService.findAll(filters);
  }

  @Get('buscar')
  buscar(@Query('q') q: string) {
    if (!q?.trim())
      throw new BadRequestException('El parámetro "q" es requerido.');
    return this.productosService.buscar(q.trim());
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @Put(':id')
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }

  // ── Importación masiva ────────────────────────────────────────────────

  @Post('importar/preview')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  previewImport(@UploadedFile() file: Express.Multer.File): any {
    this.validarArchivoImport(file);
    return this.productosService.previewImport(file.buffer);
  }

  @Post('importar')
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