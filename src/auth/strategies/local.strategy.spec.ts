import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('test@example.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when email is empty', async () => {
      await expect(strategy.validate('', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when password is empty', async () => {
      await expect(strategy.validate('test@example.com', ''))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when both email and password are empty', async () => {
      await expect(strategy.validate('', ''))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
