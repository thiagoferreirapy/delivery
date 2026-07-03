import type { EmployeeRole } from "@cabana/shared";

export interface NavItem {
  href: string;
  label: string;
  icon: string; // nome do ícone (ver components/icons)
  roles: EmployeeRole[]; // papéis com acesso (ADMIN sempre incluso)
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", roles: ["ADMIN"] },
  { href: "/cozinha", label: "Cozinha", icon: "kitchen", roles: ["ADMIN", "KITCHEN"] },
  { href: "/expedicao", label: "Expedição", icon: "dispatch", roles: ["ADMIN", "DISPATCH"] },
  { href: "/pedidos", label: "Pedidos", icon: "orders", roles: ["ADMIN", "ATTENDANT"] },
  { href: "/pedidos/novo", label: "Novo pedido", icon: "plus", roles: ["ADMIN", "ATTENDANT"] },
  { href: "/categorias", label: "Categorias", icon: "tag", roles: ["ADMIN"] },
  { href: "/produtos", label: "Produtos", icon: "box", roles: ["ADMIN"] },
  { href: "/cupons", label: "Cupons", icon: "ticket", roles: ["ADMIN"] },
  { href: "/funcionarios", label: "Funcionários", icon: "users", roles: ["ADMIN"] },
  { href: "/entregadores", label: "Entregadores", icon: "truck", roles: ["ADMIN"] },
];

export function canAccess(role: EmployeeRole | undefined, roles: EmployeeRole[]): boolean {
  if (!role) return false;
  if (role === "ADMIN") return true;
  return roles.includes(role);
}

export function navForRole(role: EmployeeRole | undefined): NavItem[] {
  return NAV.filter((n) => canAccess(role, n.roles));
}

// Para onde redirecionar cada papel ao entrar
export function homePathForRole(role: EmployeeRole | undefined): string {
  switch (role) {
    case "KITCHEN":
      return "/cozinha";
    case "DISPATCH":
      return "/expedicao";
    case "ATTENDANT":
      return "/pedidos";
    default:
      return "/dashboard";
  }
}

export const ROLE_LABEL: Record<EmployeeRole, string> = {
  ADMIN: "Administrador",
  KITCHEN: "Cozinha",
  DISPATCH: "Expedição",
  ATTENDANT: "Atendente",
};
