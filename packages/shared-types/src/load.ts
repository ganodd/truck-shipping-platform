export enum LoadStatus {
  DRAFT = 'DRAFT',
  AVAILABLE = 'AVAILABLE',
  MATCHED = 'MATCHED',
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EquipmentType {
  DRY_VAN = 'DRY_VAN',
  FLATBED = 'FLATBED',
  REEFER = 'REEFER',
  STEP_DECK = 'STEP_DECK',
  LOWBOY = 'LOWBOY',
  TANKER = 'TANKER',
  POWER_ONLY = 'POWER_ONLY',
  BOX_TRUCK = 'BOX_TRUCK',
}

export interface GeoLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface LoadDimensions {
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
}

export interface Load {
  id: string;
  shipperId: string;
  origin: GeoLocation;
  destination: GeoLocation;
  equipmentType: EquipmentType;
  weightLbs: number;
  dimensions?: LoadDimensions;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  deliveryWindowStart: Date;
  deliveryWindowEnd: Date;
  description?: string;
  specialInstructions?: string;
  budgetMin?: number;
  budgetMax?: number;
  instantBookPrice?: number;
  status: LoadStatus;
  createdAt: Date;
  updatedAt: Date;
}
