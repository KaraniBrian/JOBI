import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

import { RegisterJobSeekerDto } from './dto/register-job-seeker.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Find a role by its name.
  //
  // This preserves our existing dynamic role lookup approach.
  // We can replace it with an explicit field lookup after
  // confirming the actual roles model in schema.prisma.
  private async findRoleId(roleName: string): Promise<string> {
    const roles = await this.prisma.roles.findMany();

    const matchingRole = roles.find((role) =>
      Object.values(role).some(
        (value) =>
          typeof value === 'string' &&
          value.toUpperCase() === roleName,
      ),
    );

    if (!matchingRole) {
      throw new BadRequestException(
        `The ${roleName} role was not found in the database.`,
      );
    }

    const roleId = Object.values(matchingRole).find(
      (value) =>
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        ),
    );

    if (typeof roleId !== 'string') {
      throw new InternalServerErrorException(
        `Could not determine the ${roleName} role ID.`,
      );
    }

    return roleId;
  }

  // Shared registration logic.
  private async registerUser(
    dto: RegisterJobSeekerDto | RegisterEmployerDto,
    roleName: 'JOB_SEEKER' | 'EMPLOYER',
  ) {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      password,
    } = dto;

    try {
      const roleId = await this.findRoleId(roleName);

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          role_id: roleId,
          first_name,
          last_name,
          email,
          phone_number,
          password_hash: passwordHash,
          email_verified: false,
          account_status: 'PENDING',
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          email_verified: true,
          account_status: true,
          created_at: true,
          updated_at: true,
        },
      });

      return {
        message:
          roleName === 'EMPLOYER'
            ? 'Employer account created. Complete email verification and company verification before accessing employer features.'
            : 'Job seeker account created. Complete email verification before logging in.',
        user,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'The email address or phone number is already registered.',
        );
      }

      throw error;
    }
  }

  // Register a job seeker.
  async registerJobSeeker(dto: RegisterJobSeekerDto) {
    return this.registerUser(dto, 'JOB_SEEKER');
  }

  // Register an employer.
  async registerEmployer(dto: RegisterEmployerDto) {
    return this.registerUser(dto, 'EMPLOYER');
  }

  // Log in using email and password.
  async login(dto: LoginDto) {
    const email = dto.email.trim();

    const user = await this.prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });

    // Use a generic message to avoid revealing
    // whether a particular email address exists.
    if (!user || !user.password_hash) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    // Do not issue a login token to an unverified account.
    if (!user.email_verified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    // Only active accounts can log in.
    if (user.account_status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Your account is not active. Please contact JOBI support if you need assistance.',
      );
    }

    // Resolve the role associated with the account.
    const roles = await this.prisma.roles.findMany();

    const userRole = roles.find((role) =>
      Object.values(role).some(
        (value) =>
          typeof value === 'string' &&
          value === user.role_id,
      ),
    );

    const roleName = userRole
      ? Object.values(userRole).find(
          (value) =>
            typeof value === 'string' &&
            [
              'ADMIN',
              'EMPLOYER',
              'JOB_SEEKER',
            ].includes(value.toUpperCase()),
        )
      : undefined;

    if (typeof roleName !== 'string') {
      throw new InternalServerErrorException(
        'The account role could not be resolved.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: roleName.toUpperCase(),
    });

    return {
      message: 'Login successful.',
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '1h',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        email_verified: user.email_verified,
        account_status: user.account_status,
        role: roleName.toUpperCase(),
      },
    };
  }
}