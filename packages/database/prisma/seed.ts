import { EquipmentType, LoadStatus, PrismaClient, ShipmentStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main(): Promise<void> {
  console.warn('🌱 Seeding database...');

  // Clean up existing data in correct order
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.locationUpdate.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.load.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.carrierProfile.deleteMany();
  await prisma.shipperProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const password = await hashPassword('Password123!');

  // ── Shipper users ─────────────────────────────────────
  const shipper1 = await prisma.user.create({
    data: {
      email: 'alice@acme-logistics.com',
      passwordHash: password,
      role: UserRole.SHIPPER,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+15551234567',
      companyName: 'ACME Logistics',
      kycStatus: 'APPROVED',
      emailVerified: true,
      shipperProfile: {
        create: {
          companyAddress: '100 Industrial Blvd, Chicago, IL 60601',
          verified: true,
        },
      },
    },
  });

  const shipper2 = await prisma.user.create({
    data: {
      email: 'bob@sunrise-supply.com',
      passwordHash: password,
      role: UserRole.SHIPPER,
      firstName: 'Bob',
      lastName: 'Martinez',
      phone: '+15559876543',
      companyName: 'Sunrise Supply Co.',
      kycStatus: 'APPROVED',
      emailVerified: true,
      shipperProfile: {
        create: {
          companyAddress: '200 Commerce Dr, Dallas, TX 75201',
          verified: true,
        },
      },
    },
  });

  // ── Carrier users ─────────────────────────────────────
  const carrier1 = await prisma.user.create({
    data: {
      email: 'carlos@truckpro.com',
      passwordHash: password,
      role: UserRole.CARRIER,
      firstName: 'Carlos',
      lastName: 'Rivera',
      phone: '+15552345678',
      kycStatus: 'APPROVED',
      emailVerified: true,
      carrierProfile: {
        create: {
          usdotNumber: 'USDOT-123456',
          mcNumber: 'MC-654321',
          licenseNumber: 'IL-CDL-789',
          preferredLanes: ['IL', 'IN', 'OH', 'MI'],
          verified: true,
        },
      },
    },
  });

  const carrier2 = await prisma.user.create({
    data: {
      email: 'diana@fastfreight.com',
      passwordHash: password,
      role: UserRole.CARRIER,
      firstName: 'Diana',
      lastName: 'Chen',
      phone: '+15553456789',
      kycStatus: 'APPROVED',
      emailVerified: true,
      carrierProfile: {
        create: {
          usdotNumber: 'USDOT-234567',
          mcNumber: 'MC-765432',
          licenseNumber: 'TX-CDL-456',
          preferredLanes: ['TX', 'OK', 'AR', 'LA'],
          verified: true,
        },
      },
    },
  });

  const carrier3 = await prisma.user.create({
    data: {
      email: 'evan@midwest-haulers.com',
      passwordHash: password,
      role: UserRole.CARRIER,
      firstName: 'Evan',
      lastName: 'Williams',
      phone: '+15554567890',
      kycStatus: 'PENDING',
      emailVerified: true,
      carrierProfile: {
        create: {
          usdotNumber: 'USDOT-345678',
          verified: false,
        },
      },
    },
  });

  // ── Dispatcher ─────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'dispatch@truckship.com',
      passwordHash: password,
      role: UserRole.DISPATCHER,
      firstName: 'Frank',
      lastName: 'Adams',
      phone: '+15555678901',
      kycStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  // ── Admin ─────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'admin@truckship.com',
      passwordHash: password,
      role: UserRole.ADMIN,
      firstName: 'Grace',
      lastName: 'Lee',
      phone: '+15556789012',
      kycStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  // ── Vehicles ─────────────────────────────────────
  const carrier1Profile = await prisma.carrierProfile.findUniqueOrThrow({
    where: { userId: carrier1.id },
  });
  const carrier2Profile = await prisma.carrierProfile.findUniqueOrThrow({
    where: { userId: carrier2.id },
  });

  const vehicle1 = await prisma.vehicle.create({
    data: {
      carrierId: carrier1Profile.id,
      type: EquipmentType.DRY_VAN,
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2021,
      licensePlate: 'IL-TRK-001',
      capacityTons: 22.5,
      vin: '1FUJGBDV5CLBP8279',
    },
  });

  await prisma.vehicle.create({
    data: {
      carrierId: carrier1Profile.id,
      type: EquipmentType.FLATBED,
      make: 'Kenworth',
      model: 'T680',
      year: 2022,
      licensePlate: 'IL-TRK-002',
      capacityTons: 24.0,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      carrierId: carrier2Profile.id,
      type: EquipmentType.REEFER,
      make: 'Peterbilt',
      model: '579',
      year: 2020,
      licensePlate: 'TX-TRK-001',
      capacityTons: 21.0,
    },
  });

  // ── Shipper profiles ─────────────────────────────────────
  const shipper1Profile = await prisma.shipperProfile.findUniqueOrThrow({
    where: { userId: shipper1.id },
  });
  const shipper2Profile = await prisma.shipperProfile.findUniqueOrThrow({
    where: { userId: shipper2.id },
  });

  // ── Loads ─────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const load1 = await prisma.load.create({
    data: {
      shipperId: shipper1Profile.id,
      origin: { address: '100 Industrial Blvd', city: 'Chicago', state: 'IL', zipCode: '60601', latitude: 41.8781, longitude: -87.6298 },
      destination: { address: '500 Commerce St', city: 'Indianapolis', state: 'IN', zipCode: '46201', latitude: 39.7684, longitude: -86.1581 },
      equipmentType: EquipmentType.DRY_VAN,
      weightLbs: 42000,
      dimensions: { lengthFt: 48 },
      pickupWindowStart: tomorrow,
      pickupWindowEnd: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
      deliveryWindowStart: in2Days,
      deliveryWindowEnd: new Date(in2Days.getTime() + 6 * 60 * 60 * 1000),
      description: 'Automotive parts — palletized, no hazmat',
      budgetMin: 85000,
      budgetMax: 110000,
      instantBookPrice: 100000,
      status: LoadStatus.AVAILABLE,
    },
  });

  const load2 = await prisma.load.create({
    data: {
      shipperId: shipper1Profile.id,
      origin: { address: '200 Warehouse Way', city: 'Columbus', state: 'OH', zipCode: '43201', latitude: 39.9612, longitude: -82.9988 },
      destination: { address: '800 Freight Ave', city: 'Detroit', state: 'MI', zipCode: '48201', latitude: 42.3314, longitude: -83.0458 },
      equipmentType: EquipmentType.FLATBED,
      weightLbs: 38000,
      pickupWindowStart: in2Days,
      pickupWindowEnd: new Date(in2Days.getTime() + 4 * 60 * 60 * 1000),
      deliveryWindowStart: in3Days,
      deliveryWindowEnd: new Date(in3Days.getTime() + 6 * 60 * 60 * 1000),
      description: 'Steel coils, tarped required',
      budgetMin: 75000,
      budgetMax: 95000,
      status: LoadStatus.AVAILABLE,
    },
  });

  const load3 = await prisma.load.create({
    data: {
      shipperId: shipper2Profile.id,
      origin: { address: '300 Cold Storage Pkwy', city: 'Dallas', state: 'TX', zipCode: '75201', latitude: 32.7767, longitude: -96.7970 },
      destination: { address: '900 Market St', city: 'Houston', state: 'TX', zipCode: '77001', latitude: 29.7604, longitude: -95.3698 },
      equipmentType: EquipmentType.REEFER,
      weightLbs: 35000,
      pickupWindowStart: tomorrow,
      pickupWindowEnd: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      deliveryWindowStart: in2Days,
      deliveryWindowEnd: new Date(in2Days.getTime() + 4 * 60 * 60 * 1000),
      description: 'Frozen food products, temp -20°F required',
      budgetMin: 65000,
      budgetMax: 85000,
      instantBookPrice: 80000,
      status: LoadStatus.BOOKED,
    },
  });

  // Additional available loads
  for (let i = 4; i <= 10; i++) {
    await prisma.load.create({
      data: {
        shipperId: i % 2 === 0 ? shipper1Profile.id : shipper2Profile.id,
        origin: {
          address: `${i * 100} Main St`,
          city: ['Chicago', 'Dallas', 'Columbus', 'Nashville', 'Memphis'][i % 5] ?? 'Chicago',
          state: ['IL', 'TX', 'OH', 'TN', 'TN'][i % 5] ?? 'IL',
          zipCode: ['60601', '75201', '43201', '37201', '38101'][i % 5] ?? '60601',
          latitude: [41.8781, 32.7767, 39.9612, 36.1627, 35.1495][i % 5] ?? 41.8781,
          longitude: [-87.6298, -96.7970, -82.9988, -86.7816, -90.0490][i % 5] ?? -87.6298,
        },
        destination: {
          address: `${i * 200} Commerce Blvd`,
          city: ['Indianapolis', 'Houston', 'Detroit', 'Atlanta', 'Birmingham'][i % 5] ?? 'Indianapolis',
          state: ['IN', 'TX', 'MI', 'GA', 'AL'][i % 5] ?? 'IN',
          zipCode: ['46201', '77001', '48201', '30301', '35201'][i % 5] ?? '46201',
          latitude: [39.7684, 29.7604, 42.3314, 33.7490, 33.5186][i % 5] ?? 39.7684,
          longitude: [-86.1581, -95.3698, -83.0458, -84.3880, -86.8104][i % 5] ?? -86.1581,
        },
        equipmentType: [EquipmentType.DRY_VAN, EquipmentType.FLATBED, EquipmentType.REEFER][i % 3] ?? EquipmentType.DRY_VAN,
        weightLbs: 30000 + i * 2000,
        pickupWindowStart: new Date(now.getTime() + i * 24 * 60 * 60 * 1000),
        pickupWindowEnd: new Date(now.getTime() + i * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        deliveryWindowStart: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
        deliveryWindowEnd: new Date(now.getTime() + (i + 2) * 24 * 60 * 60 * 1000),
        status: LoadStatus.AVAILABLE,
        budgetMin: 60000 + i * 5000,
        budgetMax: 90000 + i * 5000,
      },
    });
  }

  // ── Bids ─────────────────────────────────────
  const bid1 = await prisma.bid.create({
    data: {
      loadId: load1.id,
      carrierId: carrier1Profile.id,
      amount: 95000,
      estimatedPickup: tomorrow,
      estimatedDelivery: in2Days,
      notes: 'Can pickup at 8 AM, available on route',
      status: 'PENDING',
    },
  });

  const bid2 = await prisma.bid.create({
    data: {
      loadId: load1.id,
      carrierId: carrier2Profile.id,
      amount: 102000,
      estimatedPickup: tomorrow,
      estimatedDelivery: in2Days,
      status: 'PENDING',
    },
  });

  await prisma.bid.create({
    data: {
      loadId: load2.id,
      carrierId: carrier1Profile.id,
      amount: 82000,
      estimatedPickup: in2Days,
      estimatedDelivery: in3Days,
      status: 'PENDING',
    },
  });

  // Accepted bid for load3
  const bid3Accepted = await prisma.bid.create({
    data: {
      loadId: load3.id,
      carrierId: carrier2Profile.id,
      amount: 78000,
      estimatedPickup: tomorrow,
      estimatedDelivery: in2Days,
      status: 'ACCEPTED',
    },
  });

  // ── Active shipment ─────────────────────────────────────
  const shipment1 = await prisma.shipment.create({
    data: {
      loadId: load3.id,
      carrierId: carrier2Profile.id,
      shipperId: shipper2Profile.id,
      vehicleId: vehicle2.id,
      acceptedBidId: bid3Accepted.id,
      agreedPrice: 78000,
      status: ShipmentStatus.IN_TRANSIT,
      pickedUpAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  // Status events
  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.PENDING_PICKUP,
        notes: 'Shipment confirmed',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.PICKED_UP,
        latitude: 32.7767,
        longitude: -96.7970,
        notes: 'Loaded and departed Dallas',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.IN_TRANSIT,
        latitude: 31.5,
        longitude: -95.9,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
  });

  // Location updates
  await prisma.locationUpdate.createMany({
    data: [
      { shipmentId: shipment1.id, carrierId: carrier2Profile.id, latitude: 32.7767, longitude: -96.7970, speed: 0, timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      { shipmentId: shipment1.id, carrierId: carrier2Profile.id, latitude: 32.2, longitude: -96.4, speed: 65, heading: 195, timestamp: new Date(now.getTime() - 90 * 60 * 1000) },
      { shipmentId: shipment1.id, carrierId: carrier2Profile.id, latitude: 31.5, longitude: -95.9, speed: 68, heading: 200, timestamp: new Date(now.getTime() - 60 * 60 * 1000) },
      { shipmentId: shipment1.id, carrierId: carrier2Profile.id, latitude: 30.8, longitude: -95.6, speed: 62, heading: 198, timestamp: new Date(now.getTime() - 30 * 60 * 1000) },
    ],
  });

  console.warn('✅ Seed complete!');
  console.warn(`   Shippers: alice@acme-logistics.com, bob@sunrise-supply.com`);
  console.warn(`   Carriers: carlos@truckpro.com, diana@fastfreight.com, evan@midwest-haulers.com`);
  console.warn(`   Dispatcher: dispatch@truckship.com`);
  console.warn(`   Admin: admin@truckship.com`);
  console.warn(`   Password for all: Password123!`);
  console.warn(`   Loads: ${10} total (${9} available/booked, 1 in-transit shipment)`);
  console.warn(`   Bids: ${4} total (${3} pending, 1 accepted)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
