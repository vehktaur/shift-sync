import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CoverageController } from './coverage.controller';
import { LocationsController } from './locations.controller';
import { SchedulingService } from './scheduling.service';
import { ShiftsController } from './shifts.controller';

@Module({
  imports: [AuthModule],
  controllers: [LocationsController, ShiftsController, CoverageController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
