import { User } from '@user-service/interfaces/user.interface';

export const mockUser = {
  email: 'test@example.com',
  password: 'test_password',
};

export class MockPrismaClient {
  private users: User[] = [];

  user = {
    create: jest.fn().mockImplementation(({ data }) => {
      const newUser = {
        ...data,
        id: String(this.users.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.users.push(newUser);

      return Promise.resolve(newUser);
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      const user = this.users.find(
        (user) => user.id === where.id || user.email === where.email
      );
      return Promise.resolve(user || null);
    }),
    findFirst: jest.fn().mockImplementation(() => {
      return Promise.resolve(this.users[0]);
    }),
    findById: jest.fn().mockImplementation(({ where }) => {
      const user = this.users.find((user) => user.id === where.id);
      return Promise.resolve(user || null);
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      const index = this.users.findIndex((user) => user.id === where.id);
      if (index === -1) throw new Error('User not found');
      this.users[index] = {
        ...this.users[index],
        ...data,
        updatedAt: new Date(),
      };
      return Promise.resolve(this.users[index]);
    }),
  };
}
