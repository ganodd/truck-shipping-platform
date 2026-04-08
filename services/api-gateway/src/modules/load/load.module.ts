import { Module } from '@nestjs/common';

import { LoadController } from './load.controller';
import { LoadRepository } from './load.repository';
import { LoadService } from './load.service';
import { MatchingEngine } from './matching.engine';

@Module({
  controllers: [LoadController],
  providers: [LoadRepository, LoadService, MatchingEngine],
  exports: [LoadService, LoadRepository],
})
export class LoadModule {}
