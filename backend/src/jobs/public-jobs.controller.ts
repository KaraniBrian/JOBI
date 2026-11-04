import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { JobsService } from './jobs.service';

class PublicJobsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)
  limit?: number;
}

/** Read-only, no login: powers the landing page. Applying or viewing details still needs an account. */
@Controller('public/jobs')
export class PublicJobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  latest(@Query() query: PublicJobsQuery) {
    return this.service.findPublic(query.limit ?? 6);
  }
}
