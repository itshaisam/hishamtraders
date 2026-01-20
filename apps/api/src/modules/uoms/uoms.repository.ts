import { prisma } from '../../lib/prisma.js';
import { UnitOfMeasure } from '@prisma/client';
import { CreateUomDto } from './dto/create-uom.dto.js';
import { UpdateUomDto } from './dto/update-uom.dto.js';

export class UomsRepository {
  async findAll(): Promise<UnitOfMeasure[]> {
    return prisma.unitOfMeasure.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<UnitOfMeasure | null> {
    return prisma.unitOfMeasure.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<UnitOfMeasure | null> {
    return prisma.unitOfMeasure.findUnique({
      where: { name },
    });
  }

  async findByAbbreviation(abbreviation: string): Promise<UnitOfMeasure | null> {
    return prisma.unitOfMeasure.findUnique({
      where: { abbreviation },
    });
  }

  async create(data: CreateUomDto): Promise<UnitOfMeasure> {
    return prisma.unitOfMeasure.create({
      data: {
        name: data.name,
        abbreviation: data.abbreviation,
        description: data.description,
        active: true,
      },
    });
  }

  async update(id: string, data: UpdateUomDto): Promise<UnitOfMeasure> {
    return prisma.unitOfMeasure.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.unitOfMeasure.delete({
      where: { id },
    });
  }
}

export const uomsRepository = new UomsRepository();
