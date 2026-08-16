import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de cambios y devoluciones | Mora & Hueso",
  description:
    "Condiciones para cambios, devoluciones y reembolsos en Mora & Hueso.",
};

export default function DevolucionesPage() {
  return (
    <LegalPage
      title="Política de cambios y devoluciones"
      updated="16 de agosto de 2026"
    >
      <p>
        Queremos que tu experiencia con Mora & Hueso sea clara y justa. Esta
        política explica cuándo procede un cambio, devolución o reembolso de
        productos comprados en nuestra tienda en línea.
      </p>

      <LegalSection title="1. Productos alimenticios">
        <p>
          Por higiene y seguridad, los premios y snacks abiertos o parcialmente
          consumidos no admiten devolución, salvo que presenten defecto de
          calidad demostrable o error de surtido atribuible a Mora & Hueso.
        </p>
      </LegalSection>

      <LegalSection title="2. Plazo para reportar">
        <p>
          Tienes hasta 7 días naturales después de recibir el pedido para
          reportar:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Producto incorrecto o incompleto.</li>
          <li>Empaque dañado que afecte el producto.</li>
          <li>Defecto evidente de calidad al momento de abrir el paquete.</li>
        </ul>
        <p>
          Escríbenos a{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>{" "}
          con número de pedido, descripción y fotografías.
        </p>
      </LegalSection>

      <LegalSection title="3. Cambios">
        <p>
          Si enviamos un producto distinto al comprado, gestionaremos el envío
          correcto sin costo adicional, sujeto a existencia. Si prefieres, puedes
          solicitar reembolso del artículo afectado.
        </p>
      </LegalSection>

      <LegalSection title="4. Devoluciones elegibles">
        <p>
          En casos aprobados (error nuestro, daño en tránsito o defecto de
          calidad), podremos:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Reponer el producto.</li>
          <li>Emitir un reembolso parcial o total del artículo.</li>
          <li>Ofrecer una nota de crédito para una compra futura.</li>
        </ul>
        <p>
          No se reembolsan costos de envío originales salvo que el problema sea
          responsabilidad de Mora & Hueso.
        </p>
      </LegalSection>

      <LegalSection title="5. Productos no retornables">
        <p>Salvo disposición legal en contrario, no aplican devoluciones por:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Cambio de opinión una vez abierto el producto.</li>
          <li>Almacenamiento inadecuado después de la entrega.</li>
          <li>Retrasos logísticos ajenos una vez entregado a paquetería, sin daño.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Reembolsos">
        <p>
          Los reembolsos aprobados se procesan al mismo método de pago utilizado,
          en los plazos que permita el emisor de la tarjeta o plataforma. Te
          confirmaremos por correo cuando el proceso quede iniciado.
        </p>
      </LegalSection>

      <LegalSection title="7. Derechos del consumidor">
        <p>
          Esta política no limita los derechos que te correspondan conforme a la
          legislación mexicana de protección al consumidor.
        </p>
      </LegalSection>

      <LegalSection title="8. Contacto">
        <p>
          Atención de cambios y devoluciones:{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
