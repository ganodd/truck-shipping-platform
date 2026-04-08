export interface Rating {
  id: string;
  shipmentId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string;
  createdAt: Date;
}
