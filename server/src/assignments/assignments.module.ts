import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { AssignmentsController } from './assignments.controller';

@Module({
  imports: [AuthModule, SchedulingModule],
  controllers: [AssignmentsController],
})
export class AssignmentsModule {}
