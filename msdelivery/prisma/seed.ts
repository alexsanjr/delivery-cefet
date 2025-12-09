import { PrismaClient, DeliveryPersonStatus, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Populando o banco...');

  const existingCount = await prisma.deliveryPerson.count();
  if (existingCount > 0) {
    console.log(`Banco já possui ${existingCount} entregadores. Pulando seed.`);
    return;
  }

  const deliveryPersons = await Promise.all([
    prisma.deliveryPerson.upsert({
      where: { email: 'joao.silva@delivery.com' },
      update: {},
      create: {
        name: 'João Silva',
        email: 'joao.silva@delivery.com',
        phone: '31987654321',
        cpf: '52998224725',
        vehicleType: VehicleType.MOTORCYCLE,
        licensePlate: 'ABC-1234',
        status: DeliveryPersonStatus.AVAILABLE,
        rating: 4.8,
        totalDeliveries: 150,
        currentLatitude: -19.9191,
        currentLongitude: -43.9386,
        lastLocationUpdate: new Date(),
        isActive: true,
      },
    }),
    prisma.deliveryPerson.upsert({
      where: { email: 'maria.santos@delivery.com' },
      update: {},
      create: {
        name: 'Maria Santos',
        email: 'maria.santos@delivery.com',
        phone: '31987654322',
        cpf: '71428793860',
        vehicleType: VehicleType.BIKE,
        status: DeliveryPersonStatus.AVAILABLE,
        rating: 4.9,
        totalDeliveries: 200,
        currentLatitude: -19.9167,
        currentLongitude: -43.9345,
        lastLocationUpdate: new Date(),
        isActive: true,
      },
    }),
    prisma.deliveryPerson.upsert({
      where: { email: 'carlos.oliveira@delivery.com' },
      update: {},
      create: {
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@delivery.com',
        phone: '31987654323',
        cpf: '11144477735',
        vehicleType: VehicleType.CAR,
        licensePlate: 'XYZ-5678',
        status: DeliveryPersonStatus.BUSY,
        rating: 4.7,
        totalDeliveries: 180,
        currentLatitude: -19.9227,
        currentLongitude: -43.9450,
        lastLocationUpdate: new Date(),
        isActive: true,
      },
    }),
    prisma.deliveryPerson.upsert({
      where: { email: 'ana.paula@delivery.com' },
      update: {},
      create: {
        name: 'Ana Paula',
        email: 'ana.paula@delivery.com',
        phone: '31987654324',
        cpf: '49844426030',
        vehicleType: VehicleType.SCOOTER,
        status: DeliveryPersonStatus.AVAILABLE,
        rating: 4.6,
        totalDeliveries: 120,
        currentLatitude: -19.9100,
        currentLongitude: -43.9300,
        lastLocationUpdate: new Date(),
        isActive: true,
      },
    }),
    prisma.deliveryPerson.upsert({
      where: { email: 'pedro.costa@delivery.com' },
      update: {},
      create: {
        name: 'Pedro Costa',
        email: 'pedro.costa@delivery.com',
        phone: '31987654325',
        cpf: '44455566619',
        vehicleType: VehicleType.MOTORCYCLE,
        licensePlate: 'DEF-9012',
        status: DeliveryPersonStatus.ON_BREAK,
        rating: 4.5,
        totalDeliveries: 90,
        currentLatitude: -19.9250,
        currentLongitude: -43.9500,
        lastLocationUpdate: new Date(),
        isActive: true,
      },
    }),
  ]);

  console.log(`Criados ${deliveryPersons.length} entregadores`);
  console.log('Seed completo');
}

main()
  .catch((e) => {
    console.error('Erro ao popular o banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
