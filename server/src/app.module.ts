import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, UsersModule, SchedulingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
