import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@user-service/services/auth.service';
import {
  loginUserSchema,
  registerUserSchema,
} from '@user-service/dtos/user.dto';
import { User } from '@user-service/interfaces/user.interface';
import googleConfig from '@user-service/config/google.config';
import { StatusCodes } from 'http-status-codes';

export class AuthController {
  constructor(private authService: AuthService) {}

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

      // Same http-only cookie contract as password login. Cookie host is
      // `localhost`, so the UI on another localhost port receives it too.
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect(`${googleConfig.frontendUrl}/dashboard`);
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
}

export const createAuthController = (authService: AuthService) => {
  return new AuthController(authService);
};
