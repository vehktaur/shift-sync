import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { RuntimeDataService } from './runtime-data.service';

@Global()
@Module({
  providers: [PrismaService, RuntimeDataService],
  exports: [PrismaService, RuntimeDataService],
})
export class PrismaModule {}
