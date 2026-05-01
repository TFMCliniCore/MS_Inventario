import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MovimientosStockService } from './movimientos-stock.service';
import { CreateMovimientosStockDto } from './dto/create-movimientos-stock.dto';

@Controller('movimientos-stock')
export class MovimientosStockController {
  constructor(private readonly service: MovimientosStockService) {}

  @Post()
  create(@Body() dto: CreateMovimientosStockDto) {
    return this.service.create(dto);
  }

  @Get()
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
  findByProducto(@Param('productoId', ParseIntPipe) productoId: number) {
    return this.service.findByProducto(productoId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}