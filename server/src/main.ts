import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';

import {
  DEFAULT_CLIENT_ORIGIN,
  DEFAULT_SERVER_PORT,
} from './auth/auth.constants';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN ?? DEFAULT_CLIENT_ORIGIN,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? DEFAULT_SERVER_PORT);
}
void bootstrap();
