import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hash = (s: string) => bcrypt.hash(s, 10);
const img = (seed: string) => `https://picsum.photos/seed/cabana-${seed}/600/600`;

async function main() {
  console.log("🌱 Semeando Cabana Lanches...");

  // ===== Funcionários (RBAC) =====
  const [adminPw, kitchenPw, dispatchPw, attendantPw] = await Promise.all([
    hash("admin123"),
    hash("cozinha123"),
    hash("expedicao123"),
    hash("atendente123"),
  ]);

  await prisma.employee.upsert({
    where: { email: "admin@cabana.com" },
    update: {},
    create: { name: "Administrador", email: "admin@cabana.com", role: "ADMIN", password: adminPw },
  });
  await prisma.employee.upsert({
    where: { email: "cozinha@cabana.com" },
    update: {},
    create: { name: "Chef Cozinha", email: "cozinha@cabana.com", role: "KITCHEN", password: kitchenPw },
  });
  await prisma.employee.upsert({
    where: { email: "expedicao@cabana.com" },
    update: {},
    create: { name: "Expedição", email: "expedicao@cabana.com", role: "DISPATCH", password: dispatchPw },
  });
  await prisma.employee.upsert({
    where: { email: "atendente@cabana.com" },
    update: {},
    create: { name: "Atendente Balcão", email: "atendente@cabana.com", role: "ATTENDANT", password: attendantPw },
  });

  // ===== Entregadores =====
  const [courierPw1, courierPw2] = await Promise.all([hash("entregador123"), hash("entregador123")]);
  await prisma.courier.upsert({
    where: { phone: "11999990001" },
    update: {},
    create: { name: "Carlos Entregas", phone: "11999990001", password: courierPw1, currentLat: -23.561, currentLng: -46.656 },
  });
  await prisma.courier.upsert({
    where: { phone: "11999990002" },
    update: {},
    create: { name: "Marina Moto", phone: "11999990002", password: courierPw2, currentLat: -23.55, currentLng: -46.64 },
  });

  // ===== Cliente de teste =====
  const clientPw = await hash("cliente123");
  const client = await prisma.user.upsert({
    where: { email: "cliente@cabana.com" },
    update: {},
    create: {
      name: "Cliente Teste",
      email: "cliente@cabana.com",
      phone: "11988887777",
      password: clientPw,
    },
  });
  const hasAddress = await prisma.address.findFirst({ where: { userId: client.id } });
  if (!hasAddress) {
    await prisma.address.create({
      data: {
        userId: client.id,
        label: "Casa",
        cep: "01310-100",
        street: "Av. Paulista",
        number: "1000",
        complement: "Apto 52",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        lat: -23.5646,
        lng: -46.6522,
        isDefault: true,
      },
    });
  }

  // ===== Categorias =====
  const categories = [
    { name: "Almoço", slug: "almoco", sortOrder: 1 },
    { name: "Pães", slug: "paes", sortOrder: 2 },
    { name: "Doces", slug: "doces", sortOrder: 3 },
    { name: "Salgados", slug: "salgados", sortOrder: 4 },
    { name: "Café", slug: "cafe", sortOrder: 5 },
  ];
  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, imageUrl: img(c.slug) },
      create: { ...c, imageUrl: img(c.slug) },
    });
    catMap[c.slug] = cat.id;
  }

  // ===== Produtos (~15, 2 em promoção) =====
  const products = [
    { slug: "prato-feito", cat: "almoco", name: "Prato Feito da Cabana", price: 28.9, description: "Arroz, feijão, bife acebolado, salada e fritas.", ingredients: "Arroz, feijão, bife, cebola, alface, tomate, batata", prepNotes: "Servido quente." },
    { slug: "feijoada", cat: "almoco", name: "Feijoada Individual", price: 34.9, description: "Feijoada completa com acompanhamentos.", ingredients: "Feijão preto, carnes, arroz, couve, farofa, laranja", prepNotes: "Cozimento lento 4h." },
    { slug: "strogonoff", cat: "almoco", name: "Strogonoff de Frango", price: 26.5, description: "Cremoso, com arroz e batata palha.", ingredients: "Frango, creme de leite, molho, arroz, batata palha" },
    { slug: "x-cabana", cat: "paes", name: "X-Cabana Especial", price: 24.9, description: "Hambúrguer artesanal 180g, cheddar, bacon e molho da casa.", ingredients: "Pão brioche, blend 180g, cheddar, bacon, alface, tomate", prepNotes: "Ponto da carne ao gosto.", promoActive: true, promoPercent: 20,
      maxExtras: 5, maxRemovable: null,
      extras: [{ name: "Bacon extra", price: 4 }, { name: "Cheddar extra", price: 3 }, { name: "Ovo", price: 2.5 }, { name: "Hambúrguer extra 180g", price: 8 }],
      removables: [{ name: "Alface" }, { name: "Tomate" }, { name: "Cebola" }, { name: "Molho da casa" }] },
    { slug: "x-salada", cat: "paes", name: "X-Salada", price: 19.9, description: "Clássico com salada fresca.", ingredients: "Pão, hambúrguer, queijo, alface, tomate",
      maxExtras: null, maxRemovable: 3,
      extras: [{ name: "Queijo extra", price: 3 }, { name: "Bacon", price: 4 }],
      removables: [{ name: "Alface" }, { name: "Tomate" }, { name: "Cebola" }] },
    { slug: "hot-dog", cat: "paes", name: "Hot Dog Prensado", price: 16.5, description: "Salsicha, purê, batata palha e molhos.", ingredients: "Pão, salsicha, purê, milho, batata palha",
      maxExtras: 3, maxRemovable: null,
      extras: [{ name: "Cheddar", price: 2.5 }, { name: "Batata palha extra", price: 1.5 }, { name: "Salsicha extra", price: 3 }],
      removables: [{ name: "Milho" }, { name: "Purê" }, { name: "Batata palha" }] },
    { slug: "brigadeiro", cat: "doces", name: "Brigadeiro Gourmet (6un)", price: 18.0, description: "Caixa com 6 brigadeiros gourmet.", ingredients: "Chocolate belga, leite condensado, granulado" },
    { slug: "pudim", cat: "doces", name: "Pudim de Leite", price: 12.9, description: "Fatia generosa de pudim caseiro.", ingredients: "Leite condensado, ovos, açúcar" },
    { slug: "bolo-cenoura", cat: "doces", name: "Bolo de Cenoura c/ Chocolate", price: 11.5, description: "Fatia com cobertura de chocolate.", ingredients: "Cenoura, farinha, ovos, chocolate", promoActive: true, promoPercent: 50 },
    { slug: "coxinha", cat: "salgados", name: "Coxinha de Frango", price: 8.5, description: "Massa crocante, recheio cremoso.", ingredients: "Frango, massa, temperos" },
    { slug: "pao-de-queijo", cat: "salgados", name: "Pão de Queijo (6un)", price: 14.0, description: "Quentinho e queijoso.", ingredients: "Polvilho, queijo, ovos" },
    { slug: "empada", cat: "salgados", name: "Empada de Palmito", price: 9.5, description: "Massa amanteigada.", ingredients: "Palmito, massa, azeitona" },
    { slug: "cafe-expresso", cat: "cafe", name: "Café Expresso", price: 6.0, description: "Espresso encorpado.", ingredients: "Café 100% arábica" },
    { slug: "cappuccino", cat: "cafe", name: "Cappuccino Cremoso", price: 10.5, description: "Café, leite vaporizado e canela.", ingredients: "Café, leite, canela, chocolate" },
    { slug: "suco-laranja", cat: "cafe", name: "Suco de Laranja Natural 400ml", price: 9.9, description: "Fruta espremida na hora.", ingredients: "Laranja" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    const extras = ((p as any).extras ?? []) as { name: string; price: number }[];
    const removables = ((p as any).removables ?? []) as { name: string }[];
    const data: any = {
      categoryId: catMap[p.cat]!,
      name: p.name,
      description: p.description ?? null,
      ingredients: p.ingredients ?? null,
      prepNotes: (p as any).prepNotes ?? null,
      price: p.price,
      imageUrl: img(p.slug),
      promoActive: (p as any).promoActive ?? false,
      promoPercent: (p as any).promoPercent ?? null,
      maxExtras: (p as any).maxExtras ?? null,
      maxRemovable: (p as any).maxRemovable ?? null,
    };
    const extrasCreate = extras.map((e, i) => ({ name: e.name, price: e.price, sortOrder: i }));
    const removablesCreate = removables.map((r, i) => ({ name: r.name, sortOrder: i }));
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...data,
          extras: { deleteMany: {}, create: extrasCreate },
          removables: { deleteMany: {}, create: removablesCreate },
        },
      });
    } else {
      await prisma.product.create({
        data: { ...data, extras: { create: extrasCreate }, removables: { create: removablesCreate } },
      });
    }
  }

  console.log("✅ Seed concluído.");
  console.log("   Admin:      admin@cabana.com / admin123");
  console.log("   Cozinha:    cozinha@cabana.com / cozinha123");
  console.log("   Expedição:  expedicao@cabana.com / expedicao123");
  console.log("   Atendente:  atendente@cabana.com / atendente123");
  console.log("   Entregador: 11999990001 / entregador123  (e 11999990002)");
  console.log("   Cliente:    cliente@cabana.com / cliente123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
