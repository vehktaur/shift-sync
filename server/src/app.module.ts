import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OperationsModule } from './operations/operations.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SwapRequestsModule } from './swap-requests/swap-requests.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    RealtimeModule,
    NotificationsModule,
    SchedulingModule,
    ShiftsModule,
    AssignmentsModule,
    SwapRequestsModule,
    OperationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
