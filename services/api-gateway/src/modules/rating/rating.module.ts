import { Module } from '@nestjs/common';

import { RatingController } from './rating.controller';
import { RatingRepository } from './rating.repository';
import { RatingService } from './rating.service';

@Module({
  controllers: [RatingController],
  providers: [RatingRepository, RatingService],
  exports: [RatingService],
})
export class RatingModule {}
