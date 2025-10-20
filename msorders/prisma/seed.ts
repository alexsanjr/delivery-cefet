// import { PrismaClient } from '../generated/prisma';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Iniciando seeds para testar Strategy Pattern...');

//   // 🔵 SEED 1: BASIC Strategy
//   // Trigger: Cliente comum + Forma de pagamento diferente de cartão de crédito
//   const basicOrder = await prisma.order.create({
//     data: {
//       customerId: 123,
//       status: 'PENDING',
//       subtotal: 100.0,
//       deliveryFee: 5.0,
//       total: 105.0,
//       paymentMethod: 'PIX',
//       estimatedDeliveryTime: 45,
//       items: {
//         create: [
//           {
//             name: 'Pizza Margherita',
//             description:
//               'Pizza tradicional com molho de tomate, mussarela e manjericão',
//             quantity: 1,
//             price: 45.0,
//           },
//           {
//             name: 'Refrigerante Coca-Cola 350ml',
//             description: 'Refrigerante gelado',
//             quantity: 2,
//             price: 5.0,
//           },
//         ],
//       },
//     },
//   });

//   console.log(
//     `✅ BASIC Strategy - Pedido ${basicOrder.id} criado (Total: R$ ${Number(basicOrder.total)})`,
//   );

//   // 🟡 SEED 2: PREMIUM Strategy
//   const premiumOrder = await prisma.order.create({
//     data: {
//       customerId: 999,
//       status: 'CONFIRMED',
//       subtotal: 100.0,
//       deliveryFee: 0.0,
//       total: 100.0,
//       paymentMethod: 'DEBIT_CARD',
//       estimatedDeliveryTime: 26,
//       items: {
//         create: [
//           {
//             name: 'Hambúrguer Gourmet',
//             description: 'Hambúrguer artesanal com ingredientes premium',
//             quantity: 1,
//             price: 55.0,
//           },
//           {
//             name: 'Batata Rústica',
//             description: 'Porção de batata rústica temperada',
//             quantity: 1,
//             price: 25.0,
//           },
//         ],
//       },
//     },
//   });

//   console.log(
//     `✅ PREMIUM Strategy - Pedido ${premiumOrder.id} criado (Total: R$ ${Number(premiumOrder.total)})`,
//   );

//   // 🔴 SEED 3: EXPRESS Strategy
//   const expressOrder = await prisma.order.create({
//     data: {
//       customerId: 456,
//       status: 'PREPARING',
//       subtotal: 120.0,
//       deliveryFee: 15.0,
//       total: 135.0,
//       paymentMethod: 'CREDIT_CARD',
//       estimatedDeliveryTime: 17,
//       items: {
//         create: [
//           {
//             name: 'Combo Executivo',
//             description: 'Prato feito com arroz, feijão, bife e salada',
//             quantity: 1,
//             price: 35.0,
//           },
//           {
//             name: 'Sobremesa Pudim',
//             description: 'Pudim de leite condensado',
//             quantity: 1,
//             price: 8.0,
//           },
//         ],
//       },
//     },
//   });

//   console.log(
//     `✅ EXPRESS Strategy - Pedido ${expressOrder.id} criado (Total: R$ ${Number(expressOrder.total)})`,
//   );

//   console.log('\n🎯 Seeds criados para testar Strategy Pattern:');
//   console.log(
//     `- BASIC (PIX): Pedido ${basicOrder.id} - R$ ${Number(basicOrder.total)} - ${basicOrder.estimatedDeliveryTime}min`,
//   );
//   console.log(
//     `- PREMIUM (Débito): Pedido ${premiumOrder.id} - R$ ${Number(premiumOrder.total)} - ${premiumOrder.estimatedDeliveryTime}min`,
//   );
//   console.log(
//     `- EXPRESS (Crédito): Pedido ${expressOrder.id} - R$ ${Number(expressOrder.total)} - ${expressOrder.estimatedDeliveryTime}min`,
//   );
//   console.log('\n✅ Seeds concluídos! Teste as mutations GraphQL agora.');
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
