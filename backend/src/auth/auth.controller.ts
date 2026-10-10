import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { RegisterJobSeekerDto } from './dto/register-job-seeker.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // POST /api/v1/auth/register/job-seeker
  @Post('register/job-seeker')
  @HttpCode(HttpStatus.CREATED)
  registerJobSeeker(
    @Body() dto: RegisterJobSeekerDto,
  ) {
    return this.authService.registerJobSeeker(dto);
  }

  // POST /api/v1/auth/register/employer
  @Post('register/employer')
  @HttpCode(HttpStatus.CREATED)
  registerEmployer(
    @Body() dto: RegisterEmployerDto,
  ) {
    return this.authService.registerEmployer(dto);
  }

  // POST /api/v1/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }
}