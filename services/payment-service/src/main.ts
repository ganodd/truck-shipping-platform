import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(PaymentModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env['PAYMENT_SERVICE_PORT'] ?? 3005;
  await app.listen(port);
  console.warn(`✅ Payment Service running on port ${port}`);
}

void bootstrap();
