/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999887766',
      isPremium: true,
      addresses: {
        create: [
          {
            street: 'Rua das Flores',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            isPrimary: true,
          },
          {
            street: 'Av. Paulista',
            number: '456',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-000',
            isPrimary: false,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '21888776655',
      isPremium: false,
      addresses: {
        create: [
          {
            street: 'Rua do Comércio',
            number: '789',
            neighborhood: 'Centro',
            city: 'Rio de Janeiro',
            state: 'RJ',
            zipCode: '20040-020',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Pedro Oliveira',
      email: 'pedro@email.com',
      phone: '21777665544',
      isPremium: true,
      addresses: {
        create: [
          {
            street: 'Av. Atlântica',
            number: '321',
            neighborhood: 'Copacabana',
            city: 'Rio de Janeiro',
            state: 'RJ',
            zipCode: '22070-011',
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log('Customers created:', { customer1, customer2, customer3 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
