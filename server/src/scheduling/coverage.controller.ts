import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/auth.types';
import { SchedulingService } from './scheduling.service';
import type {
  CoverageActionResponse,
  CoverageBoardResponse,
} from './scheduling.types';

@Controller('coverage')
@UseGuards(SessionGuard)
export class CoverageController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('board')
  getBoard(@CurrentUser() viewer: SessionUser): CoverageBoardResponse {
    return this.schedulingService.getCoverageBoard(viewer);
  }

  @Post('requests/:requestId/approve')
  approve(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): CoverageActionResponse {
    return this.schedulingService.approveCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/cancel')
  cancel(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): CoverageActionResponse {
    return this.schedulingService.cancelCoverageRequest(viewer, requestId);
  }
}
