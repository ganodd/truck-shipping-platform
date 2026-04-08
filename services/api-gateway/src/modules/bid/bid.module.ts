import { Module } from '@nestjs/common';

import { BidController } from './bid.controller';
import { BidRepository } from './bid.repository';
import { BidService } from './bid.service';

@Module({
  controllers: [BidController],
  providers: [BidRepository, BidService],
  exports: [BidService, BidRepository],
})
export class BidModule {}
