import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pago pendiente | CIS Academia", description: "Estado pendiente de una compra en CIS Academia.", robots: { index: false, follow: false } };

export default function PurchasePendingPage() {
  return <section className="academy-section purchase-result"><div className="academy-container purchase-result-card"><p className="academy-eyebrow">Estado de la compra</p><h1>Tu pago está pendiente de confirmación</h1><p>Cuando Mercado Pago confirme el pago, el acceso se habilitará automáticamente en Mi Academia.</p><div className="academy-actions"><Link className="academy-button academy-button-primary" href="/academia/mi-academia">Revisar Mi Academia</Link><Link className="academy-button academy-button-secondary" href="/academia/kit-5p">Volver al Kit CIS 5P</Link></div></div></section>;
}
