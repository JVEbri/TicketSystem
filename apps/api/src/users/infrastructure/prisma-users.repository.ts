import { User as PrismaUser } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../domain/user';
import {
  CreateUserInput,
  UsersRepository,
} from '../application/ports/users-repository';

function toDomain(prismaUser: PrismaUser): User {
  return new User({
    id: prismaUser.id,
    email: prismaUser.email,
    password: prismaUser.password,
    displayName: prismaUser.displayName,
    avatarUrl: prismaUser.avatarUrl,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  });
}

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      },
    });
    return toDomain(created);
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return found ? toDomain(found) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { email } });
    return found ? toDomain(found) : null;
  }

  async updatePassword(id: string, password: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password },
    });
    return toDomain(updated);
  }

  async hasUsers(): Promise<boolean> {
    const count = await this.prisma.user.count();
    return count > 0;
  }
}
