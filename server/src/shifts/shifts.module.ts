import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { ShiftsController } from './shifts.controller';

@Module({
  imports: [AuthModule, SchedulingModule],
  controllers: [ShiftsController],
})
export class ShiftsModule {}
