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
  createSwap(
    @CurrentUser() viewer: SessionUser,
    @Body() body: CoverageRequestMutationBody,
  ): CoverageActionResponse {
    return this.schedulingService.createSwapRequest(viewer, body);
  }

  @Post('requests/drop')
  createDrop(
    @CurrentUser() viewer: SessionUser,
    @Body() body: CoverageRequestMutationBody,
  ): CoverageActionResponse {
    return this.schedulingService.createDropRequest(viewer, body);
  }

  @Post('requests/:requestId/accept')
  accept(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): CoverageActionResponse {
    return this.schedulingService.acceptCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/reject')
  reject(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): CoverageActionResponse {
    return this.schedulingService.rejectCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/claim')
  claim(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): CoverageActionResponse {
    return this.schedulingService.claimCoverageRequest(viewer, requestId);
  }

  @Post('requests/:requestId/withdraw')
  withdraw(
    @CurrentUser() viewer: SessionUser,
    @Param('requestId') requestId: string,
  ): CoverageActionResponse {
    return this.schedulingService.withdrawCoverageRequest(viewer, requestId);
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
