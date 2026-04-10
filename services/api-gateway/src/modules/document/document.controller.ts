import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Presigned PUT URL and document key returned' })
  @ApiResponse({ status: 400, description: 'Validation error or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUploadUrl(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = uploadUrlSchema.parse(body);
    return this.documentService.getUploadUrl(user.userId, input);
  }

  /** POST /documents — save a document record after S3 upload */
  @Post('documents')
  @ApiOperation({ summary: 'Save document metadata after uploading to S3' })
  @ApiResponse({ status: 201, description: 'Document record saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Shipment not found (if shipmentId provided)' })
  async saveDocument(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = saveDocumentSchema.parse(body);
    return this.documentService.saveDocument(user.userId, input);
  }

  /** GET /shipments/:shipmentId/documents — list documents for a shipment */
  @Get('shipments/:shipmentId/documents')
  @ApiOperation({ summary: 'List all documents for a shipment' })
  @ApiParam({ name: 'shipmentId', type: String })
  @ApiResponse({ status: 200, description: 'List of documents for the shipment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
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
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Ownership or admin required' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.documentService.deleteDocument(id, user.userId, user.role);
  }
}
