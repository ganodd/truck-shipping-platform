export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum FeeType {
  LINEHAUL = 'LINEHAUL',
  DETENTION = 'DETENTION',
  LUMPER = 'LUMPER',
  ACCESSORIAL = 'ACCESSORIAL',
  FUEL_SURCHARGE = 'FUEL_SURCHARGE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface InvoiceLineItem {
  description: string;
  feeType: FeeType;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  shipmentId: string;
  shipperId: string;
  carrierId: string;
  stripePaymentIntentId?: string;
  amount: number;
  feeType: FeeType;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  shipmentId: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}
