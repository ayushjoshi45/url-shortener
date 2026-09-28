import {
  LoginUserDto,
  RegisterUserDto,
  UserResponseDto,
} from '@user-service/dtos/user.dto';
import { User } from '../generated/prisma';
import { UserRepository } from '@user-service/repositories/user.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  BadRequestError,
  IAuthPayload,
} from '@user-service/common';
import jwtConfig from '@user-service/config/jwt.config';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  public async register(userData: RegisterUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(userData.email);

    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.mapUserToDto(user);
  }

  public async login(loginData: LoginUserDto): Promise<{
    user: UserResponseDto;
    token: string;
  }> {
    const user = await this.userRepository.findByEmail(loginData.email);

    if (!user) {
      throw new BadRequestError('Wrong email or password');
    }

    // Google-only accounts have no password — they must use Google sign-in.
    if (!user.password) {
      throw new BadRequestError('Please sign in with Google');
    }

    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new BadRequestError('Wrong email or password');
    }

    const token = this.generateToken(user);

    return {
      user: this.mapUserToDto(user),
      token,
    };
  }

  public async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
  }): Promise<User> {
    const linked = await this.userRepository.findByGoogleId(profile.googleId);

    if (linked) {
      return linked;
    }

    const existing = await this.userRepository.findByEmail(profile.email);

    // Same email registered with password before — link Google to it.
    if (existing) {
      return this.userRepository.linkGoogleId(existing.id, profile.googleId);
    }

    return this.userRepository.createWithGoogle({
      email: profile.email,
      googleId: profile.googleId,
    });
  }

  public issueToken(user: User): {
    user: UserResponseDto;
    token: string;
  } {
    return {
      user: this.mapUserToDto(user),
      token: this.generateToken(user),
    };
  }
  async validateToken(token: string): Promise<UserResponseDto> {
    try {
      const payload = jwt.verify(token, jwtConfig.secret) as IAuthPayload;

      const user = await this.userRepository.findById(payload.id);

      if (!user) {
        throw new BadRequestError('User not found');
      }

      return this.mapUserToDto(user);
    } catch (error) {
      throw new BadRequestError('Invalid token');
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, username: deriveUsername(user.email) },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.expiresIn,
      }
    );
  }

  private mapUserToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: deriveUsername(user.email),
      createdAt: user.createdAt,
    };
  }
}

// Display-only username derived from the email local-part. Identity stays
// the email itself, so same-prefix collisions across domains are harmless.
function deriveUsername(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  return localPart.length > 0 ? localPart : email;
}

export const createAuthService = (userRepository: UserRepository) =>
  new AuthService(userRepository);
