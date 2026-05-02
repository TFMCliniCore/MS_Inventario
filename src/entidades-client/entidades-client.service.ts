import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export interface SucursalRemota {
  id: number;
  nombre: string;
  direccion: string;
}

export interface UsuarioRemoto {
  id: number;
  nombres: string;
  email: string;
  cargo: string;
}

@Injectable()
export class EntidadesClientService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.MS_ENTIDADES_URL ?? 'http://localhost:3001/api/v1';
  }

  async getSucursal(id: number): Promise<SucursalRemota> {
    const res = await fetch(`${this.baseUrl}/sucursales/${id}`);
    if (res.status === 404)
      throw new NotFoundException(`Sucursal ${id} no encontrada.`);
    if (!res.ok)
      throw new InternalServerErrorException(
        `Error ms-entidades: ${res.status}`,
      );
    return res.json() as Promise<SucursalRemota>;
  }

  async getUsuario(id: number): Promise<UsuarioRemoto> {
    const res = await fetch(`${this.baseUrl}/usuarios/${id}`);
    if (res.status === 404)
      throw new NotFoundException(`Usuario ${id} no encontrado.`);
    if (!res.ok)
      throw new InternalServerErrorException(
        `Error ms-entidades: ${res.status}`,
      );
    return res.json() as Promise<UsuarioRemoto>;
  }
}