import { Controller, Post, Body, UseGuards, Request, Get, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../database/schema';
import { IAuthenticatedRequest } from './interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req: IAuthenticatedRequest
  ): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return new UserResponseDto(user);
  }
}