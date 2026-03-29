import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { AuditController } from './audit.controller';

@Module({
  imports: [AuthModule, SchedulingModule],
  controllers: [AuditController],
})
export class AuditModule {}
