import { User } from '../../domain/user';

export type CreateUserInput = {
  email: string;
  password?: string;
  displayName?: string;
  avatarUrl?: string;
};

export const USERS_REPOSITORY = 'USERS_REPOSITORY';

export interface UsersRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updatePassword(id: string, password: string): Promise<User>;
  hasUsers(): Promise<boolean>;
}
