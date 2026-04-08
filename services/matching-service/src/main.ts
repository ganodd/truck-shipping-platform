import { NestFactory } from '@nestjs/core';
import { MatchingModule } from './matching.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(MatchingModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env['MATCHING_SERVICE_PORT'] ?? 3002;
  await app.listen(port);
  console.warn(`✅ Matching Service running on port ${port}`);
}

void bootstrap();
