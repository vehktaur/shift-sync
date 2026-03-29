import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { SchedulingService } from '../scheduling/scheduling.service';
import type {
  EligibleStaffResponse,
  SchedulingBoardResponse,
  ShiftReferenceDataResponse,
  ShiftMutationRequestBody,
  ShiftResponse,
} from '../scheduling/scheduling.types';

@Controller('shifts')
@UseGuards(SessionGuard)
export class ShiftsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('board')
  getBoard(
    @CurrentUser() viewer: SessionUser,
    @Query('weekStart') weekStart?: string,
  ): SchedulingBoardResponse {
    return this.schedulingService.getSchedulingBoard(viewer, weekStart);
  }

  @Get('reference-data')
  getReferenceData(): ShiftReferenceDataResponse {
    return this.schedulingService.getShiftReferenceData();
  }

  @Get(':shiftId/eligible-staff')
  getEligibleStaff(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
  ): EligibleStaffResponse[] {
    return this.schedulingService.getEligibleStaffForShift(viewer, shiftId);
  }

  @Post()
  createShift(
    @CurrentUser() viewer: SessionUser,
    @Body() body: ShiftMutationRequestBody,
  ): ShiftResponse {
    return this.schedulingService.createShift(viewer, body);
  }

  @Patch(':shiftId')
  updateShift(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
    @Body() body: ShiftMutationRequestBody,
  ): ShiftResponse {
    return this.schedulingService.updateShift(viewer, shiftId, body);
  }

  @Post(':shiftId/publish')
  publishShift(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
  ): ShiftResponse {
    return this.schedulingService.publishShift(viewer, shiftId);
  }

  @Post(':shiftId/unpublish')
  unpublishShift(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
  ): ShiftResponse {
    return this.schedulingService.unpublishShift(viewer, shiftId);
  }

  @Post('actions/publish-week')
  publishWeek(
    @CurrentUser() viewer: SessionUser,
    @Query('weekStart') weekStart?: string,
  ): SchedulingBoardResponse {
    return this.schedulingService.publishVisibleWeek(viewer, weekStart);
  }

  @Post('actions/unpublish-week')
  unpublishWeek(
    @CurrentUser() viewer: SessionUser,
    @Query('weekStart') weekStart?: string,
  ): SchedulingBoardResponse {
    return this.schedulingService.unpublishVisibleWeek(viewer, weekStart);
  }
}
