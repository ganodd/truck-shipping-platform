export enum DocumentType {
  POD = 'POD',
  BOL = 'BOL',
  RECEIPT = 'RECEIPT',
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  PERMIT = 'PERMIT',
}

export interface Document {
  id: string;
  shipmentId?: string;
  userId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verified: boolean;
  createdAt: Date;
}
