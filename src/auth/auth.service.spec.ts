import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DATABASE_CONNECTION } from '../database/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockDb: any;

  const mockUser = {
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

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      mockDb.execute.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('should return null when user is not found', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      mockDb.execute.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });
  });

  describe('login', () => {
    it('should return LoginResponseDto with access token', async () => {
      const user = mockUserWithoutPassword;

      const result = await service.login(user);

      expect(result).toBeInstanceOf(LoginResponseDto);
      expect(result.access_token).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id });
    });
  });

  describe('register', () => {
    it('should create a new user and return UserResponseDto', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      };
      
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockDb.returning.mockResolvedValue([mockUser]);

      const result = await service.register(createUserDto);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
    });
  });
});
