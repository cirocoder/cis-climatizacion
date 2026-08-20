import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pago recibido | CIS Academia", description: "Estado de la compra en CIS Academia.", robots: { index: false, follow: false } };

export default function PurchaseSuccessPage() {
  return <section className="academy-section purchase-result"><div className="academy-container purchase-result-card"><p className="academy-eyebrow">Estado de la compra</p><h1>Recibimos la confirmación del pago</h1><p>Estamos verificando tu acceso. La redirección no habilita el producto: el acceso aparecerá cuando Mercado Pago confirme el pago de forma segura.</p><div className="academy-actions"><Link className="academy-button academy-button-primary" href="/academia/mi-academia">Ir a Mi Academia</Link><Link className="academy-button academy-button-secondary" href="/academia/kit-5p">Volver al Kit CIS 5P</Link></div></div></section>;
}
