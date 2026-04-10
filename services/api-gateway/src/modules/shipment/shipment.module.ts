import { Module } from '@nestjs/common';

import { GatewayModule } from '../../gateway/gateway.module';

import { ShipmentController } from './shipment.controller';
import { ShipmentRepository } from './shipment.repository';
import { ShipmentService } from './shipment.service';

@Module({
  imports: [GatewayModule],
  controllers: [ShipmentController],
  providers: [ShipmentRepository, ShipmentService],
  exports: [ShipmentService, ShipmentRepository],
})
export class ShipmentModule {}
