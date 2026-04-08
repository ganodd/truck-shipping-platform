import { NestFactory } from '@nestjs/core';
import { TrackingModule } from './tracking.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(TrackingModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env['TRACKING_SERVICE_PORT'] ?? 3004;
  await app.listen(port);
  console.warn(`✅ Tracking Service running on port ${port}`);
}

void bootstrap();
