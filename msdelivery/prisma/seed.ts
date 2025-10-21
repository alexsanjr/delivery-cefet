import { PrismaClient, DeliveryPersonStatus, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Populando o banco...');

  const routingConfig = await prisma.routingConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      maxDeliveryRadius: 10.0,
      priorityFactor: 1.0,
      distanceWeight: 0.5,
      timeWeight: 0.3,
      ratingWeight: 0.2,
      isActive: true,
    },
  });
  console.log('Config de roteamento criada:', routingConfig.id);

  const deliveryPersons = await Promise.all([
    prisma.deliveryPerson.create({
      data: {
        name: 'João Silva',
        email: 'joao.silva@delivery.com',
        phone: '+5531987654321',
        cpf: '12345678901',
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
    prisma.deliveryPerson.create({
      data: {
        name: 'Maria Santos',
        email: 'maria.santos@delivery.com',
        phone: '+5531987654322',
        cpf: '12345678902',
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
    prisma.deliveryPerson.create({
      data: {
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@delivery.com',
        phone: '+5531987654323',
        cpf: '12345678903',
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
    prisma.deliveryPerson.create({
      data: {
        name: 'Ana Paula',
        email: 'ana.paula@delivery.com',
        phone: '+5531987654324',
        cpf: '12345678904',
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
    prisma.deliveryPerson.create({
      data: {
        name: 'Pedro Costa',
        email: 'pedro.costa@delivery.com',
        phone: '+5531987654325',
        cpf: '12345678905',
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

  console.log(`Criados ${deliveryPersons.length} entregadores na parada`);
  console.log('Banco populado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao popular o banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
