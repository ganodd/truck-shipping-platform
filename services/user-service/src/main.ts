import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { loadConfig } from '@truck-shipping/shared-utils';

import { UserModule } from './user.module';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(UserModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env['USER_SERVICE_PORT'] ?? 3001;
  await app.listen(port);
  console.warn(`✅ User Service running on port ${port}`);
}

void bootstrap();
