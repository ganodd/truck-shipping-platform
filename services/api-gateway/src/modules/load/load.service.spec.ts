import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoadStatus } from '@prisma/client';

import { EquipmentType, UserRole } from '@truck-shipping/shared-types';
import type { CreateLoadInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { LoadRepository } from './load.repository';
import { LoadService } from './load.service';
import { MatchingEngine } from './matching.engine';

// Minimal env for config loader
process.env['DATABASE_URL'] = 'postgresql://x:x@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['JWT_SECRET'] = 'test-secret-at-least-32-characters-long!!';

const mockShipperProfile = { id: 'shipper-profile-1', userId: 'user-1', verified: true };

const mockLoad = {
  id: 'load-1',
  shipperId: 'shipper-profile-1',
  origin: { address: '100 Main St', city: 'Chicago', state: 'IL', zipCode: '60601', latitude: 41.8781, longitude: -87.6298 },
  destination: { address: '500 Commerce', city: 'Indianapolis', state: 'IN', zipCode: '46201', latitude: 39.7684, longitude: -86.1581 },
  equipmentType: EquipmentType.DRY_VAN,
  weightLbs: 40000,
  pickupWindowStart: new Date('2026-05-01'),
  pickupWindowEnd: new Date('2026-05-01T06:00:00'),
  deliveryWindowStart: new Date('2026-05-02'),
  deliveryWindowEnd: new Date('2026-05-02T12:00:00'),
  status: LoadStatus.AVAILABLE,
  budgetMin: null,
  budgetMax: null,
  instantBookPrice: null,
  dimensions: null,
  description: null,
  specialInstructions: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createLoadInput: CreateLoadInput = {
  origin: { address: '100 Main St', city: 'Chicago', state: 'IL', zipCode: '60601', latitude: 41.8781, longitude: -87.6298 },
  destination: { address: '500 Commerce', city: 'Indianapolis', state: 'IN', zipCode: '46201', latitude: 39.7684, longitude: -86.1581 },
  equipmentType: EquipmentType.DRY_VAN,
  weightLbs: 40000,
  pickupWindowStart: new Date('2026-05-01'),
  pickupWindowEnd: new Date('2026-05-01T06:00:00'),
  deliveryWindowStart: new Date('2026-05-02'),
  deliveryWindowEnd: new Date('2026-05-02T12:00:00'),
};

describe('LoadService', () => {
  let service: LoadService;
  let loadRepo: jest.Mocked<LoadRepository>;
  let prisma: jest.Mocked<PrismaService>;
  let matchingEngine: MatchingEngine;

  beforeEach(async () => {
    const mockLoadRepo: Partial<jest.Mocked<LoadRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByShipper: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      findEligibleCarriers: jest.fn(),
    };

    const mockPrisma = {
      shipperProfile: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module = await Test.createTestingModule({
      providers: [
        LoadService,
        MatchingEngine,
        { provide: LoadRepository, useValue: mockLoadRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(LoadService);
    loadRepo = module.get(LoadRepository);
    prisma = module.get(PrismaService);
    matchingEngine = module.get(MatchingEngine);
  });

  describe('createLoad', () => {
    it('creates a load for a valid shipper', async () => {
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);
      (loadRepo.create as jest.Mock).mockResolvedValue({ ...mockLoad, shipper: mockShipperProfile });

      const result = await service.createLoad('user-1', createLoadInput);

      expect(result.id).toBe('load-1');
      expect(loadRepo.create).toHaveBeenCalledWith('shipper-profile-1', createLoadInput);
    });

    it('throws ForbiddenException when user has no shipper profile', async () => {
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createLoad('user-no-profile', createLoadInput)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getLoad', () => {
    it('returns load when found', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue(mockLoad);

      const result = await service.getLoad('load-1');

      expect(result.id).toBe('load-1');
    });

    it('throws NotFoundException when load does not exist', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getLoad('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLoad', () => {
    it('updates load when user owns it and status allows', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue(mockLoad);
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);
      (loadRepo.update as jest.Mock).mockResolvedValue({ ...mockLoad, weightLbs: 35000 });

      const result = await service.updateLoad('load-1', 'user-1', { weightLbs: 35000 });

      expect(result.weightLbs).toBe(35000);
    });

    it('throws ForbiddenException when user does not own the load', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue(mockLoad);
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue({
        ...mockShipperProfile,
        id: 'different-profile',
      });

      await expect(service.updateLoad('load-1', 'user-2', { weightLbs: 35000 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws UnprocessableEntityException when load is BOOKED', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue({ ...mockLoad, status: LoadStatus.BOOKED });
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);

      await expect(service.updateLoad('load-1', 'user-1', { weightLbs: 35000 })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('cancelLoad', () => {
    it('cancels an AVAILABLE load', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue(mockLoad);
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);
      (loadRepo.cancel as jest.Mock).mockResolvedValue({ ...mockLoad, status: LoadStatus.CANCELLED });

      const result = await service.cancelLoad('load-1', 'user-1');

      expect(result.status).toBe(LoadStatus.CANCELLED);
    });

    it('throws UnprocessableEntityException when load is COMPLETED', async () => {
      (loadRepo.findById as jest.Mock).mockResolvedValue({ ...mockLoad, status: LoadStatus.COMPLETED });
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);

      await expect(service.cancelLoad('load-1', 'user-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('getMyLoads', () => {
    it('returns paginated loads for shipper', async () => {
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);
      (loadRepo.findByShipper as jest.Mock).mockResolvedValue({ loads: [mockLoad], total: 1 });

      const result = await service.getMyLoads('user-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
