import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { OperationsController } from './operations.controller';

@Module({
  imports: [AuthModule, SchedulingModule],
  controllers: [OperationsController],
})
export class OperationsModule {}
