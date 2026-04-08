export enum ShipmentStatus {
  PENDING_PICKUP = 'PENDING_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface StatusEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  latitude?: number;
  longitude?: number;
  notes?: string;
  timestamp: Date;
}

export interface Shipment {
  id: string;
  loadId: string;
  carrierId: string;
  shipperId: string;
  vehicleId?: string;
  acceptedBidId: string;
  agreedPrice: number;
  status: ShipmentStatus;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
