import { Module } from '@nestjs/common';
import { MovimientosStockController } from './movimientos-stock.controller';
import { MovimientosStockService } from './movimientos-stock.service';

@Module({
  controllers: [MovimientosStockController],
  providers: [MovimientosStockService],
})
export class MovimientosStockModule {}
