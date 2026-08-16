export const LEGAL_SLUGS = [
  "privacidad",
  "terminos",
  "envios",
  "devoluciones",
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_META: Record<
  LegalSlug,
  { title: string; href: string; navLabel: string }
> = {
  privacidad: {
    title: "Política de privacidad",
    href: "/legal/privacidad",
    navLabel: "Política de privacidad",
  },
  terminos: {
    title: "Términos y condiciones",
    href: "/legal/terminos",
    navLabel: "Términos y condiciones",
  },
  envios: {
    title: "Política de envíos",
    href: "/legal/envios",
    navLabel: "Política de envíos",
  },
  devoluciones: {
    title: "Política de cambios y devoluciones",
    href: "/legal/devoluciones",
    navLabel: "Cambios y devoluciones",
  },
};

/** Contenido inicial en Markdown simple (## títulos, - listas). */
export const LEGAL_DEFAULTS: Record<LegalSlug, string> = {
  privacidad: `En Mora & Hueso (“nosotros”) respetamos tu privacidad. Esta política explica qué datos personales tratamos cuando usas nuestra tienda en línea, creas una cuenta o te comunicas con nosotros.

## 1. Responsable del tratamiento

El responsable es Mora & Hueso, con domicilio de contacto en Ciudad de México, México, y correo hola@morahueso.com.

## 2. Datos que recolectamos

Podemos tratar, según el caso:

- Nombre, correo electrónico y teléfono.
- Direcciones de envío y facturación.
- Datos de cuenta (contraseña cifrada) y rol de usuario.
- Información de pedidos, productos adquiridos y preferencias relacionadas con tu compra.
- Reseñas, comentarios y fotografías que decidas publicar sobre productos recibidos.
- Datos técnicos mínimos de navegación necesarios para operar el sitio (por ejemplo, cookies de sesión).

No almacenamos el número completo de tarjeta; solo podemos conservar referencias limitadas del pago (como los últimos dígitos) cuando el flujo de compra lo requiera.

## 3. Finalidades

Usamos tus datos para:

- Procesar pedidos, envíos y atención al cliente.
- Crear y administrar tu cuenta.
- Mostrar reseñas y mejorar el catálogo.
- Cumplir obligaciones legales y prevenir fraude.
- Enviarte comunicaciones relacionadas con tu compra o cuenta, cuando corresponda.

## 4. Base legal y consentimiento

Tratamos datos para ejecutar el contrato de compraventa, cumplir obligaciones legales y, cuando aplique, con base en tu consentimiento (por ejemplo, al publicar una reseña o subir fotos).

## 5. Conservación

Conservamos la información el tiempo necesario para prestar el servicio, atender garantías/devoluciones y cumplir requisitos fiscales o legales. Puedes solicitar la eliminación de tu cuenta sujeto a obligaciones de retención aplicables.

## 6. Transferencias y encargados

Podemos compartir datos con proveedores que nos ayudan a operar (por ejemplo, logística, hosting o herramientas técnicas), únicamente para las finalidades descritas y bajo medidas razonables de confidencialidad.

## 7. Derechos ARCO y contacto

Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos escribiendo a hola@morahueso.com. Responderemos en los plazos razonables aplicables.

## 8. Cambios

Podemos actualizar esta política. La fecha de “última actualización” indica la versión vigente publicada en este sitio.`,

  terminos: `Estos términos regulan el acceso y uso del sitio web de Mora & Hueso, así como la compra de productos a través de nuestra tienda en línea. Al usar el sitio o completar un pedido, aceptas estas condiciones.

## 1. Identidad del vendedor

Mora & Hueso comercializa premios y snacks para perros desde México. Para dudas: hola@morahueso.com.

## 2. Uso del sitio

Debes proporcionar información veraz al registrarte o comprar. No está permitido usar el sitio de forma fraudulenta, interferir con su operación ni vulnerar derechos de terceros. Nos reservamos el derecho de suspender cuentas que incumplan estas reglas.

## 3. Productos e información

Nos esforzamos por mostrar descripciones, ingredientes, precios y disponibilidad actualizados. El stock puede variar; si un producto no puede surtirse tras la compra, te contactaremos para ofrecer alternativa o reembolso del monto correspondiente.

Las imágenes son referenciales. Los premios son para consumo animal conforme a la información del producto; no sustituyen atención veterinaria.

## 4. Precios y pagos

Los precios se muestran en moneda mexicana e incluyen o detallan impuestos según se indique en el checkout. El total a pagar se confirma antes de finalizar la compra e incluye envío cuando aplique.

El pago se procesa al confirmar el pedido. La autorización del cargo es requisito para preparar el envío.

## 5. Cuentas de cliente

Eres responsable de custodiar tus credenciales. Las reseñas solo pueden publicarse por clientes autenticados y deben ser honestas, respetuosas y relacionadas con productos recibidos. Podemos retirar contenido ofensivo, engañoso o que infrinja derechos.

## 6. Propiedad intelectual

Marcas, textos, diseño y demás contenidos de Mora & Hueso tienen derechos. No puedes reproducirlos con fines comerciales sin autorización.

## 7. Limitación de responsabilidad

En la medida permitida por la ley aplicable, Mora & Hueso no responde por daños indirectos derivados del uso del sitio o de demoras logísticas ajenas a nuestro control razonable. Nada en estos términos limita derechos del consumidor que no puedan renunciarse.

## 8. Ley aplicable

Estos términos se interpretan conforme a las leyes de los Estados Unidos Mexicanos. Para controversias, se privilegiará la conciliación; en su defecto, los tribunales competentes en Ciudad de México, salvo disposiciones protectoras del consumidor.

## 9. Contacto

Preguntas sobre estos términos: hola@morahueso.com.`,

  envios: `Esta política describe la cobertura, tiempos estimados y condiciones de entrega de los pedidos realizados en Mora & Hueso.

## 1. Cobertura

Realizamos envíos a todo México, sujeto a cobertura de nuestros socios logísticos y a la verificación de la dirección proporcionada al comprar.

## 2. Métodos y costos

En el checkout puedes elegir entre las opciones disponibles (por ejemplo, estándar o express). El costo se calcula antes de confirmar el pago y forma parte del total del pedido.

Los montos vigentes se muestran al momento de la compra; pueden variar por destino, peso/volumen o promociones temporales.

## 3. Tiempos estimados

Los plazos de entrega son estimados y comienzan a contar una vez que el pedido es confirmado y preparado:

- Estándar: generalmente de 3 a 7 días hábiles.
- Express: generalmente de 1 a 3 días hábiles, según disponibilidad.

Zonas remotas, días festivos, incidentes climáticos o revisiones de paquetería pueden extender los tiempos.

## 4. Preparación y seguimiento

Tras confirmar el pago, preparamos el pedido según disponibilidad de inventario. Cuando el paquete se entrega a la paquetería, compartimos un número de seguimiento en la confirmación o en tu perfil de cliente.

## 5. Dirección y recepción

Es tu responsabilidad proporcionar una dirección completa y correcta, con referencias útiles. Si el paquete no puede entregarse por datos incompletos o ausencia reiterada, pueden aplicarse cargos adicionales de reenvío o devolución a origen.

## 6. Pedidos dañados en tránsito

Si el empaque llega visiblemente dañado, te pedimos reportarlo con fotografías a hola@morahueso.com dentro de las 48 horas posteriores a la recepción para ayudarte con reposición o alternativa, conforme a nuestra política de cambios y devoluciones.

## 7. Contacto

Dudas de envío: hola@morahueso.com.`,

  devoluciones: `Queremos que tu experiencia con Mora & Hueso sea clara y justa. Esta política explica cuándo procede un cambio, devolución o reembolso de productos comprados en nuestra tienda en línea.

## 1. Productos alimenticios

Por higiene y seguridad, los premios y snacks abiertos o parcialmente consumidos no admiten devolución, salvo que presenten defecto de calidad demostrable o error de surtido atribuible a Mora & Hueso.

## 2. Plazo para reportar

Tienes hasta 7 días naturales después de recibir el pedido para reportar:

- Producto incorrecto o incompleto.
- Empaque dañado que afecte el producto.
- Defecto evidente de calidad al momento de abrir el paquete.

Escríbenos a hola@morahueso.com con número de pedido, descripción y fotografías.

## 3. Cambios

Si enviamos un producto distinto al comprado, gestionaremos el envío correcto sin costo adicional, sujeto a existencia. Si prefieres, puedes solicitar reembolso del artículo afectado.

## 4. Devoluciones elegibles

En casos aprobados (error nuestro, daño en tránsito o defecto de calidad), podremos:

- Reponer el producto.
- Emitir un reembolso parcial o total del artículo.
- Ofrecer una nota de crédito para una compra futura.

No se reembolsan costos de envío originales salvo que el problema sea responsabilidad de Mora & Hueso.

## 5. Productos no retornables

Salvo disposición legal en contrario, no aplican devoluciones por:

- Cambio de opinión una vez abierto el producto.
- Almacenamiento inadecuado después de la entrega.
- Retrasos logísticos ajenos una vez entregado a paquetería, sin daño.

## 6. Reembolsos

Los reembolsos aprobados se procesan al mismo método de pago utilizado, en los plazos que permita el emisor de la tarjeta o plataforma. Te confirmaremos por correo cuando el proceso quede iniciado.

## 7. Derechos del consumidor

Esta política no limita los derechos que te correspondan conforme a la legislación mexicana de protección al consumidor.

## 8. Contacto

Atención de cambios y devoluciones: hola@morahueso.com.`,
};
