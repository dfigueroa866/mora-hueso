import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Términos y condiciones | Mora & Hueso",
  description:
    "Condiciones de uso y compra en la tienda en línea de Mora & Hueso.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="16 de agosto de 2026">
      <p>
        Estos términos regulan el acceso y uso del sitio web de Mora & Hueso, así
        como la compra de productos a través de nuestra tienda en línea. Al usar
        el sitio o completar un pedido, aceptas estas condiciones.
      </p>

      <LegalSection title="1. Identidad del vendedor">
        <p>
          Mora & Hueso comercializa premios y snacks para perros desde México.
          Para dudas:{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Uso del sitio">
        <p>
          Debes proporcionar información veraz al registrarte o comprar. No está
          permitido usar el sitio de forma fraudulenta, interferir con su
          operación ni vulnerar derechos de terceros. Nos reservamos el derecho
          de suspender cuentas que incumplan estas reglas.
        </p>
      </LegalSection>

      <LegalSection title="3. Productos e información">
        <p>
          Nos esforzamos por mostrar descripciones, ingredientes, precios y
          disponibilidad actualizados. El stock puede variar; si un producto no
          puede surtirse tras la compra, te contactaremos para ofrecer
          alternativa o reembolso del monto correspondiente.
        </p>
        <p>
          Las imágenes son referenciales. Los premios son para consumo animal
          conforme a la información del producto; no sustituyen atención
          veterinaria.
        </p>
      </LegalSection>

      <LegalSection title="4. Precios y pagos">
        <p>
          Los precios se muestran en moneda mexicana e incluyen o detallan
          impuestos según se indique en el checkout. El total a pagar se confirma
          antes de finalizar la compra e incluye envío cuando aplique.
        </p>
        <p>
          El pago se procesa al confirmar el pedido. La autorización del cargo
          es requisito para preparar el envío.
        </p>
      </LegalSection>

      <LegalSection title="5. Cuentas de cliente">
        <p>
          Eres responsable de custodiar tus credenciales. Las reseñas solo pueden
          publicarse por clientes autenticados y deben ser honestas, respetuosas
          y relacionadas con productos recibidos. Podemos retirar contenido
          ofensivo, engañoso o que infrinja derechos.
        </p>
      </LegalSection>

      <LegalSection title="6. Propiedad intelectual">
        <p>
          Marcas, textos, diseño y demás contenidos de Mora & Hueso estánidos
          derechos. No puedes reproducirlos con fines comerciales sin
          autorización.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitación de responsabilidad">
        <p>
          En la medida permitida por la ley aplicable, Mora & Hueso no responde
          por daños indirectos derivados del uso del sitio o de demoras logísticas
          ajenas a nuestro control razonable. Nada en estos términos limita
          derechos del consumidor que no puedan renunciarse.
        </p>
      </LegalSection>

      <LegalSection title="8. Ley aplicable">
        <p>
          Estos términos se interpretan conforme a las leyes de los Estados
          Unidos Mexicanos. Para controversias, se privilegiará la conciliación;
          en su defecto, los tribunales competentes en Ciudad de México, salvo
          disposiciones protectoras del consumidor.
        </p>
      </LegalSection>

      <LegalSection title="9. Contacto">
        <p>
          Preguntas sobre estos términos:{" "}
          <a href="mailto:hola@morahueso.com" className="text-berry hover:underline">
            hola@morahueso.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
