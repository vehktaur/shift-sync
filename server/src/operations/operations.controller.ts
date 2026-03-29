import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { SchedulingService } from '../scheduling/scheduling.service';
import type {
  FairnessReportResponse,
  OnDutyLocationResponse,
  OperationsDashboardResponse,
} from '../scheduling/scheduling.types';

@Controller('operations')
@UseGuards(SessionGuard)
export class OperationsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser() viewer: SessionUser,
    @Query('weekStart') weekStart?: string,
  ): OperationsDashboardResponse {
    return this.schedulingService.getOperationsDashboard(viewer, weekStart);
  }

  @Get('fairness')
  getFairness(
    @CurrentUser() viewer: SessionUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): FairnessReportResponse {
    return this.schedulingService.getFairnessReport(viewer, startDate, endDate);
  }

  @Get('on-duty-now')
  getOnDutyNow(
    @CurrentUser() viewer: SessionUser,
    @Query('atUtc') atUtc?: string,
  ): OnDutyLocationResponse[] {
    return this.schedulingService.getOnDutyNow(viewer, atUtc);
  }
}
