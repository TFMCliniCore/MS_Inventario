import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger'; // 👈 Importación de Swagger
import { MovimientosStockService } from './movimientos-stock.service';
import { CreateMovimientosStockDto } from './dto/create-movimientos-stock.dto';

@ApiTags('Movimientos de Stock') // 👈 Agrupador para la UI de Swagger
@Controller('movimientos-stock')
export class MovimientosStockController {
  constructor(private readonly service: MovimientosStockService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo movimiento de inventario (Entrada / Salida / Ajuste)' })
  create(@Body() dto: CreateMovimientosStockDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar el historial global de movimientos de stock con filtros avanzados' })
  findAll(
    @Query('productoId') productoId?: string,
    @Query('tipo')       tipo?: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('usuarioId')  usuarioId?: string,
  ) {
    return this.service.findAll({
      productoId: productoId ? Number(productoId) : undefined,
      tipo,
      sucursalId: sucursalId ? Number(sucursalId) : undefined,
      usuarioId:  usuarioId  ? Number(usuarioId)  : undefined,
    });
  }

  @Get('producto/:productoId')
  @ApiOperation({ summary: 'Filtrar todos los movimientos de stock asociados a un único producto' })
  findByProducto(@Param('productoId', ParseIntPipe) productoId: number) {
    return this.service.findByProducto(productoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de auditoría de un movimiento específico por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}