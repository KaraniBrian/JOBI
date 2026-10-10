import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthService } from './auth.service';

import { RegisterJobSeekerDto } from './dto/register-job-seeker.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    role: 'ADMIN' | 'EMPLOYER' | 'JOB_SEEKER';
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register/job-seeker')
  @HttpCode(HttpStatus.CREATED)
  registerJobSeeker(
    @Body() dto: RegisterJobSeekerDto,
  ) {
    return this.authService.registerJobSeeker(dto);
  }

  @Post('register/employer')
  @HttpCode(HttpStatus.CREATED)
  registerEmployer(
    @Body() dto: RegisterEmployerDto,
  ) {
    return this.authService.registerEmployer(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(
    @Req() request: AuthenticatedRequest,
  ) {
    return {
      message: 'Authenticated user retrieved successfully.',
      user: request.user,
    };
  }
}