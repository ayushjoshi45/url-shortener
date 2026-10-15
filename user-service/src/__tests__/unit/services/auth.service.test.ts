import { MockPrismaClient } from '@user-service/__mocks__/prisma';
import { RegisterUserDto } from '@user-service/dtos/user.dto';
import { UserRepository } from '@user-service/repositories/user.repository';
import { AuthService } from '@user-service/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let mockPrismaClient: MockPrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new MockPrismaClient();
    userRepository = new UserRepository(mockPrismaClient as any);
    authService = new AuthService(userRepository);
  });

  it('should register a new user', async () => {
    const userData: RegisterUserDto = {
      email: 'test@example.com',
      password: 'test_password',
    };

    const result = await authService.register(userData);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        email: userData.email,
        username: 'test',
        createdAt: expect.any(Date),
      })
    );

    expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
      data: { ...userData, password: expect.any(String) },
    });
  });

  it('should update only the name', async () => {
    const created = await authService.register({
      email: 'name@example.com',
      password: 'password123',
    });

    const result = await authService.updateProfile(created.id, { name: '  Ada  ' });

    expect(result.name).toBe('Ada');
    expect(result.email).toBe('name@example.com');
    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: created.id },
      data: { name: 'Ada' },
    });
  });

  it('should reject an empty name', async () => {
    const created = await authService.register({
      email: 'empty@example.com',
      password: 'password123',
    });

    await expect(authService.updateProfile(created.id, { name: '   ' })).rejects.toThrow(
      'Name cannot be empty'
    );
  });

  it('should change the password when the current one is correct', async () => {
    const created = await authService.register({
      email: 'pw@example.com',
      password: 'old-password',
    });

    const result = await authService.changePassword(created.id, {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.id).toBe(created.id);
    const login = await authService.login({ email: 'pw@example.com', password: 'new-password' });
    expect(login.user.id).toBe(created.id);
  });

  it('should reject a wrong current password', async () => {
    const created = await authService.register({
      email: 'wrong@example.com',
      password: 'old-password',
    });

    await expect(
      authService.changePassword(created.id, {
        currentPassword: 'nope',
        newPassword: 'new-password',
      })
    ).rejects.toThrow('Current password is incorrect');
  });
});
