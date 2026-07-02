# 🍔 Cabana Lanches — Sistema de Delivery Completo

Monorepo (pnpm workspaces) com **1 backend** e **3 aplicações front-end**, cada
sistema em sua própria pasta.

```
delivery/
├── backend/            # API única — Express + Prisma + SQLite + socket.io   ✅ pronto
├── shared/             # Tipos, enums, zod DTOs e máquina de estados (client<->server) ✅ pronto
├── front-cliente/      # App do cliente (Next.js, mobile-first, embrulhado com Capacitor)  ⏳ próximo
├── front-admin/        # Painel do restaurante (Next.js + RBAC)                             ⏳ próximo
└── front-entregador/   # App do entregador (Next.js, mobile-first)                          ⏳ próximo
```

> Projeto criado **fora do OneDrive** (`C:\dev\delivery`) de propósito: o sync do
> OneDrive corrompe `node_modules`/`.next` durante instalações e builds.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express + TypeScript |
| ORM/DB | Prisma + SQLite (migra p/ Postgres sem refactor) |
| Auth | JWT (access+refresh) em cookies httpOnly, senha com bcrypt |
| Validação | zod (backend e forms) |
| Realtime | socket.io (status de pedido, cozinha, localização do entregador) |
| Uploads | `StorageService` (disco local; adapter Cloudflare R2 stubbado) |
| Fronts | Next.js (App Router) + TypeScript + Tailwind |

## Pré-requisitos

- Node.js ≥ 20 e pnpm (`npm i -g pnpm`)

## Como rodar o backend

```bash
pnpm install                     # na raiz — instala todo o workspace
cd backend
cp .env.example .env             # (o .env já vem preenchido p/ dev)
pnpm db:migrate                  # cria o SQLite e roda o seed
pnpm dev                         # sobe API + WebSocket em http://localhost:4000
```

Reset do banco: `pnpm --filter @cabana/backend db:reset`.

### Contas do seed

| Papel | Login | Senha |
|---|---|---|
| Admin | `admin@cabana.com` | `admin123` |
| Cozinha (KITCHEN) | `cozinha@cabana.com` | `cozinha123` |
| Expedição (DISPATCH) | `expedicao@cabana.com` | `expedicao123` |
| Atendente (ATTENDANT) | `atendente@cabana.com` | `atendente123` |
| Entregador | `11999990001` (telefone) | `entregador123` |
| Cliente | `cliente@cabana.com` | `cliente123` |

No login, envie `scope`: `CUSTOMER`, `EMPLOYEE` ou `COURIER`.

## Endpoints principais

`/auth` · `/me` (+`/addresses`) · `/categories` · `/products` · `/orders`
(+`/status`, `/confirm-receipt`, `/rating`) · `/payments/pix` · `/kitchen/orders`
· `/dispatch/orders` (+`/assign`, `/couriers`) · `/courier/deliveries`
(+`/location`) · `/employees` · `/couriers` · `/admin/stats` · `/uploads`

Salas WebSocket: `order:{id}`, `user:{id}`, `kitchen`, `dispatch`, `courier:{id}`.

## Máquina de estados do pedido

```
PENDING → CONFIRMED → PREPARING → READY → DISPATCHED → PICKED_UP
        → IN_ROUTE → DELIVERED → CONFIRMED_BY_CUSTOMER
(qualquer estado pré-DELIVERED → CANCELLED por ADMIN)
```

Transições validadas em `shared/src/order-state-machine.ts` — reusadas pelo
backend (execução) e pelos fronts (UI). Transição inválida → HTTP 409; ator sem
permissão → 403.

## Integrações (isoladas atrás de interface, com mock funcional)

`backend/src/integrations/` — `PixService`, `MapService`, `PushService`,
`StorageService`, `CardPaymentService`. Todas rodam em modo mock por padrão;
os adapters reais (Asaas/Mercado Pago, Google Maps, FCM/Web Push, Cloudflare R2)
já têm a assinatura pronta e leem as chaves do `.env`. Veja `backend/.env.example`.

## Status

- [x] Monorepo + pacote `shared`
- [x] Backend completo (auth 3 escopos, RBAC, catálogo, pedidos, pagamentos PIX,
      cozinha, expedição, entregador+geoloc, uploads, dashboard, socket.io, seed)
- [ ] `front-cliente` (cardápio → carrinho → checkout → tracking → avaliação) + Capacitor
- [ ] `front-admin` (cozinha kanban, expedição, CRUDs, dashboard)
- [ ] `front-entregador` (entregas, rota, foto, confirmação de pagamento)
