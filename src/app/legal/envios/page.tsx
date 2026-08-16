import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de envíos | Mora & Hueso",
  description:
    "Tiempos, costos y cobertura de envíos de Mora & Hueso en México.",
};

export default function PoliticaEnviosPage() {
  return (
    <LegalPage title="Política de envíos" updated="16 de agosto de 2026">
      <p>
        Esta política describe la cobertura, tiempos estimados y condiciones de
        entrega de los pedidos realizados en Mora & Hueso.
      </p>

      <LegalSection title="1. Cobertura">
        <p>
          Realizamos envíos a todo México, sujeto a cobertura de nuestros
          socios logísticos y a la verificación de la dirección proporcionada al
          comprar.
        </p>
      </LegalSection>

      <LegalSection title="2. Métodos y costos">
        <p>
          En el checkout puedes elegir entre las opciones disponibles (por
          ejemplo, estándar o express). El costo se calcula antes de confirmar el
          pago y forma parte del total del pedido.
        </p>
        <p>
          Los montos vigentes se muestran al momento de la compra; pueden variar
          por destino, peso/volumen o promociones temporales.
        </p>
      </LegalSection>

      <LegalSection title="3. Tiempos estimados">
        <p>
          Los plazos de entrega son estimados y comienzan a contar una vez que el
          pedido es confirmado y preparado:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Estándar: generalmente de 3 a 7 días hábiles.</li>
          <li>Express: generalmente de 1 a 3 días hábiles, según disponibilidad.</li>
        </ul>
        <p>
          Zonas remotas, días festivos, incidentes climáticos o revisiones de
          paquetería pueden extender los tiempos.
        </p>
      </LegalSection>

      <LegalSection title="4. Preparación y seguimiento">
        <p>
          Tras confirmar el pago, preparamos el pedido según disponibilidad de
          inventario. Cuando el paquete se entrega a la paquetería, compartimos un
          número de seguimiento en la confirmación o en tu perfil de cliente.
        </p>
      </LegalSection>

      <LegalSection title="5. Dirección y recepción">
        <p>
          Es tu responsabilidad proporcionar una dirección completa y correcta,
          con referencias útiles. Si el paquete no puede entregarse por datos
          incompletos o ausencia reiterada, pueden aplicarse cargos adicionales
          de reenvío o devolución a origen.
        </p>
      </LegalSection>

      <LegalSection title="6. Pedidos dañados en tránsito">
        <p>
          Si el empaque llega visiblemente dañado, te pedimos reportarlo con
          fotografías a{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>{" "}
          dentro de las 48 horas posteriores a la recepción para ayudarte con
          reposición o alternativa, conforme a nuestra{" "}
          <Link href="/legal/devoluciones" className="text-berry hover:underline">
            política de cambios y devoluciones
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Contacto">
        <p>
          Dudas de envío:{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
