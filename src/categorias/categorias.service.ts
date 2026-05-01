import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoriaDto) {
    return this.prisma.categoria.create({ data: dto });
  }

  findAll() {
    return this.prisma.categoria.findMany({
      where: { eliminado: false },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { productos: { where: { eliminado: false } } },
        },
      },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, eliminado: false },
      include: {
        _count: {
          select: { productos: { where: { eliminado: false } } },
        },
      },
    });
    if (!categoria)
      throw new NotFoundException(`Categoría con id ${id} no encontrada.`);
    return categoria;
  }

  async update(id: number, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categoria.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.categoria.update({
      where: { id },
      data: { eliminado: true },
    });
  }
}