import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { SchedulingService } from '../scheduling/scheduling.service';
import type {
  AuditExportResponse,
  ShiftAuditHistoryResponse,
} from '../scheduling/scheduling.types';

@Controller('audit')
@UseGuards(SessionGuard)
export class AuditController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('shifts/:shiftId')
  getShiftHistory(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
  ): ShiftAuditHistoryResponse {
    if (viewer.role === 'staff') {
      throw new ForbiddenException('Audit history requires manager access.');
    }

    return this.schedulingService.getShiftAuditHistory(viewer, shiftId);
  }

  @Get('export')
  exportAudit(
    @CurrentUser() viewer: SessionUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationId') locationId?: string,
  ): AuditExportResponse {
    if (viewer.role !== 'admin') {
      throw new ForbiddenException('Audit export requires admin access.');
    }

    return this.schedulingService.exportAuditLog(
      viewer,
      startDate,
      endDate,
      locationId,
    );
  }
}
