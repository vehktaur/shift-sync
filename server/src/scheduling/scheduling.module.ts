import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { LocationsController } from './locations.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [AuthModule, NotificationsModule, RealtimeModule],
  controllers: [LocationsController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
