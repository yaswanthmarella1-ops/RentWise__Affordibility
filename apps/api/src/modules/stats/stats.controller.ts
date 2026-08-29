import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService, type StatsResponse } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Portfolio statistics across saved scenarios',
    description:
      'Aggregates the signed-in user\'s own scenarios. Sections that depend on an optional ' +
      'profile field (income, household size, city) are returned as null or as an ' +
      '"unavailable" object explaining what to fill in, never as an estimate.',
  })
  getStats(@CurrentUser('id') userId: string): Promise<StatsResponse> {
    return this.stats.getStats(userId);
  }
}
