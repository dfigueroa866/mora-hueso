import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
  phone: z
    .string()
    .min(10, "Teléfono inválido")
    .max(15, "Teléfono inválido")
    .regex(/^[0-9+\-\s]+$/, "Solo números y + -"),
});

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const recoverSchema = z.object({
  email: z.string().email("Correo inválido"),
});

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto"),
  phone: z.string().min(10, "Teléfono inválido").max(15),
});

export const addressSchema = z.object({
  label: z.string().min(1).optional(),
  street: z.string().min(5, "Calle requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().min(2, "Estado requerido"),
  postalCode: z.string().min(4, "Código postal inválido"),
  country: z.string().min(2, "País requerido"),
  references: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.enum(["naturales", "galletas", "huesos", "dentales"]),
  stock: z.number().int().min(0),
  sku: z.string().min(3),
  supplier: z.string().min(2),
  packageSize: z.string().min(1),
  dogSize: z.enum(["pequeno", "mediano", "grande", "todos"]),
  ingredients: z.string().min(2),
  nutrition: z.string().min(2),
  image: z.string().url().or(z.string().min(1)),
  lowStockAt: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  rating: z.coerce.number().int().min(1, "Mínimo 1 estrella").max(5, "Máximo 5 estrellas"),
  title: z.string().max(80, "Título demasiado largo").optional().default(""),
  comment: z
    .string()
    .min(10, "Cuéntanos un poco más (mínimo 10 caracteres)")
    .max(1000, "Máximo 1000 caracteres"),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "El carrito está vacío"),
  shippingMethod: z.enum(["standard", "express"]),
  shipStreet: z.string().min(5),
  shipCity: z.string().min(2),
  shipState: z.string().min(2, "Estado requerido"),
  shipPostalCode: z.string().min(4),
  shipCountry: z.string().min(2),
  shipReferences: z.string().optional(),
  billingName: z.string().min(2),
  billingEmail: z.string().email(),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\d{16}$/.test(v), "La tarjeta debe tener 16 dígitos"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Formato MM/AA"),
  cardCvc: z.string().regex(/^\d{3,4}$/, "CVC inválido"),
});
