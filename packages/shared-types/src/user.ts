export enum UserRole {
  SHIPPER = 'SHIPPER',
  CARRIER = 'CARRIER',
  DISPATCHER = 'DISPATCHER',
  ADMIN = 'ADMIN',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  companyName?: string;
  kycStatus: KycStatus;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipperProfile {
  userId: string;
  companyAddress?: string;
  businessLicense?: string;
  insuranceDoc?: string;
  verified: boolean;
}

export interface CarrierProfile {
  userId: string;
  usdotNumber?: string;
  mcNumber?: string;
  insuranceExpiry?: Date;
  licenseNumber?: string;
  licenseExpiry?: Date;
  preferredLanes?: string[];
  verified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role: UserRole;
  kycStatus: KycStatus;
  averageRating?: number;
  totalRatings?: number;
  verified: boolean;
  createdAt: Date;
}
