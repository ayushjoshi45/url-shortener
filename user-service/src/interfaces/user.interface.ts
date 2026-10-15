export interface User {
  id: string;
  email: string;
  password: string | null;
  googleId: string | null;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
