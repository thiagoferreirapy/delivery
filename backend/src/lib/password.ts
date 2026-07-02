import bcrypt from "bcryptjs";

// bcryptjs é JS puro — evita problemas de build nativo (argon2) no Windows.
// A interface fica isolada aqui; trocar por argon2 depois é só editar este arquivo.
export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);
