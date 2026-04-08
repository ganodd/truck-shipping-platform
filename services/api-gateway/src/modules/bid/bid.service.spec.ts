import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BidStatus, LoadStatus } from '@prisma/client';

import { EquipmentType } from '@truck-shipping/shared-types';
import type { CreateBidInput } from '@truck-shipping/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { BidRepository } from './bid.repository';
import { BidService } from './bid.service';

process.env['DATABASE_URL'] = 'postgresql://x:x@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['JWT_SECRET'] = 'test-secret-at-least-32-characters-long!!';

const mockCarrierProfile = { id: 'carrier-profile-1', userId: 'carrier-user-1' };
const mockShipperProfile = { id: 'shipper-profile-1', userId: 'shipper-user-1' };

const mockLoad = {
  id: 'load-1',
  shipperId: 'shipper-profile-1',
  equipmentType: EquipmentType.DRY_VAN,
  status: LoadStatus.AVAILABLE,
  weightLbs: 40000,
};

const mockBid = {
  id: 'bid-1',
  loadId: 'load-1',
  carrierId: 'carrier-profile-1',
  amount: 9500000,
  estimatedPickup: new Date('2026-05-01'),
  estimatedDelivery: new Date('2026-05-02'),
  notes: null,
  status: BidStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  load: { ...mockLoad, shipper: mockShipperProfile },
  carrier: { id: 'carrier-profile-1', user: { id: 'carrier-user-1', firstName: 'Carlos', lastName: 'Rivera' } },
};

const createBidInput: CreateBidInput = {
  loadId: 'load-1',
  amount: 95000,
  estimatedPickup: new Date('2026-05-01'),
  estimatedDelivery: new Date('2026-05-02'),
};

describe('BidService', () => {
  let service: BidService;
  let bidRepo: jest.Mocked<BidRepository>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockBidRepo: Partial<jest.Mocked<BidRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByLoad: jest.fn(),
      findByCarrier: jest.fn(),
      countPendingByCarrier: jest.fn(),
      existsForLoadAndCarrier: jest.fn(),
      updateStatus: jest.fn(),
      rejectAllPendingForLoad: jest.fn(),
    };

    const mockTx = {
      bid: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      load: { update: jest.fn() },
      shipment: { create: jest.fn() },
    };

    const mockPrismaService = {
      carrierProfile: { findUnique: jest.fn() },
      shipperProfile: { findUnique: jest.fn() },
      load: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
      _mockTx: mockTx,
    } as unknown as jest.Mocked<PrismaService> & { _mockTx: typeof mockTx };

    const module = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: BidRepository, useValue: mockBidRepo },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get(BidService);
    bidRepo = module.get(BidRepository);
    prisma = module.get(PrismaService);
  });

  describe('placeBid', () => {
    it('places a bid when load is available and carrier has no duplicate', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(mockCarrierProfile);
      (prisma.load.findUnique as jest.Mock).mockResolvedValue(mockLoad);
      (bidRepo.existsForLoadAndCarrier as jest.Mock).mockResolvedValue(false);
      (bidRepo.countPendingByCarrier as jest.Mock).mockResolvedValue(0);
      (prisma.load.update as jest.Mock).mockResolvedValue({ ...mockLoad, status: LoadStatus.MATCHED });
      (bidRepo.create as jest.Mock).mockResolvedValue(mockBid);

      const result = await service.placeBid('carrier-user-1', createBidInput);

      expect(result.id).toBe('bid-1');
      expect(bidRepo.create).toHaveBeenCalledWith('carrier-profile-1', createBidInput);
    });

    it('throws ForbiddenException when user has no carrier profile', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.placeBid('user-no-profile', createBidInput)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when load does not exist', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(mockCarrierProfile);
      (prisma.load.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.placeBid('carrier-user-1', createBidInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException when load is already BOOKED', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(mockCarrierProfile);
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({ ...mockLoad, status: LoadStatus.BOOKED });

      await expect(service.placeBid('carrier-user-1', createBidInput)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws ConflictException when carrier already bid on the load', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(mockCarrierProfile);
      (prisma.load.findUnique as jest.Mock).mockResolvedValue(mockLoad);
      (bidRepo.existsForLoadAndCarrier as jest.Mock).mockResolvedValue(true);

      await expect(service.placeBid('carrier-user-1', createBidInput)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('rejectBid', () => {
    it('rejects a pending bid owned by shipper', async () => {
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue(mockShipperProfile);
      (bidRepo.findById as jest.Mock).mockResolvedValue(mockBid);
      (bidRepo.updateStatus as jest.Mock).mockResolvedValue({ ...mockBid, status: BidStatus.REJECTED });

      const result = await service.rejectBid('bid-1', 'shipper-user-1');

      expect(result.status).toBe(BidStatus.REJECTED);
    });

    it('throws ForbiddenException when shipper does not own the load', async () => {
      (prisma.shipperProfile.findUnique as jest.Mock).mockResolvedValue({
        ...mockShipperProfile,
        id: 'different-shipper',
      });
      (bidRepo.findById as jest.Mock).mockResolvedValue(mockBid);

      await expect(service.rejectBid('bid-1', 'shipper-user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('withdrawBid', () => {
    it('allows carrier to withdraw their own pending bid', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(mockCarrierProfile);
      (bidRepo.findById as jest.Mock).mockResolvedValue(mockBid);
      (bidRepo.updateStatus as jest.Mock).mockResolvedValue({ ...mockBid, status: BidStatus.WITHDRAWN });

      const result = await service.withdrawBid('bid-1', 'carrier-user-1');

      expect(result.status).toBe(BidStatus.WITHDRAWN);
    });

    it('throws ForbiddenException when carrier does not own the bid', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue({
        ...mockCarrierProfile,
        id: 'different-carrier',
      });
      (bidRepo.findById as jest.Mock).mockResolvedValue(mockBid);

      await expect(service.withdrawBid('bid-1', 'carrier-user-2')).rejects.toThrow(ForbiddenException);
    });

    it('throws UnprocessableEntityException when bid is not pending', async () => {
      (prisma.carrierProfile.findUnique as jest.Mock).mockResolvedValue(mockCarrierProfile);
      (bidRepo.findById as jest.Mock).mockResolvedValue({ ...mockBid, status: BidStatus.ACCEPTED });

      await expect(service.withdrawBid('bid-1', 'carrier-user-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
