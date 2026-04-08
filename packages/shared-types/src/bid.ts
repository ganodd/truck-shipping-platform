export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Bid {
  id: string;
  loadId: string;
  carrierId: string;
  amount: number;
  estimatedPickup: Date;
  estimatedDelivery: Date;
  notes?: string;
  status: BidStatus;
  createdAt: Date;
}
