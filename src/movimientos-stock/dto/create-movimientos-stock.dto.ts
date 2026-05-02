import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovimientosStockDto {
  @IsInt()
  @Type(() => Number)
  productoId!: number;

  @IsIn(['ENTRADA', 'SALIDA', 'AJUSTE'], {
    message: 'tipo debe ser ENTRADA, SALIDA o AJUSTE',
  })
  tipo!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  cantidad!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  usuarioId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sucursalId?: number;
}
