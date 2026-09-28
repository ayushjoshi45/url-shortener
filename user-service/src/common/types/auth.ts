declare global {
  namespace Express {
    // Passport also declares Request.user as Express.User — keep both
    // declarations identical by routing ours through it. The full user
    // entity always satisfies the JWT payload shape, except username which
    // is derived (not stored) and may be absent on passport-provided users.
    interface User extends Omit<IAuthPayload, 'username'> {
      username?: string;
      password?: string | null;
      googleId?: string | null;
    }
    interface Request {
      user?: User
    }
  }
}

export interface IAuthPayload {
  id: string
  email: string
  username: string
}
