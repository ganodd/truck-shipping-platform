export enum VehicleType {
  DRY_VAN = 'DRY_VAN',
  FLATBED = 'FLATBED',
  REEFER = 'REEFER',
  STEP_DECK = 'STEP_DECK',
  LOWBOY = 'LOWBOY',
  TANKER = 'TANKER',
  BOX_TRUCK = 'BOX_TRUCK',
}

export interface Vehicle {
  id: string;
  carrierId: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  capacityTons: number;
  vin?: string;
  insuranceExpiry?: Date;
  active: boolean;
  createdAt: Date;
}
