import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SwapRequestsController } from './swap-requests.controller';

@Module({
  imports: [AuthModule, SchedulingModule],
  controllers: [SwapRequestsController],
})
export class SwapRequestsModule {}
