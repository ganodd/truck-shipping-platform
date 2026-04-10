import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { AuthPayload } from '@truck-shipping/shared-types';
import { saveDocumentSchema, uploadUrlSchema } from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';

import { DocumentService } from './document.service';

@Controller()
@ApiTags('Documents')
@ApiBearerAuth()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /** POST /documents/upload-url — get a presigned S3 PUT URL */
  @Post('documents/upload-url')
  @ApiOperation({ summary: 'Generate a presigned S3 URL for direct file upload' })
  async getUploadUrl(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = uploadUrlSchema.parse(body);
    return this.documentService.getUploadUrl(user.userId, input);
  }

  /** POST /documents — save a document record after S3 upload */
  @Post('documents')
  @ApiOperation({ summary: 'Save document metadata after uploading to S3' })
  async saveDocument(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = saveDocumentSchema.parse(body);
    return this.documentService.saveDocument(user.userId, input);
  }

  /** GET /shipments/:shipmentId/documents — list documents for a shipment */
  @Get('shipments/:shipmentId/documents')
  @ApiOperation({ summary: 'List all documents for a shipment' })
  @ApiParam({ name: 'shipmentId', type: String })
  async getShipmentDocuments(
    @CurrentUser() user: AuthPayload,
    @Param('shipmentId') shipmentId: string,
  ) {
    return this.documentService.getShipmentDocuments(shipmentId, user.userId, user.role);
  }

  /** DELETE /documents/:id — delete a document (owner or admin) */
  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document (owner or admin only)' })
  @ApiParam({ name: 'id', type: String })
  async deleteDocument(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.documentService.deleteDocument(id, user.userId, user.role);
  }
}
