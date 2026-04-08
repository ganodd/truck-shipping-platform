import { NestFactory } from '@nestjs/core';
import { DispatchModule } from './dispatch.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(DispatchModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env['DISPATCH_SERVICE_PORT'] ?? 3003;
  await app.listen(port);
  console.warn(`✅ Dispatch Service running on port ${port}`);
}

void bootstrap();
