import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { SchedulingService } from '../scheduling/scheduling.service';
import type {
  ShiftAssignmentRequestBody,
  ShiftResponse,
} from '../scheduling/scheduling.types';

@Controller('shifts/:shiftId/assignments')
@UseGuards(SessionGuard)
export class AssignmentsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  assignStaff(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
    @Body() body: ShiftAssignmentRequestBody,
  ): ShiftResponse {
    if (!body.staffId) {
      throw new BadRequestException('staffId is required.');
    }

    return this.schedulingService.assignStaff(
      viewer,
      shiftId,
      body.staffId,
      body.overrideReason,
    );
  }

  @Delete(':staffId')
  removeStaff(
    @CurrentUser() viewer: SessionUser,
    @Param('shiftId') shiftId: string,
    @Param('staffId') staffId: string,
  ): ShiftResponse {
    return this.schedulingService.removeAssignee(viewer, shiftId, staffId);
  }
}
