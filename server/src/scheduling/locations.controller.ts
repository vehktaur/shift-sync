import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/auth.types';
import type { ScheduleLocationResponse } from './scheduling.types';
import { SchedulingService } from './scheduling.service';

@Controller('locations')
@UseGuards(SessionGuard)
export class LocationsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  getLocations(@CurrentUser() viewer: SessionUser): ScheduleLocationResponse[] {
    return this.schedulingService.getLocations(viewer);
  }
}
