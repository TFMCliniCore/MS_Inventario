import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FiltrosProductoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  codigo?: string; // busca en codigoBarras Y codigoInterno

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoriaId?: number;

  @IsOptional()
  @IsString()
  fabricante?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sucursalId?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  stockBajo?: boolean; // productos con cantidadActual <= cantidadMinima
}
