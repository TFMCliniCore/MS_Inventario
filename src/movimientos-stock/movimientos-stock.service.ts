import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientosStockDto } from './dto/create-movimientos-stock.dto';

@Injectable()
export class MovimientosStockService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovimientosStockDto) {
    // 1. Obtener producto actual
    const producto = await this.prisma.producto.findFirst({
      where: { id: dto.productoId, eliminado: false },
    });
    if (!producto)
      throw new NotFoundException(
        `Producto con id ${dto.productoId} no encontrado.`,
      );

    const cantidadAnterior = producto.cantidadActual;
    let cantidadPosterior: number;

    // 2. Calcular nueva cantidad según tipo
    if (dto.tipo === 'ENTRADA') {
      cantidadPosterior = cantidadAnterior + dto.cantidad;
    } else if (dto.tipo === 'SALIDA') {
      if (cantidadAnterior < dto.cantidad)
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${cantidadAnterior}, solicitado: ${dto.cantidad}.`,
        );
      cantidadPosterior = cantidadAnterior - dto.cantidad;
    } else {
      // AJUSTE: la cantidad ingresada reemplaza el stock actual
      cantidadPosterior = dto.cantidad;
    }

    // 3. Registrar movimiento y actualizar stock en una transacción
    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoStock.create({
        data: {
          productoId: dto.productoId,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          cantidadAnterior,
          cantidadPosterior,
          motivo: dto.motivo,
          usuarioId: dto.usuarioId,
          sucursalId: dto.sucursalId,
        },
        include: {
          producto: {
            select: { id: true, nombre: true, cantidadActual: true },
          },
        },
      }),
      this.prisma.producto.update({
        where: { id: dto.productoId },
        data: { cantidadActual: cantidadPosterior },
      }),
    ]);

    return movimiento;
  }

  findAll(filters: {
    productoId?: number;
    tipo?: string;
    sucursalId?: number;
    usuarioId?: number;
  }) {
    return this.prisma.movimientoStock.findMany({
      where: {
        ...(filters.productoId && { productoId: filters.productoId }),
        ...(filters.tipo && { tipo: filters.tipo }),
        ...(filters.sucursalId && { sucursalId: filters.sucursalId }),
        ...(filters.usuarioId && { usuarioId: filters.usuarioId }),
      },
      include: {
        producto: { select: { id: true, nombre: true, codigoInterno: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const movimiento = await this.prisma.movimientoStock.findUnique({
      where: { id },
      include: { producto: true },
    });
    if (!movimiento)
      throw new NotFoundException(`Movimiento con id ${id} no encontrado.`);
    return movimiento;
  }

  findByProducto(productoId: number) {
    return this.prisma.movimientoStock.findMany({
      where: { productoId },
      orderBy: { createdAt: 'desc' },
    });
  }
}