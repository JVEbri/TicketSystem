import { Inject, Injectable } from '@nestjs/common';
import { CreateUserInput, USERS_REPOSITORY } from './ports/users-repository';
import type { UsersRepository } from './ports/users-repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepo: UsersRepository,
  ) {}

  async createUser(input: CreateUserInput) {
    return this.usersRepo.create(input);
  }

  async getUserById(id: string) {
    return this.usersRepo.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async hasUsers(): Promise<boolean> {
    return this.usersRepo.hasUsers();
  }
}
