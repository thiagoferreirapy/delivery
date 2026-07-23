// Cria um combo e uma pizza de verdade no banco, precifica via priceOrder e
// confere os números. Limpa tudo no fim. Roda com:
//   npx tsx scripts/check-combos.ts
import { prisma } from "../src/lib/prisma.js";
import { priceOrder } from "../src/services/pricing.js";

let pass = 0;
let fail = 0;
function check(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${ok ? "" : `\n       esperado ${JSON.stringify(want)}, veio ${JSON.stringify(got)}`}`);
}
async function expectError(label: string, fn: () => Promise<unknown>, snippet: string) {
  try {
    await fn();
    fail++;
    console.log(`FAIL ${label}\n       esperava erro contendo "${snippet}", mas passou`);
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const ok = msg.toLowerCase().includes(snippet.toLowerCase());
    if (ok) pass++;
    else fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${label}${ok ? "" : `\n       esperava "${snippet}", veio "${msg}"`}`);
  }
}

const cat = await prisma.category.upsert({
  where: { slug: "teste-combos" },
  update: {},
  create: { name: "Teste Combos", slug: "teste-combos", sortOrder: 999 },
});

// Refrigerantes como produtos REAIS do catálogo (é o ponto do linkedProductId)
const coca = await prisma.product.create({
  data: { categoryId: cat.id, name: "Coca-Cola 350ml", price: 6 },
});
const guarana = await prisma.product.create({
  data: { categoryId: cat.id, name: "Guaraná 350ml", price: 5 },
});

// ===== COMBO: hambúrguer + refri (escolha obrigatória de 1) =====
const combo = await prisma.product.create({
  data: {
    categoryId: cat.id,
    name: "Combo Burger + Refri",
    price: 25,
    optionGroups: {
      create: [
        {
          name: "Escolha seu refrigerante",
          type: "SINGLE",
          kind: "ADD",
          minSelect: 1, // <- obrigatório: o que maxExtras nunca soube fazer
          maxSelect: 1,
          pricingRule: "SUM",
          sortOrder: 0,
          options: {
            create: [
              { name: "Coca-Cola 350ml", priceDelta: 0, linkedProductId: coca.id, sortOrder: 0 },
              { name: "Guaraná 350ml", priceDelta: 0, linkedProductId: guarana.id, sortOrder: 1 },
              { name: "Coca Zero 350ml", priceDelta: 1.5, sortOrder: 2 },
            ],
          },
        },
      ],
    },
  },
  include: { optionGroups: { include: { options: true } } },
});
const refriGroup = combo.optionGroups[0];
const optCoca = refriGroup.options.find((o) => o.name === "Coca-Cola 350ml")!;
const optZero = refriGroup.options.find((o) => o.name === "Coca Zero 350ml")!;

const q1 = await priceOrder({
  paymentMethod: "CASH",
  items: [{ productId: combo.id, quantity: 1, selections: [{ id: optCoca.id }] }],
  couponCode: null,
});
check("combo com Coca (delta 0) = 25", q1.subtotal, 25);

const q2 = await priceOrder({
  paymentMethod: "CASH",
  items: [{ productId: combo.id, quantity: 2, selections: [{ id: optZero.id }] }],
  couponCode: null,
});
check("combo x2 com Coca Zero (+1.50) = 53", q2.subtotal, 53);

const snap = JSON.parse(q1.items[0].selectionsJson!);
check("snapshot guarda o grupo", snap[0].groupName, "Escolha seu refrigerante");
check("snapshot guarda o produto vinculado", snap[0].options[0].linkedProductId, coca.id);

await expectError(
  "combo sem escolher refri é rejeitado",
  () => priceOrder({ paymentMethod: "CASH", items: [{ productId: combo.id, quantity: 1 }], couponCode: null }),
  "Escolha uma opção"
);
// maxSelect=1 barra antes da guarda de SINGLE — a mensagem de máximo é a esperada aqui
await expectError(
  "combo com 2 refris é rejeitado",
  () =>
    priceOrder({
      paymentMethod: "CASH",
      items: [{ productId: combo.id, quantity: 1, selections: [{ id: optCoca.id }, { id: optZero.id }] }],
      couponCode: null,
    }),
  "Máximo de 1"
);

// A guarda de SINGLE só é alcançada quando maxSelect é nulo — cobre o caso de um
// grupo gravado direto no banco, sem passar pelo zod.
await prisma.optionGroup.update({ where: { id: refriGroup.id }, data: { maxSelect: null } });
await expectError(
  "SINGLE sem maxSelect ainda rejeita 2 escolhas",
  () =>
    priceOrder({
      paymentMethod: "CASH",
      items: [{ productId: combo.id, quantity: 1, selections: [{ id: optCoca.id }, { id: optZero.id }] }],
      couponCode: null,
    }),
  "apenas uma escolha"
);
await prisma.optionGroup.update({ where: { id: refriGroup.id }, data: { maxSelect: 1 } });

// ===== PIZZA: meio a meio, cobra o sabor mais caro =====
const pizza = await prisma.product.create({
  data: {
    categoryId: cat.id,
    name: "Pizza Grande",
    price: 0, // o preço vem inteiro dos sabores
    optionGroups: {
      create: [
        {
          name: "Sabores (até 2)",
          type: "MULTI",
          kind: "ADD",
          minSelect: 1,
          maxSelect: 2,
          pricingRule: "MAX", // <- meio a meio: vale o mais caro
          sortOrder: 0,
          options: {
            create: [
              { name: "Mussarela", priceDelta: 45, sortOrder: 0 },
              { name: "Calabresa", priceDelta: 50, sortOrder: 1 },
              { name: "Portuguesa", priceDelta: 58, sortOrder: 2 },
            ],
          },
        },
        {
          name: "Borda",
          type: "SINGLE",
          kind: "ADD",
          minSelect: 0,
          maxSelect: 1,
          pricingRule: "SUM",
          sortOrder: 1,
          options: { create: [{ name: "Catupiry", priceDelta: 8, sortOrder: 0 }] },
        },
      ],
    },
  },
  include: { optionGroups: { include: { options: true } } },
});
const sabores = pizza.optionGroups.find((g) => g.name.startsWith("Sabores"))!;
const mussarela = sabores.options.find((o) => o.name === "Mussarela")!;
const portuguesa = sabores.options.find((o) => o.name === "Portuguesa")!;
const borda = pizza.optionGroups.find((g) => g.name === "Borda")!.options[0];

const p1 = await priceOrder({
  paymentMethod: "CASH",
  items: [{ productId: pizza.id, quantity: 1, selections: [{ id: mussarela.id }] }],
  couponCode: null,
});
check("pizza inteira mussarela = 45", p1.subtotal, 45);

const p2 = await priceOrder({
  paymentMethod: "CASH",
  items: [{ productId: pizza.id, quantity: 1, selections: [{ id: mussarela.id }, { id: portuguesa.id }] }],
  couponCode: null,
});
check("meio mussarela(45)/meio portuguesa(58) = 58 (mais caro)", p2.subtotal, 58);

const p3 = await priceOrder({
  paymentMethod: "CASH",
  items: [
    { productId: pizza.id, quantity: 1, selections: [{ id: mussarela.id }, { id: portuguesa.id }, { id: borda.id }] },
  ],
  couponCode: null,
});
check("meio a meio + borda catupiry = 66", p3.subtotal, 66);

await expectError(
  "3 sabores é rejeitado (maxSelect 2)",
  () =>
    priceOrder({
      paymentMethod: "CASH",
      items: [
        {
          productId: pizza.id,
          quantity: 1,
          selections: sabores.options.map((o) => ({ id: o.id })),
        },
      ],
      couponCode: null,
    }),
  "Máximo de 2"
);

// ===== AVG: média dos sabores =====
await prisma.optionGroup.update({ where: { id: sabores.id }, data: { pricingRule: "AVG" } });
const p4 = await priceOrder({
  paymentMethod: "CASH",
  items: [{ productId: pizza.id, quantity: 1, selections: [{ id: mussarela.id }, { id: portuguesa.id }] }],
  couponCode: null,
});
check("regra AVG: media de 45 e 58 = 51.50", p4.subtotal, 51.5);

// ===== Opção de outro produto não cola =====
await expectError(
  "opção de outro produto é rejeitada",
  () =>
    priceOrder({
      paymentMethod: "CASH",
      items: [{ productId: pizza.id, quantity: 1, selections: [{ id: optCoca.id }] }],
      couponCode: null,
    }),
  "Opção inválida"
);

// ===== Promoção + PIX continuam valendo sobre o combo =====
await prisma.product.update({
  where: { id: combo.id },
  data: { promoActive: true, promoPercent: 10, pixPromoActive: true, pixPromoPercent: 5 },
});
const q3 = await priceOrder({
  paymentMethod: "PIX",
  items: [{ productId: combo.id, quantity: 1, selections: [{ id: optZero.id }] }],
  couponCode: null,
});
// 25 -10% = 22.50 ; -5% PIX = 21.38 ; + 1.50 do refri = 22.88
check("combo com promo 10% + PIX 5% + refri 1.50 = 22.88", q3.subtotal, 22.88);

// limpeza
await prisma.product.deleteMany({ where: { categoryId: cat.id } });
await prisma.category.delete({ where: { id: cat.id } });

console.log(`\n${pass} passaram, ${fail} falharam`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
