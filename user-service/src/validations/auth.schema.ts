import {
  changePasswordSchema,
  loginUserSchema,
  registerUserSchema,
  updateProfileSchema,
} from '@user-service/dtos/user.dto';
import { z } from 'zod';

export const registerSchema = z.object({
  body: registerUserSchema,
});

export const loginSchema = z.object({
  body: loginUserSchema,
});

export const updateProfileRequestSchema = z.object({
  body: updateProfileSchema,
});

export const changePasswordRequestSchema = z.object({
  body: changePasswordSchema,
});
