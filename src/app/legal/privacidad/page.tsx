import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad | Mora & Hueso",
  description:
    "Cómo Mora & Hueso recolecta, usa y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="16 de agosto de 2026">
      <p>
        En Mora & Hueso (“nosotros”) respetamos tu privacidad. Esta política
        explica qué datos personales tratamos cuando usas nuestra tienda en
        línea, creas una cuenta o te comunicas con nosotros.
      </p>

      <LegalSection title="1. Responsable del tratamiento">
        <p>
          El responsable es Mora & Hueso, con domicilio de contacto en Ciudad de
          México, México, y correo{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Datos que recolectamos">
        <p>Podemos tratar, según el caso:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nombre, correo electrónico y teléfono.</li>
          <li>Direcciones de envío y facturación.</li>
          <li>Datos de cuenta (contraseña cifrada) y rol de usuario.</li>
          <li>
            Información de pedidos, productos adquiridos y preferencias
            relacionadas con tu compra.
          </li>
          <li>
            Reseñas, comentarios y fotografías que decidas publicar sobre
            productos recibidos.
          </li>
          <li>
            Datos técnicos mínimos de navegación necesarios para operar el sitio
            (por ejemplo, cookies de sesión).
          </li>
        </ul>
        <p>
          No almacenamos el número completo de tarjeta; solo podemos conservar
          referencias limitadas del pago (como los últimos dígitos) cuando el
          flujo de compra lo requiera.
        </p>
      </LegalSection>

      <LegalSection title="3. Finalidades">
        <p>Usamos tus datos para:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Procesar pedidos, envíos y atención al cliente.</li>
          <li>Crear y administrar tu cuenta.</li>
          <li>Mostrar reseñas y mejorar el catálogo.</li>
          <li>Cumplir obligaciones legales y prevenir fraude.</li>
          <li>
            Enviarte comunicaciones relacionadas con tu compra o cuenta, cuando
            corresponda.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Base legal y consentimiento">
        <p>
          Tratamos datos para ejecutar el contrato de compraventa, cumplir
          obligaciones legales y, cuando aplique, con base en tu consentimiento
          (por ejemplo, al publicar una reseña o subir fotos).
        </p>
      </LegalSection>

      <LegalSection title="5. Conservación">
        <p>
          Conservamos la información el tiempo necesario para prestar el
          servicio, atender garantías/devoluciones y cumplir requisitos fiscales
          o legales. Puedes solicitar la eliminación de tu cuenta sujeto a
          obligaciones de retención aplicables.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferencias y encargados">
        <p>
          Podemos compartir datos con proveedores que nos ayudan a operar (por
          ejemplo, logística, hosting o herramientas técnicas), únicamente para
          las finalidades descritas y bajo medidas razonables de confidencialidad.
        </p>
      </LegalSection>

      <LegalSection title="7. Derechos ARCO y contacto">
        <p>
          Puedes solicitar acceso, rectificación, cancelación u oposición al
          tratamiento de tus datos escribiendo a{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>
          . Responderemos en los plazos razonables aplicables.
        </p>
      </LegalSection>

      <LegalSection title="8. Cambios">
        <p>
          Podemos actualizar esta política. La fecha de “última actualización”
          indica la versión vigente publicada en este sitio.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
