import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Inject } from '@nestjs/common';
import { users, User } from '../database/schema';
import { Database, DATABASE_CONNECTION } from '../database/types';
import { eq, or } from "drizzle-orm";
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ITokenPayload } from './interfaces/token-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<User, 'password'>): Promise<LoginResponseDto> {
    const payload: ITokenPayload = { sub: user.id };
    const access_token = this.jwtService.sign(payload);
    return new LoginResponseDto(access_token);
  }

  async register(userData: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(or(
        eq(users.username, userData.username),
        eq(users.email, userData.email)
      ))
      .execute();

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    return new UserResponseDto(user);
  }
}
