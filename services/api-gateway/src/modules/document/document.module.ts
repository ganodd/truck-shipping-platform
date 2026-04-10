import { Module } from '@nestjs/common';

import { DocumentController } from './document.controller';
import { DocumentRepository } from './document.repository';
import { DocumentService } from './document.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentRepository, DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
