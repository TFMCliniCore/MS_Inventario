import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltrosProductoDto } from './dto/filtros-producto.dto';

// Columnas esperadas en el archivo de importación
interface FilaImportacion {
  nombre?: unknown;
  descripcion?: unknown;
  codigoBarras?: unknown;
  codigoInterno?: unknown;
  marca?: unknown;
  fabricante?: unknown;
  precioCompra?: unknown;
  precioVenta?: unknown;
  cantidadActual?: unknown;
  cantidadMinima?: unknown;
  cantidadMaxima?: unknown;
  fechaVencimiento?: unknown;
  imagen?: unknown;
}

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateProductoDto) {
    return this.prisma.producto.create({
      data: {
        ...dto,
        precioVenta: parseFloat(dto.precioVenta),
        precioCompra: dto.precioCompra
          ? parseFloat(dto.precioCompra)
          : undefined,
        fechaVencimiento: dto.fechaVencimiento
          ? new Date(dto.fechaVencimiento)
          : undefined,
      },
      include: { categoria: true },
    });
  }

  findAll(filters: FiltrosProductoDto) {
    const {
      nombre,
      codigo,
      categoriaId,
      fabricante,
      marca,
      sucursalId,
      stockBajo,
    } = filters;

    return this.prisma.producto.findMany({
      where: {
        eliminado: false,
        ...(nombre && {
          nombre: { contains: nombre, mode: 'insensitive' },
        }),
        ...(codigo && {
          OR: [
            { codigoBarras: { contains: codigo, mode: 'insensitive' } },
            { codigoInterno: { contains: codigo, mode: 'insensitive' } },
          ],
        }),
        ...(categoriaId && { categoriaId }),
        ...(fabricante && {
          fabricante: { contains: fabricante, mode: 'insensitive' },
        }),
        ...(marca && { marca: { contains: marca, mode: 'insensitive' } }),
        ...(sucursalId && { sucursalId }),
        ...(stockBajo === true && {
          cantidadActual: { lte: this.prisma.producto.fields.cantidadMinima },
        }),
      },
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, eliminado: false },
      include: {
        categoria: true,
        movimientos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!producto)
      throw new NotFoundException(`Producto con id ${id} no encontrado.`);
    return producto;
  }

  async update(id: number, dto: UpdateProductoDto) {
    await this.getOrFail(id);
    return this.prisma.producto.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.precioVenta && {
          precioVenta: parseFloat(dto.precioVenta),
        }),
        ...(dto.precioCompra && {
          precioCompra: parseFloat(dto.precioCompra),
        }),
        ...(dto.fechaVencimiento && {
          fechaVencimiento: new Date(dto.fechaVencimiento),
        }),
      },
      include: { categoria: true },
    });
  }

  async remove(id: number) {
    await this.getOrFail(id);
    return this.prisma.producto.update({
      where: { id },
      data: { eliminado: true },
    });
  }

  async uploadImagen(id: number, filename: string) {
    await this.getOrFail(id);
    // Guarda la ruta relativa; el gateway la expone en /api/v1/uploads/productos/:filename
    const imagenPath = `/api/v1/uploads/productos/${filename}`;
    return this.prisma.producto.update({
      where: { id },
      data: { imagen: imagenPath },
      include: { categoria: true },
    });
  }

  // ── Búsqueda de texto libre ────────────────────────────────────────────

  buscar(q: string) {
    return this.prisma.producto.findMany({
      where: {
        eliminado: false,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { codigoBarras: { contains: q, mode: 'insensitive' } },
          { codigoInterno: { contains: q, mode: 'insensitive' } },
          { fabricante: { contains: q, mode: 'insensitive' } },
          { marca: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
      take: 50,
    });
  }

  // ── Importación masiva ─────────────────────────────────────────────────

  /**
   * Devuelve un preview con validaciones sin guardar en BD.
   * Permite al frontend mostrar qué filas son válidas o tienen errores.
   */
  async previewImport(buffer: Buffer) {
    const filas = this.parsearArchivo(buffer);
    const { validas, errores } = this.validarFilas(filas);
    return {
      totalFilas: filas.length,
      filasValidas: validas.length,
      filasConError: errores.length,
      errores,
      preview: validas.slice(0, 5), // muestra las primeras 5 válidas
    };
  }

  /**
   * Importa masivamente los productos del archivo.
   * Salta las filas con error y reporta cuántas se importaron.
   */
  async bulkImport(buffer: Buffer) {
    const filas = this.parsearArchivo(buffer);
    const { validas, errores } = this.validarFilas(filas);

    if (validas.length === 0) {
      throw new BadRequestException({
        message: 'No hay filas válidas para importar.',
        errores,
      });
    }

    const result = await this.prisma.producto.createMany({
      data: validas.map((fila) => ({
        nombre: String(fila.nombre),
        descripcion: fila.descripcion ? String(fila.descripcion) : undefined,
        codigoBarras: fila.codigoBarras ? String(fila.codigoBarras) : undefined,
        codigoInterno: fila.codigoInterno ? String(fila.codigoInterno) : undefined,
        marca: fila.marca ? String(fila.marca) : undefined,
        fabricante: fila.fabricante ? String(fila.fabricante) : undefined,
        precioCompra: fila.precioCompra
          ? parseFloat(String(fila.precioCompra))
          : undefined,
        precioVenta: parseFloat(String(fila.precioVenta)),
        cantidadActual: fila.cantidadActual
          ? parseInt(String(fila.cantidadActual))
          : 0,
        cantidadMinima: fila.cantidadMinima
          ? parseInt(String(fila.cantidadMinima))
          : 0,
        cantidadMaxima: fila.cantidadMaxima
          ? parseInt(String(fila.cantidadMaxima))
          : undefined,
        fechaVencimiento: fila.fechaVencimiento
          ? new Date(String(fila.fechaVencimiento))
          : undefined,
        imagen: fila.imagen ? String(fila.imagen) : undefined,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Importación completada.',
      importados: result.count,
      omitidos: validas.length - result.count + errores.length,
      errores,
    };
  }

  // ── Helpers privados ───────────────────────────────────────────────────

  private parsearArchivo(buffer: Buffer): FilaImportacion[] {
    // type:'string' con toString('utf8') evita que SheetJS interprete el CSV como CP1252
    const workbook = XLSX.read(buffer.toString('utf8'), { type: 'string', cellDates: true });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<FilaImportacion>(hoja, { defval: null });
  }

  private validarFilas(filas: FilaImportacion[]) {
    const validas: FilaImportacion[] = [];
    const errores: { fila: number; errores: string[] }[] = [];

    filas.forEach((fila, i) => {
      const numeroFila = i + 2; // fila 1 = encabezados
      const errs: string[] = [];

      if (!fila.nombre || String(fila.nombre).trim() === '')
        errs.push('El campo "nombre" es requerido.');

      if (
        fila.precioVenta === null ||
        fila.precioVenta === undefined ||
        isNaN(parseFloat(String(fila.precioVenta)))
      )
        errs.push('El campo "precioVenta" debe ser un número válido.');

      if (
        fila.cantidadActual !== null &&
        fila.cantidadActual !== undefined &&
        (isNaN(parseInt(String(fila.cantidadActual))) ||
          parseInt(String(fila.cantidadActual)) < 0)
      )
        errs.push('"cantidadActual" debe ser un entero >= 0.');

      if (
        fila.cantidadMinima !== null &&
        fila.cantidadMinima !== undefined &&
        (isNaN(parseInt(String(fila.cantidadMinima))) ||
          parseInt(String(fila.cantidadMinima)) < 0)
      )
        errs.push('"cantidadMinima" debe ser un entero >= 0.');

      if (errs.length > 0) {
        errores.push({ fila: numeroFila, errores: errs });
      } else {
        validas.push(fila);
      }
    });

    return { validas, errores };
  }

  private async getOrFail(id: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, eliminado: false },
    });
    if (!producto)
      throw new NotFoundException(`Producto con id ${id} no encontrado.`);
    return producto;
  }
}
