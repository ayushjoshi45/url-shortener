import { RegisterUserDto } from '@user-service/dtos/user.dto';
import { PrismaClient } from '../generated/prisma';
import { User } from '@user-service/interfaces/user.interface';

export interface CreateGoogleUserData {
  email: string;
  googleId: string;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userData: RegisterUserDto): Promise<User> {
    return this.prisma.user.create({
      data: userData,
    });
  }

  async createWithGoogle(userData: CreateGoogleUserData): Promise<User> {
    return this.prisma.user.create({
      data: userData,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async linkGoogleId(id: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { googleId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}

export const createUserRepository = (prisma: PrismaClient) =>
  new UserRepository(prisma);
