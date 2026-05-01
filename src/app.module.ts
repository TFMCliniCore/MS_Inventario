import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EntidadesClientModule } from './entidades-client/entidades-client.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProductosModule } from './productos/productos.module';
import { MovimientosStockModule } from './movimientos-stock/movimientos-stock.module';

@Module({
  imports: [
    PrismaModule,
    EntidadesClientModule,
    CategoriasModule,
    ProductosModule,
    MovimientosStockModule,
  ],
})
export class AppModule {}
