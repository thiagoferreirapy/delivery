import {
  type LucideProps,
  Search,
  Bell,
  User,
  Home,
  ShoppingCart,
  ReceiptText,
  MapPin,
  Camera,
  Minus,
  Plus,
  ChevronLeft,
  Check,
  Truck,
  Star,
  Clock,
  Copy,
} from "lucide-react";

// Wrappers finos sobre lucide-react. As props do call-site sobrescrevem os
// defaults (width, height, className, strokeWidth, fill, etc.), então todos
// os usos existentes continuam funcionando sem edição.
export const IconSearch = (p: LucideProps) => <Search strokeWidth={2} {...p} />;
export const IconBell = (p: LucideProps) => <Bell strokeWidth={2} {...p} />;
export const IconUser = (p: LucideProps) => <User strokeWidth={2} {...p} />;
export const IconHome = (p: LucideProps) => <Home strokeWidth={2} {...p} />;
export const IconCart = (p: LucideProps) => <ShoppingCart strokeWidth={2} {...p} />;
export const IconReceipt = (p: LucideProps) => <ReceiptText strokeWidth={2} {...p} />;
export const IconMapPin = (p: LucideProps) => <MapPin strokeWidth={2} {...p} />;
export const IconCamera = (p: LucideProps) => <Camera strokeWidth={2} {...p} />;
export const IconMinus = (p: LucideProps) => <Minus strokeWidth={2} {...p} />;
export const IconPlus = (p: LucideProps) => <Plus strokeWidth={2} {...p} />;
export const IconChevronLeft = (p: LucideProps) => <ChevronLeft strokeWidth={2} {...p} />;
export const IconCheck = (p: LucideProps) => <Check strokeWidth={2} {...p} />;
export const IconTruck = (p: LucideProps) => <Truck strokeWidth={2} {...p} />;
export const IconStar = (p: LucideProps) => <Star strokeWidth={2} {...p} />;
export const IconClock = (p: LucideProps) => <Clock strokeWidth={2} {...p} />;
export const IconCopy = (p: LucideProps) => <Copy strokeWidth={2} {...p} />;
