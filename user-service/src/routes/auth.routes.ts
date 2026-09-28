import { AuthController } from '@user-service/controllers/auth.controller';
import { validateRequest } from '@user-service/middlewares/validation.middleware';
import {
  loginSchema,
  registerSchema,
} from '@user-service/validations/auth.schema';
import googleConfig from '@user-service/config/google.config';
import { passport } from '@user-service/auth/google.strategy';
import { Router } from 'express';

export const createAuthRouter = (authController: AuthController) => {
  const router = Router();

  router.post(
    '/register',
    validateRequest(registerSchema),
    authController.register.bind(authController)
  );

  router.post(
    '/login',
    validateRequest(loginSchema),
    authController.login.bind(authController)
  );

  router.get('/me', authController.me.bind(authController));

  // Google OAuth. Gateway strips /api/users, so the public callback URL is
  // {GATEWAY}/api/users/auth/google/callback — whitelisted in Google Console.
  router.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })
  );

  router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${googleConfig.frontendUrl}/login?oauth=error`,
    }),
    authController.googleCallback.bind(authController)
  );

  router.get(
    '/validate-token',
    authController.validateToken.bind(authController)
  );

  return router;
};
