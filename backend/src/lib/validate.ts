import type { ZodSchema } from "zod";
import { badRequest } from "./errors.js";

// Valida e retorna dados tipados; lança AppError 400 com issues do zod.
export function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest("Dados inválidos", result.error.flatten());
  }
  return result.data;
}
