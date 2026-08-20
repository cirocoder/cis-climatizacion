import Link from "next/link";

export default function ProductNotFound() {
  return <section className="academy-section private-product-section"><div className="academy-container access-unavailable"><p className="academy-eyebrow">Mi Academia</p><h1>Contenido no disponible</h1><p>Este producto no está disponible para esta cuenta.</p><Link className="academy-button academy-button-primary" href="/academia/mi-academia">Volver a Mi Academia</Link></div></section>;
}
