import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { SchedulingService } from '../scheduling/scheduling.service';
import type {
  CoverageActionResponse,
  CoverageBoardResponse,
  CoverageRequestMutationBody,
  CoverageRequestOptionsResponse,
} from '../scheduling/scheduling.types';

@Controller('coverage')
@UseGuards(SessionGuard)
export class SwapRequestsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('board')
  getBoard(@CurrentUser() viewer: SessionUser): CoverageBoardResponse {
    return this.schedulingService.getCoverageBoard(viewer);
  }

  @Get('shifts/:shiftId/options')
  getRequestOptions(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
  ): CoverageRequestOptionsResponse {
    return this.schedulingService.getCoverageRequestOptions(viewer, shiftId);
  }

  @Post('requests/swap')
  async createSwap(
    @CurrentUser() viewer: SessionUser,
    @Body() body: CoverageRequestMutationBody,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.createSwapRequest(viewer, body);
  }

  @Post('requests/drop')
  async createDrop(
    @CurrentUser() viewer: SessionUser,
    @Body() body: CoverageRequestMutationBody,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.createDropRequest(viewer, body);
  }

  @Post('requests/:requestId/accept')
  async accept(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.acceptCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/reject')
  async reject(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.rejectCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/claim')
  async claim(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.claimCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/withdraw')
  async withdraw(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.withdrawCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/approve')
  async approve(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.approveCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/cancel')
  async cancel(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): Promise<CoverageActionResponse> {
    return this.schedulingService.cancelCoverageRequest(viewer, requestId);
  }
}
