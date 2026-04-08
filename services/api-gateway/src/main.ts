import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { loadConfig } from '@truck-shipping/shared-utils';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, {
    logger: config.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
  });

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: config.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger docs (non-production only)
  if (config.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TruckShip API')
      .setDescription('Digital Freight Marketplace API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication and user management')
      .addTag('Loads', 'Load posting and management')
      .addTag('Bids', 'Bidding on loads')
      .addTag('Shipments', 'Shipment lifecycle management')
      .addTag('Vehicles', 'Carrier vehicle management')
      .addTag('Documents', 'Document upload and management')
      .addTag('Payments', 'Payment processing')
      .addTag('Ratings', 'User ratings')
      .addTag('Notifications', 'Notification management')
      .addTag('Admin', 'Admin-only operations')
      .addTag('Health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Global prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(config.PORT);
  console.warn(`🚀 API Gateway running on http://localhost:${config.PORT}/api/v1`);
  if (config.NODE_ENV !== 'production') {
    console.warn(`📚 Swagger docs at http://localhost:${config.PORT}/api/docs`);
  }
}

void bootstrap();
