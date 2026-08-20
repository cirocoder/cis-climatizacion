import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pago no completado | CIS Academia", description: "Estado de una compra no completada en CIS Academia.", robots: { index: false, follow: false } };

export default function PurchaseErrorPage() {
  return <section className="academy-section purchase-result"><div className="academy-container purchase-result-card"><p className="academy-eyebrow">Estado de la compra</p><h1>No se pudo completar el pago</h1><p>No se habilitó ningún acceso. Podés volver al producto e intentarlo nuevamente.</p><div className="academy-actions"><Link className="academy-button academy-button-primary" href="/academia/kit-5p">Volver al Kit CIS 5P</Link><Link className="academy-button academy-button-secondary" href="/academia/mi-academia">Ir a Mi Academia</Link></div></div></section>;
}
