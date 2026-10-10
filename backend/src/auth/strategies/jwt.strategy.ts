import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'EMPLOYER' | 'JOB_SEEKER';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is missing from the environment.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (
      !payload.sub ||
      !['ADMIN', 'EMPLOYER', 'JOB_SEEKER'].includes(
        payload.role,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid access token.',
      );
    }

    const user = await this.prisma.users.findFirst({
      where: {
        id: payload.sub,
        deleted_at: null,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        email_verified: true,
        account_status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User account not found.',
      );
    }

    if (
      !user.email_verified ||
      user.account_status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Your account is not authorized to access this resource.',
      );
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      role: payload.role,
    };
  }
}