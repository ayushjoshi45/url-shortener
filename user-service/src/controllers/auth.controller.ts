import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@user-service/services/auth.service';
import {
  changePasswordSchema,
  loginUserSchema,
  registerUserSchema,
  updateProfileSchema,
} from '@user-service/dtos/user.dto';
import { User } from '@user-service/interfaces/user.interface';
import { UserResponseDto } from '@user-service/dtos/user.dto';
import { UnauthorizedError } from '@user-service/common';
import googleConfig from '@user-service/config/google.config';
import { StatusCodes } from 'http-status-codes';

export class AuthController {
  constructor(private authService: AuthService) {}

  private async resolveUser(req: Request): Promise<UserResponseDto> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Unauthorized');
    }

    const token = authHeader.split(' ')[1];

    return this.authService.validateToken(token);
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerUserSchema.parse(req.body);

      const user = await this.authService.register(validatedData);

      res.status(StatusCodes.CREATED).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginUserSchema.parse(req.body);

      const { user, token } = await this.authService.login(validatedData);

      res.status(200).json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const token = authHeader.split(' ')[1];

      const user = await this.authService.validateToken(token);

      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      // Set by passport from the verified Google profile (session: false).
      const user = req.user as User;
      const { token } = this.authService.issueToken(user);

      const target = new URL('/api/auth/google/callback', googleConfig.frontendUrl);
      target.searchParams.set('token', token);

      res.redirect(target.toString());
    } catch (error) {
      next(error);
    }
  }

  async validateToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const token = authHeader.split(' ')[1];

      const user = await this.authService.validateToken(token);

      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const current = await this.resolveUser(req);
      const validatedData = updateProfileSchema.parse(req.body);

      const user = await this.authService.updateProfile(current.id, validatedData);

      res.status(StatusCodes.OK).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const current = await this.resolveUser(req);

      await this.authService.deleteAccount(current.id);

      res.status(StatusCodes.NO_CONTENT).end();
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const current = await this.resolveUser(req);
      const validatedData = changePasswordSchema.parse(req.body);

      const user = await this.authService.changePassword(current.id, validatedData);

      res.status(StatusCodes.OK).json({ data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const createAuthController = (authService: AuthService) => {
  return new AuthController(authService);
};
