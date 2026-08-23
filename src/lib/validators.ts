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
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.number({ invalid_type_error: "El precio debe ser un número" }).positive("El precio debe ser mayor a 0"),
  category: z.enum(["naturales", "galletas", "huesos", "dentales"], {
    errorMap: () => ({ message: "Elige una categoría válida" }),
  }),
  stock: z
    .number({ invalid_type_error: "El stock debe ser un número" })
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  supplier: z.string().min(2, "El proveedor debe tener al menos 2 caracteres"),
  packageSize: z.string().min(1, "Indica el empaque"),
  ingredients: z
    .string()
    .min(2, "Los ingredientes deben tener al menos 2 caracteres"),
  nutrition: z.string().min(2, "Indica la información nutricional"),
  image: z.string().min(1, "Indica la URL de la imagen"),
  lowStockAt: z
    .number({ invalid_type_error: "El umbral de alerta debe ser un número" })
    .int("El umbral de alerta debe ser un número entero")
    .min(0, "El umbral de alerta no puede ser negativo")
    .optional(),
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
});
