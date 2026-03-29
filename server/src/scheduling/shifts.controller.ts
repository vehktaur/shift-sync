import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/auth.types';
import { SchedulingService } from './scheduling.service';
import type {
  SchedulingBoardResponse,
  ShiftAssignmentRequestBody,
  ShiftMutationRequestBody,
  ShiftResponse,
} from './scheduling.types';

@Controller('shifts')
@UseGuards(SessionGuard)
export class ShiftsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('board')
  getBoard(@CurrentUser() viewer: SessionUser): SchedulingBoardResponse {
    return this.schedulingService.getSchedulingBoard(viewer);
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

  @Post(':shiftId/assignments')
  assignStaff(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
    @Body() body: ShiftAssignmentRequestBody,
  ): ShiftResponse {
    if (!body.staffId) {
      throw new BadRequestException('staffId is required.');
    }

    return this.schedulingService.assignStaff(viewer, shiftId, body.staffId);
  }

  @Delete(':shiftId/assignments/:staffId')
  removeStaff(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
    @Param('staffId') staffId: string,
  ): ShiftResponse {
    return this.schedulingService.removeAssignee(viewer, shiftId, staffId);
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
  publishWeek(@CurrentUser() viewer: SessionUser): SchedulingBoardResponse {
    return this.schedulingService.publishVisibleWeek(viewer);
  }

  @Post('actions/unpublish-week')
  unpublishWeek(@CurrentUser() viewer: SessionUser): SchedulingBoardResponse {
    return this.schedulingService.unpublishVisibleWeek(viewer);
  }
}
