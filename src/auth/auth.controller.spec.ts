import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../database/schema';
import { IAuthenticatedRequest } from './interfaces/authenticated-request.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const expectedResponse = new UserResponseDto(mockUser);
      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle registration errors', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockAuthService.register.mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(createUserDto)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockRequest: IAuthenticatedRequest = {
        user: mockUserWithoutPassword,
      } as any;

      const expectedResponse = new LoginResponseDto('mock-jwt-token');
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUserWithoutPassword);
    });

    it('should handle login errors', async () => {
      const mockRequest: IAuthenticatedRequest = {
        user: mockUserWithoutPassword,
      } as any;

      mockAuthService.login.mockRejectedValue(new Error('Login failed'));

      await expect(controller.login(mockRequest)).rejects.toThrow('Login failed');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const expectedResponse = new UserResponseDto(mockUser);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(expectedResponse);
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
    });
  });
});
