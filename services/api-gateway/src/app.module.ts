import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { HealthModule } from './health/health.module';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { BidModule } from './modules/bid/bid.module';
import { DocumentModule } from './modules/document/document.module';
import { LoadModule } from './modules/load/load.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RatingModule } from './modules/rating/rating.module';
import { ShipmentModule } from './modules/shipment/shipment.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    LoadModule,
    BidModule,
    ShipmentModule,
    VehicleModule,
    DocumentModule,
    PaymentModule,
    RatingModule,
    NotificationModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware, AuthMiddleware).forRoutes('*');
  }
}
