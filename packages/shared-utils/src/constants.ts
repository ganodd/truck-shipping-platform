import {
  BidStatus,
  DocumentType,
  EquipmentType,
  FeeType,
  KycStatus,
  LoadStatus,
  NotificationType,
  PaymentStatus,
  ShipmentStatus,
  UserRole,
  VehicleType,
} from '@truck-shipping/shared-types';

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.DRY_VAN]: 'Dry Van',
  [EquipmentType.FLATBED]: 'Flatbed',
  [EquipmentType.REEFER]: 'Refrigerated (Reefer)',
  [EquipmentType.STEP_DECK]: 'Step Deck',
  [EquipmentType.LOWBOY]: 'Lowboy',
  [EquipmentType.TANKER]: 'Tanker',
  [EquipmentType.POWER_ONLY]: 'Power Only',
  [EquipmentType.BOX_TRUCK]: 'Box Truck',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  [VehicleType.DRY_VAN]: 'Dry Van',
  [VehicleType.FLATBED]: 'Flatbed',
  [VehicleType.REEFER]: 'Refrigerated (Reefer)',
  [VehicleType.STEP_DECK]: 'Step Deck',
  [VehicleType.LOWBOY]: 'Lowboy',
  [VehicleType.TANKER]: 'Tanker',
  [VehicleType.BOX_TRUCK]: 'Box Truck',
};

export const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  [LoadStatus.DRAFT]: 'Draft',
  [LoadStatus.AVAILABLE]: 'Available',
  [LoadStatus.MATCHED]: 'Matched',
  [LoadStatus.BOOKED]: 'Booked',
  [LoadStatus.COMPLETED]: 'Completed',
  [LoadStatus.CANCELLED]: 'Cancelled',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  [ShipmentStatus.PENDING_PICKUP]: 'Pending Pickup',
  [ShipmentStatus.PICKED_UP]: 'Picked Up',
  [ShipmentStatus.IN_TRANSIT]: 'In Transit',
  [ShipmentStatus.DELIVERED]: 'Delivered',
  [ShipmentStatus.CANCELLED]: 'Cancelled',
};

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  [BidStatus.PENDING]: 'Pending',
  [BidStatus.ACCEPTED]: 'Accepted',
  [BidStatus.REJECTED]: 'Rejected',
  [BidStatus.WITHDRAWN]: 'Withdrawn',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PROCESSING]: 'Processing',
  [PaymentStatus.COMPLETED]: 'Paid',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
};

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  [FeeType.LINEHAUL]: 'Linehaul',
  [FeeType.DETENTION]: 'Detention',
  [FeeType.LUMPER]: 'Lumper',
  [FeeType.ACCESSORIAL]: 'Accessorial',
  [FeeType.FUEL_SURCHARGE]: 'Fuel Surcharge',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.POD]: 'Proof of Delivery',
  [DocumentType.BOL]: 'Bill of Lading',
  [DocumentType.RECEIPT]: 'Receipt',
  [DocumentType.LICENSE]: 'Driver License',
  [DocumentType.INSURANCE]: 'Insurance Certificate',
  [DocumentType.PERMIT]: 'Permit',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SHIPPER]: 'Shipper',
  [UserRole.CARRIER]: 'Carrier / Driver',
  [UserRole.DISPATCHER]: 'Dispatcher',
  [UserRole.ADMIN]: 'Administrator',
};

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  [KycStatus.NOT_SUBMITTED]: 'Not Submitted',
  [KycStatus.PENDING]: 'Under Review',
  [KycStatus.APPROVED]: 'Verified',
  [KycStatus.REJECTED]: 'Rejected',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.BOOKING_CONFIRMED]: 'Booking Confirmed',
  [NotificationType.STATUS_CHANGED]: 'Status Updated',
  [NotificationType.PAYMENT_RECEIVED]: 'Payment Received',
  [NotificationType.DOCUMENT_REQUESTED]: 'Document Requested',
  [NotificationType.BID_RECEIVED]: 'New Bid',
  [NotificationType.BID_ACCEPTED]: 'Bid Accepted',
  [NotificationType.BID_REJECTED]: 'Bid Rejected',
  [NotificationType.LOAD_CANCELLED]: 'Load Cancelled',
  [NotificationType.NEW_MESSAGE]: 'New Message',
};

// Business constants
export const MAX_ACTIVE_BIDS_PER_CARRIER = 10;
export const MAX_LOADS_PER_PAGE = 100;
export const DEFAULT_PAGE_SIZE = 20;
export const JWT_ACCESS_TOKEN_EXPIRY = '15m';
export const JWT_REFRESH_TOKEN_EXPIRY = '7d';
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
export const GPS_UPDATE_INTERVAL_MS = 30_000; // 30 seconds
export const BCRYPT_ROUNDS = 12;
