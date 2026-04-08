import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(NotificationModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env['NOTIFICATION_SERVICE_PORT'] ?? 3006;
  await app.listen(port);
  console.warn(`✅ Notification Service running on port ${port}`);
}

void bootstrap();
