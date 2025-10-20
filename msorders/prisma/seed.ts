import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeds para testar Strategy Pattern...');

  // 🧹 Primeiro, limpar dados existentes para evitar duplicatas
  console.log('🧹 Limpando dados existentes...');

  await prisma.orderItem.deleteMany({});
  console.log('✅ OrderItems removidos');

  await prisma.order.deleteMany({});
  console.log('✅ Orders removidos');

  await prisma.product.deleteMany({});
  console.log('✅ Products removidos');

  // 🍕 Agora, criar produtos para usar nos pedidos
  console.log('📦 Criando produtos...');

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Pizza Margherita',
        description:
          'Pizza tradicional com molho de tomate, mussarela e manjericão',
        price: 25.5,
        category: 'Pizza',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Refrigerante Coca-Cola 350ml',
        description: 'Refrigerante gelado',
        price: 5.0,
        category: 'Bebida',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hambúrguer Gourmet',
        description: 'Hambúrguer artesanal com ingredientes premium',
        price: 35.0,
        category: 'Hambúrguer',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Batata Rústica',
        description: 'Porção de batata rústica temperada',
        price: 15.0,
        category: 'Acompanhamento',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Combo Executivo',
        description: 'Prato feito com arroz, feijão, bife e salada',
        price: 22.0,
        category: 'Prato Feito',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sobremesa Pudim',
        description: 'Pudim de leite condensado',
        price: 8.0,
        category: 'Sobremesa',
      },
    }),
  ]);

  console.log(`✅ ${products.length} produtos criados!`);

  // 🔵 SEED 1: BASIC Strategy - PIX (sem desconto de frete)
  console.log('🔵 Criando pedido BASIC Strategy...');

  const basicOrder = await prisma.order.create({
    data: {
      customerId: 123,
      status: 'PENDING',
      subtotal: 56.0, // (25.50 * 2) + 5.00 = 56.00
      deliveryFee: 5.0,
      total: 61.0,
      paymentMethod: 'PIX',
      estimatedDeliveryTime: 45,
      items: {
        create: [
          {
            productId: products[0].id, // Pizza Margherita
            name: products[0].name,
            description: products[0].description,
            quantity: 2,
            price: products[0].price,
          },
          {
            productId: products[1].id, // Refrigerante
            name: products[1].name,
            description: products[1].description,
            quantity: 1,
            price: products[1].price,
          },
        ],
      },
    },
  });

  console.log(
    `✅ BASIC Strategy - Pedido ${basicOrder.id} criado (Total: R$ ${Number(basicOrder.total)})`,
  );

  // 🟡 SEED 2: PREMIUM Strategy - Cartão Débito (frete grátis)
  console.log('🟡 Criando pedido PREMIUM Strategy...');

  const premiumOrder = await prisma.order.create({
    data: {
      customerId: 999, // Cliente VIP
      status: 'CONFIRMED',
      subtotal: 50.0, // 35.00 + 15.00 = 50.00
      deliveryFee: 0.0, // Frete grátis para PREMIUM
      total: 50.0,
      paymentMethod: 'DEBIT_CARD',
      estimatedDeliveryTime: 25,
      items: {
        create: [
          {
            productId: products[2].id, // Hambúrguer Gourmet
            name: products[2].name,
            description: products[2].description,
            quantity: 1,
            price: products[2].price,
          },
          {
            productId: products[3].id, // Batata Rústica
            name: products[3].name,
            description: products[3].description,
            quantity: 1,
            price: products[3].price,
          },
        ],
      },
    },
  });

  console.log(
    `✅ PREMIUM Strategy - Pedido ${premiumOrder.id} criado (Total: R$ ${Number(premiumOrder.total)})`,
  );

  // 🔴 SEED 3: EXPRESS Strategy - Cartão Crédito (entrega rápida com taxa extra)
  console.log('🔴 Criando pedido EXPRESS Strategy...');

  const expressOrder = await prisma.order.create({
    data: {
      customerId: 456,
      status: 'PREPARING',
      subtotal: 30.0, // 22.00 + 8.00 = 30.00
      deliveryFee: 12.0, // Taxa express elevada
      total: 42.0,
      paymentMethod: 'CREDIT_CARD',
      estimatedDeliveryTime: 15, // Entrega super rápida
      items: {
        create: [
          {
            productId: products[4].id, // Combo Executivo
            name: products[4].name,
            description: products[4].description,
            quantity: 1,
            price: products[4].price,
          },
          {
            productId: products[5].id, // Sobremesa Pudim
            name: products[5].name,
            description: products[5].description,
            quantity: 1,
            price: products[5].price,
          },
        ],
      },
    },
  });

  console.log(
    `✅ EXPRESS Strategy - Pedido ${expressOrder.id} criado (Total: R$ ${Number(expressOrder.total)})`,
  );

  console.log('\n🎯 RESUMO DOS TESTES:');
  console.log('🔵 BASIC (PIX): R$ 61,00 - Entrega em 45min');
  console.log(
    '🟡 PREMIUM (Débito): R$ 50,00 - Entrega em 25min (Frete grátis)',
  );
  console.log(
    '🔴 EXPRESS (Crédito): R$ 42,00 - Entrega em 15min (Taxa express)',
  );
  console.log(
    '\n✨ Seeds concluídas! Agora você pode testar as queries GraphQL!',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
